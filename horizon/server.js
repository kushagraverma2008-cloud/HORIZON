// horizon/server.js
// Standalone Node.js server for Horizon using only built-in modules
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');

const HOST = '127.0.0.1';
const START_PORT = 5173;
const END_PORT = 5183;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');
const BACKUP_FILE = path.join(DATA_DIR, 'tasks.backup.json');
const TMP_FILE = path.join(DATA_DIR, 'tasks.tmp.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB limit
const AUTO_STOP_BYE_DELAY_MS = 10 * 1000; // 10 seconds after bye
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

let byeTimer = null;
let inactivityTimer = null;
let serverInstance = null;
let stateCache = null;
let isDirty = false;

// 1. Ensure Data Directory and File
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialState = {
      version: 1,
      tasks: [],
      settings: {
        theme: 'system',
        range: 'fit',
        reminders: false
      }
    };
    writeStateSync(initialState);
  }
}

// 2. Load State
function loadStateSync() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tasks) && parsed.settings) {
        stateCache = parsed;
        return stateCache;
      }
    }
  } catch (err) {
    console.error('Warning: failed to read tasks.json, trying backup...', err.message);
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.tasks) && parsed.settings) {
          stateCache = parsed;
          return stateCache;
        }
      }
    } catch (bErr) {
      console.error('Failed to read backup:', bErr.message);
    }
  }

  stateCache = {
    version: 1,
    tasks: [],
    settings: {
      theme: 'system',
      range: 'fit',
      reminders: false
    }
  };
  writeStateSync(stateCache);
  return stateCache;
}

// 3. Atomic Write
function writeStateSync(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const jsonStr = JSON.stringify(data, null, 2);

    // Keep backup of last good copy
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (copyErr) {
        // ignore backup copy errors
      }
    }

    fs.writeFileSync(TMP_FILE, jsonStr, 'utf8');
    fs.renameSync(TMP_FILE, DATA_FILE);
    stateCache = data;
    isDirty = false;
  } catch (err) {
    console.error('Error writing data atomically:', err);
    throw err;
  }
}

// Inactivity & Bye Timer Handlers
function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    console.log('No activity for 10 minutes. Shutting down Horizon server.');
    gracefulExit();
  }, INACTIVITY_TIMEOUT_MS);
}

function handleHeartbeat() {
  if (byeTimer) {
    clearTimeout(byeTimer);
    byeTimer = null;
  }
  resetInactivityTimer();
}

function gracefulExit() {
  try {
    if (isDirty && stateCache) {
      writeStateSync(stateCache);
    }
  } catch (e) {
    console.error('Error flushing on exit:', e);
  }
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);
process.on('exit', () => {
  if (isDirty && stateCache) {
    try { writeStateSync(stateCache); } catch (_) {}
  }
});

// MIME Type helper
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ics': 'text/calendar; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// Request Parser helper
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        const err = new Error('Payload Too Large');
        err.statusCode = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        return resolve({});
      }
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf8');
        const parsed = JSON.parse(bodyStr);
        resolve(parsed);
      } catch (err) {
        const parseErr = new Error('Invalid JSON');
        parseErr.statusCode = 400;
        reject(parseErr);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Access-Control-Allow-Origin': '*'
  });
  res.end(json);
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

