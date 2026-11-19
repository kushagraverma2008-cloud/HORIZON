// horizon/public/js/store.js
// Client-side state management, API synchronization, undo stack, and demo data

export class Store {
  constructor() {
    this.tasks = [];
    this.settings = {
      theme: 'system',
      range: 'fit',
      reminders: false
    };
    this.undoStack = []; // Max 10 items
    this.listeners = new Set();
    this.isServerReachable = true;
    this.offlineRetryTimer = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    }
  }

  pushUndo(action) {
    // action: { type, description, undoFn }
    this.undoStack.push(action);
    if (this.undoStack.length > 10) {
      this.undoStack.shift();
    }
  }

  async undo() {
    if (this.undoStack.length === 0) return null;
    const action = this.undoStack.pop();
    try {
      await action.undoFn();
      return action;
    } catch (err) {
      console.error('Failed to undo action:', err);
      return null;
    }
  }

  async apiRequest(endpoint, options = {}) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = `Server error ${res.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed && parsed.error) message = parsed.error;
        } catch (_) {}
        throw new Error(message);
      }

      this.setReachable(true);
      return await res.json();
    } catch (err) {
      if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
        this.setReachable(false);
      }
      throw err;
    }
  }

  setReachable(reachable) {
    if (this.isServerReachable === reachable) return;
    this.isServerReachable = reachable;
    this.notify();

    if (!reachable && !this.offlineRetryTimer) {
      this.offlineRetryTimer = setInterval(async () => {
        try {
          const res = await fetch('/api/ping');
          if (res.ok) {
            clearInterval(this.offlineRetryTimer);
            this.offlineRetryTimer = null;
            this.setReachable(true);
            await this.fetchState();
          }
        } catch (_) {}
      }, 5000);
    }
  }

  async fetchState() {
    try {
      const data = await this.apiRequest('/api/state');
      this.tasks = Array.isArray(data.tasks) ? data.tasks : [];
      this.settings = Object.assign({
        theme: 'system',
        range: 'fit',
        reminders: false
      }, data.settings);
      this.notify();
      return data;
    } catch (err) {
      console.warn('Could not fetch server state:', err.message);
      return null;
    }
  }

  async addTask(taskData, withUndo = true) {
    const created = await this.apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    this.tasks.push(created);

    if (withUndo) {
      this.pushUndo({
        type: 'add',
        description: `Added "${created.title}"`,
        undoFn: async () => {
          await this.deleteTask(created.id, false);
        }
      });
    }

    this.notify();
    return created;
  }

  async updateTask(id, patch, withUndo = true) {
    const existing = this.tasks.find(t => t.id === id);
    if (!existing) return null;
    const oldSnapshot = { ...existing };

    const updated = await this.apiRequest(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch)
    });

    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tasks[idx] = updated;
    }

    if (withUndo) {
      this.pushUndo({
        type: 'edit',
        description: `Updated "${updated.title}"`,
        undoFn: async () => {
          await this.updateTask(id, oldSnapshot, false);
        }
      });
    }

    this.notify();
    return updated;
  }

  async completeTask(id, withUndo = true) {
    const existing = this.tasks.find(t => t.id === id);
    if (!existing) return null;

    const updated = await this.apiRequest(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ done: true, doneAt: new Date().toISOString() })
    });

    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tasks[idx] = updated;
    }

    if (withUndo) {
      this.pushUndo({
        type: 'complete',
        description: `Completed "${existing.title}"`,
        undoFn: async () => {
          await this.updateTask(id, { done: false, doneAt: null }, false);
        }
      });
    }

    this.notify();
    return updated;
  }

  async restoreTask(id, withUndo = true) {
    const existing = this.tasks.find(t => t.id === id);
    if (!existing) return null;

    const updated = await this.apiRequest(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ done: false, doneAt: null })
    });

    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tasks[idx] = updated;
    }

    if (withUndo) {
      this.pushUndo({
        type: 'restore',
        description: `Restored "${existing.title}"`,
        undoFn: async () => {
          await this.completeTask(id, false);
        }
      });
    }

    this.notify();
    return updated;
  }

  async postponeTask(id, days = 1, withUndo = true) {
    const existing = this.tasks.find(t => t.id === id);
    if (!existing) return null;
    const oldDue = existing.dueAt;
    const curDueTime = new Date(existing.dueAt).getTime();
    const newDueIso = new Date(curDueTime + days * 24 * 3600 * 1000).toISOString();

    const updated = await this.apiRequest(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ dueAt: newDueIso })
    });

    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tasks[idx] = updated;
    }

    if (withUndo) {
      this.pushUndo({
        type: 'postpone',
        description: `Postponed "${existing.title}" by +${days}d`,
        undoFn: async () => {
          await this.updateTask(id, { dueAt: oldDue }, false);
        }
      });
    }

    this.notify();
    return updated;
  }

  async deleteTask(id, withUndo = true) {
    const existing = this.tasks.find(t => t.id === id);
    if (!existing) return;
    const oldSnapshot = { ...existing };

    await this.apiRequest(`/api/tasks/${id}`, {
      method: 'DELETE'
    });

    this.tasks = this.tasks.filter(t => t.id !== id);

    if (withUndo) {
      this.pushUndo({
        type: 'delete',
        description: `Deleted "${existing.title}"`,
        undoFn: async () => {
          await this.addTask(oldSnapshot, false);
        }
      });
    }

    this.notify();
  }

  async updateSettings(patch) {
    this.settings = { ...this.settings, ...patch };
    this.notify();
    const updated = await this.apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(patch)
    });
    this.settings = Object.assign(this.settings, updated);
    this.notify();
    return this.settings;
  }

  async clearAllDone() {
    const doneTasks = this.tasks.filter(t => t.done);
    for (const t of doneTasks) {
      await this.apiRequest(`/api/tasks/${t.id}`, { method: 'DELETE' });
    }
    this.tasks = this.tasks.filter(t => !t.done);
    this.notify();
  }

  async deleteAllData() {
    for (const t of this.tasks) {
      await this.apiRequest(`/api/tasks/${t.id}`, { method: 'DELETE' });
    }
    this.tasks = [];
    this.settings = { theme: 'system', range: 'fit', reminders: false };
    await this.apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(this.settings)
    });
    this.notify();
  }

  async loadDemoTasks() {
    // Specs Section 9:
    // Demo tasks:
    // 1. "Submit assignment" tomorrow 6 PM (high)
    // 2. "Prepare presentation" in 3 days 6 PM (medium)
    // 3. "Plan budget for trip" in 30 days 6 PM (low)
    const now = new Date();

    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0, 0, 0);
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 18, 0, 0, 0);
    const d3 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 18, 0, 0, 0);

    const demos = [
      {
        title: 'Submit assignment',
        notes: 'Final assignment submission CS-402 with code repo and documentation',
        dueAt: d1.toISOString(),
        priority: 'high'
      },
      {
        title: 'Prepare presentation',
        notes: 'Design team review slides 1–8 and interactive demo prototype',
        dueAt: d2.toISOString(),
        priority: 'medium'
      },
      {
        title: 'Plan budget for trip',
        notes: 'Flight, hotel reservations, and weekend itinerary checklist',
        dueAt: d3.toISOString(),
        priority: 'low'
      }
    ];

    for (const d of demos) {
      await this.addTask(d, false);
    }
  }

  exportBackup() {
    window.location.href = '/api/export';
  }

  async importBackup(jsonData) {
    const res = await this.apiRequest('/api/import', {
      method: 'POST',
      body: typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData)
    });
    if (res && res.state) {
      this.tasks = res.state.tasks;
      this.settings = res.state.settings;
      this.notify();
    }
    return res;
  }
}
