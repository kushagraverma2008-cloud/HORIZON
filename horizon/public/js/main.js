// horizon/public/js/main.js
// Application bootstrapper and wiring

import { Store } from './store.js';
import { TimelineEngine } from './timeline.js';
import { ReminderManager } from './notify.js';
import { UIManager } from './ui.js';
import { parseQuickAdd } from './parser.js';
import { formatFriendlyDue } from './time.js';

document.addEventListener('DOMContentLoaded', async () => {
  const store = new Store();

  // Timeline Container
  const timelineContainer = document.getElementById('timeline-canvas-container');

  // Timeline Engine
  const timeline = new TimelineEngine({
    container: timelineContainer,
    onTaskClick: (task, rect) => {
      ui.openDetailsPopover(task, rect);
    },
    onTaskReschedule: async (taskId, newDueIso, oldDueIso) => {
      await store.updateTask(taskId, { dueAt: newDueIso });
      ui.showUndoToast(`Rescheduled task to ${formatFriendlyDue(newDueIso)}`);
    },
    onClusterClick: (tasks, rect, type) => {
      ui.openClusterPopover(tasks, rect, type);
    },
    onRangeChange: async (range) => {
      await store.updateSettings({ range });
    },
    onHoverTask: (taskId) => {
      // Highlight corresponding row in list
      const row = document.querySelector(`.task-row[data-task-id="${taskId}"]`);
      if (row) row.classList.add('is-hover-highlighted');
    },
    onLeaveTask: (taskId) => {
      const row = document.querySelector(`.task-row[data-task-id="${taskId}"]`);
      if (row) row.classList.remove('is-hover-highlighted');
    },
    onOpenModal: () => {
      ui.openAddModal();
    },
    onLoadDemo: async () => {
      await store.loadDemoTasks();
      ui.showToast('Loaded 3 sample tasks', 'info');
    }
  });

  // UI Manager
  const ui = new UIManager(store, timeline);

  // Reminders Manager
  const reminders = new ReminderManager(store, (msg, type) => {
    ui.showToast(msg, type || 'info');
  });

  // Theme resolution helper
  function applyTheme(theme) {
    let resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    ui.renderTopBar();
  }

  // Listen to system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.settings.theme === 'system') {
      applyTheme('system');
    }
  });

  // Wire Store subscriptions
  store.subscribe((s) => {
    applyTheme(s.settings.theme || 'system');
    timeline.setData(s.tasks, s.settings.range || 'fit');
    ui.renderTopBar();
    ui.renderTaskList();
  });

  // Quick Add Parser & Ghost Dot wiring
  const quickInput = document.getElementById('quick-add-input');
  const quickBtn = document.getElementById('quick-add-button');
  const quickPreview = document.getElementById('quick-add-preview');
  const previewText = document.getElementById('quick-add-preview-text');

  function updateQuickPreview() {
    const val = quickInput.value;
    if (!val || !val.trim()) {
      quickPreview.style.opacity = '0';
      quickPreview.style.pointerEvents = 'none';
      timeline.clearGhost();
      return;
    }

    const parsed = parseQuickAdd(val);
    if (parsed.parsed && parsed.dueAt) {
      quickPreview.style.opacity = '1';
      quickPreview.style.pointerEvents = 'auto';
      previewText.textContent = `→ ${formatFriendlyDue(parsed.dueAt)}`;
      timeline.setGhost(parsed.dueAt, parsed.title);
    } else {
      quickPreview.style.opacity = '0';
      quickPreview.style.pointerEvents = 'none';
      timeline.clearGhost();
    }
  }

  quickInput.addEventListener('input', updateQuickPreview);

  async function submitQuickAdd() {
    const val = quickInput.value.trim();
    if (!val) return;

    const parsed = parseQuickAdd(val);
    if (parsed.parsed && parsed.dueAt) {
      // Add immediately!
      const newTask = {
        title: parsed.title,
        dueAt: parsed.dueAt.toISOString(),
        priority: parsed.priority,
        notes: ''
      };
      quickInput.value = '';
      updateQuickPreview();
      await store.addTask(newTask);
      ui.showUndoToast(`Added "${parsed.title}"`);
    } else {
      // Nothing parsed -> open Add Task modal with title prefilled (never guess silently)
      const titleToPrefill = parsed.title || val;
      quickInput.value = '';
      updateQuickPreview();
      ui.openAddModal(titleToPrefill);
    }
  }

  quickInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await submitQuickAdd();
    }
  });

  quickBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await submitQuickAdd();
  });

  // Auto-stop: POST /api/ping every 20s and sendBeacon /api/bye on pagehide
  setInterval(() => {
    fetch('/api/ping', { method: 'POST' }).catch(() => {});
  }, 20000);

  window.addEventListener('pagehide', () => {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/bye');
    } else {
      fetch('/api/bye', { method: 'POST', keepalive: true }).catch(() => {});
    }
  });

  // Live timeline refresh every 30s and on window focus
  setInterval(() => {
    timeline.setData(store.tasks, store.settings.range || 'fit');
  }, 30000);

  window.addEventListener('focus', () => {
    timeline.setData(store.tasks, store.settings.range || 'fit');
  });

  // Initial State Fetch
  await store.fetchState();

  // Initialize reminders
  reminders.init();
});