// Static File Server
function serveStatic(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(PUBLIC_DIR, relativePath));

  // Path traversal guard
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendError(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If requested file not found and doesn't have an extension, try index.html
      if (pathname !== '/' && !path.extname(pathname)) {
        return serveStatic(req, res, '/index.html');
      }
      return sendError(res, 404, 'Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// Request Handler
async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${HOST}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Any incoming request touches heartbeat
  handleHeartbeat();

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- API Routes ---
  if (pathname.startsWith('/api/')) {
    try {
      // GET or POST /api/ping
      if (pathname === '/api/ping') {
        return sendJson(res, 200, { app: 'horizon' });
      }

      // POST /api/bye
      if (pathname === '/api/bye' && method === 'POST') {
        if (byeTimer) clearTimeout(byeTimer);
        byeTimer = setTimeout(() => {
          console.log('Page closed (bye received). Server exiting in 10s.');
          gracefulExit();
        }, AUTO_STOP_BYE_DELAY_MS);
        return sendJson(res, 200, { ok: true });
      }

      // GET /api/state
      if (pathname === '/api/state' && method === 'GET') {
        const state = loadStateSync();
        return sendJson(res, 200, state);
      }

      // POST /api/tasks
      if (pathname === '/api/tasks' && method === 'POST') {
        const body = await readJsonBody(req);
        if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
          return sendError(res, 400, 'Title is required');
        }
        if (body.title.length > 120) {
          return sendError(res, 400, 'Title must be <= 120 characters');
        }
        if (!body.dueAt || isNaN(Date.parse(body.dueAt))) {
          return sendError(res, 400, 'A valid dueAt ISO date string is required');
        }

        const validPriorities = ['low', 'medium', 'high'];
        const priority = validPriorities.includes(body.priority) ? body.priority : 'medium';
        const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : '';

        const nowIso = new Date().toISOString();
        const newTask = {
          id: crypto.randomUUID(),
          title: body.title.trim(),
          notes: notes,
          dueAt: new Date(body.dueAt).toISOString(),
          priority: priority,
          done: false,
          doneAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
          notified: { soon: false, due: false }
        };

        const state = loadStateSync();
        state.tasks.push(newTask);
        writeStateSync(state);

        return sendJson(res, 201, newTask);
      }

      // PUT /api/tasks/:id
      if (pathname.startsWith('/api/tasks/') && method === 'PUT') {
        const taskId = pathname.slice('/api/tasks/'.length);
        const body = await readJsonBody(req);
        const state = loadStateSync();
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
          return sendError(res, 404, 'Task not found');
        }

        const task = state.tasks[taskIndex];
        if (body.title !== undefined) {
          if (typeof body.title !== 'string' || body.title.trim().length === 0) {
            return sendError(res, 400, 'Title cannot be empty');
          }
          task.title = body.title.trim().slice(0, 120);
        }
        if (body.notes !== undefined) {
          task.notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : '';
        }
        if (body.dueAt !== undefined) {
          if (isNaN(Date.parse(body.dueAt))) {
            return sendError(res, 400, 'Invalid dueAt date');
          }
          task.dueAt = new Date(body.dueAt).toISOString();
        }
        if (body.priority !== undefined) {
          if (['low', 'medium', 'high'].includes(body.priority)) {
            task.priority = body.priority;
          }
        }
        if (body.done !== undefined) {
          task.done = Boolean(body.done);
          task.doneAt = task.done ? (body.doneAt ? new Date(body.doneAt).toISOString() : new Date().toISOString()) : null;
        }
        if (body.notified !== undefined && typeof body.notified === 'object') {
          task.notified = {
            soon: Boolean(body.notified.soon),
            due: Boolean(body.notified.due)
          };
        }

        task.updatedAt = new Date().toISOString();
        state.tasks[taskIndex] = task;
        writeStateSync(state);

        return sendJson(res, 200, task);
      }

      // DELETE /api/tasks/:id
      if (pathname.startsWith('/api/tasks/') && method === 'DELETE') {
        const taskId = pathname.slice('/api/tasks/'.length);
        const state = loadStateSync();
        const initialLen = state.tasks.length;
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        if (state.tasks.length === initialLen) {
          return sendError(res, 404, 'Task not found');
        }
        writeStateSync(state);
        return sendJson(res, 200, { ok: true, id: taskId });
      }

      // PUT /api/settings
      if (pathname === '/api/settings' && method === 'PUT') {
        const body = await readJsonBody(req);
        const state = loadStateSync();
        state.settings = state.settings || {};
        if (['system', 'light', 'dark'].includes(body.theme)) {
          state.settings.theme = body.theme;
        }
        if (['fit', '7d', '30d', '90d'].includes(body.range)) {
          state.settings.range = body.range;
        }
        if (body.reminders !== undefined) {
          state.settings.reminders = Boolean(body.reminders);
        }
        writeStateSync(state);
        return sendJson(res, 200, state.settings);
      }

      // GET /api/export
      if (pathname === '/api/export' && method === 'GET') {
        const state = loadStateSync();
        const exportData = {
          version: 1,
          tasks: state.tasks,
          settings: state.settings,
          exportedAt: new Date().toISOString()
        };
        const exportJson = JSON.stringify(exportData, null, 2);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="horizon-backup.json"',
          'Content-Length': Buffer.byteLength(exportJson)
        });
        return res.end(exportJson);
      }

      // POST /api/import
      if (pathname === '/api/import' && method === 'POST') {
        const body = await readJsonBody(req);
        if (!body || !Array.isArray(body.tasks)) {
          return sendError(res, 400, 'Invalid backup format: tasks array required');
        }
        // Validate each task in import
        const validatedTasks = [];
        for (const t of body.tasks) {
          if (!t.title || typeof t.title !== 'string') continue;
          if (!t.dueAt || isNaN(Date.parse(t.dueAt))) continue;
          validatedTasks.push({
            id: typeof t.id === 'string' && t.id ? t.id : crypto.randomUUID(),
            title: t.title.trim().slice(0, 120),
            notes: typeof t.notes === 'string' ? t.notes.slice(0, 500) : '',
            dueAt: new Date(t.dueAt).toISOString(),
            priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium',
            done: Boolean(t.done),
            doneAt: t.doneAt && !isNaN(Date.parse(t.doneAt)) ? new Date(t.doneAt).toISOString() : (t.done ? new Date().toISOString() : null),
            createdAt: t.createdAt && !isNaN(Date.parse(t.createdAt)) ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: t.updatedAt && !isNaN(Date.parse(t.updatedAt)) ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
            notified: {
              soon: Boolean(t.notified && t.notified.soon),
              due: Boolean(t.notified && t.notified.due)
            }
          });
        }

        const settings = {
          theme: ['system', 'light', 'dark'].includes(body.settings?.theme) ? body.settings.theme : 'system',
          range: ['fit', '7d', '30d', '90d'].includes(body.settings?.range) ? body.settings.range : 'fit',
          reminders: Boolean(body.settings?.reminders)
        };

        const newState = {
          version: 1,
          tasks: validatedTasks,
          settings: settings
        };
        writeStateSync(newState);
        return sendJson(res, 200, { ok: true, state: newState });
      }

      return sendError(res, 404, 'API endpoint not found');
    } catch (err) {
      console.error('API Error:', err);
      const code = err.statusCode || 500;
      return sendError(res, code, err.message || 'Internal Server Error');
    }
  }

  // --- Static Files ---
  if (method === 'GET' || method === 'HEAD') {
    return serveStatic(req, res, pathname);
  }

  return sendError(res, 405, 'Method Not Allowed');
}

// 4. Launch Browser Window
function openAppWindow(port) {
  const url = `http://${HOST}:${port}`;
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  const foundEdge = edgePaths.find(p => fs.existsSync(p));
  if (foundEdge) {
    try {
      const child = spawn(foundEdge, [`--app=${url}`, '--window-size=1280,820'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      return;
    } catch (_) {}
  }

  const foundChrome = chromePaths.find(p => fs.existsSync(p));
  if (foundChrome) {
    try {
      const child = spawn(foundChrome, [`--app=${url}`, '--window-size=1280,820'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      return;
    } catch (_) {}
  }

  exec(`start msedge --app=${url} --window-size=1280,820`, (err) => {
    if (err) {
      exec(`start chrome --app=${url} --window-size=1280,820`, (err2) => {
        if (err2) {
          exec(`start "" "${url}"`);
        }
      });
    }
  });
}

// 5. Check if an instance of Horizon is already running
function pingHorizonServer(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${port}/api/ping`, { timeout: 800 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.app === 'horizon') {
            return resolve(true);
          }
        } catch (_) {}
        resolve(false);
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findExistingServer() {
  for (let p = START_PORT; p <= END_PORT; p++) {
    const isHorizon = await pingHorizonServer(p);
    if (isHorizon) {
      return p;
    }
  }
  return null;
}

// 6. Find Free Port and Listen
function tryListen(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(null);
      } else {
        reject(err);
      }
    });
    server.listen(port, HOST, () => {
      resolve(server);
    });
  });
}

async function startServer() {
  ensureDataFile();
  loadStateSync();

  // First check if Horizon is already running on any port 5173..5183
  const existingPort = await findExistingServer();
  if (existingPort) {
    console.log(`Horizon is already running at http://${HOST}:${existingPort}. Opening window...`);
    openAppWindow(existingPort);
    process.exit(0);
    return;
  }

  // Find an available port in the range
  let chosenPort = null;
  for (let p = START_PORT; p <= END_PORT; p++) {
    try {
      const s = await tryListen(p);
      if (s) {
        serverInstance = s;
        chosenPort = p;
        break;
      }
    } catch (err) {
      console.error(`Error probing port ${p}:`, err.message);
    }
  }

  if (!chosenPort || !serverInstance) {
    console.error(`Could not bind to any port between ${START_PORT} and ${END_PORT}.`);
    process.exit(1);
    return;
  }

  console.log(`Horizon is running at http://${HOST}:${chosenPort} - closing this window stops it.`);
  resetInactivityTimer();
  openAppWindow(chosenPort);
}

startServer().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
