// horizon/public/js/ui.js
// DOM rendering for task list, modals, popovers, drawer, toasts, and keyboard interactions

import {
  formatTime,
  formatFriendlyDue,
  formatFullDate,
  formatCountdown,
  formatRelativeShort,
  formatDateForInput,
  formatTimeForInput,
  parseDateTimeInputs,
  generateIcs
} from './time.js';

/**
 * Escapes user-supplied strings to prevent any HTML injection
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class UIManager {
  constructor(store, timelineEngine) {
    this.store = store;
    this.timeline = timelineEngine;

    this.activeTab = 'upnext'; // 'upnext' | 'done'
    this.activePopoverTask = null;
    this.activeClusterTasks = null;
    this.editingTaskId = null;
    this.focusedDotIndex = -1;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Top bar elements
    this.rangeSelectBtns = document.querySelectorAll('[data-range]');
    this.nextTaskChip = document.getElementById('next-task-chip');
    this.nextTaskText = document.getElementById('next-task-text');
    this.nextTaskCountdown = document.getElementById('next-task-countdown');
    this.overdueChip = document.getElementById('overdue-chip');
    this.overdueCount = document.getElementById('overdue-count');
    this.themeToggleBtn = document.getElementById('btn-theme-toggle');
    this.settingsOpenBtn = document.getElementById('btn-settings-open');

    // List card elements
    this.tabUpNextBtn = document.getElementById('tab-btn-upnext');
    this.tabDoneBtn = document.getElementById('tab-btn-done');
    this.tabUpNextCount = document.getElementById('tab-count-upnext');
    this.tabDoneCount = document.getElementById('tab-count-done');
    this.taskRowsContainer = document.getElementById('task-rows-container');
    this.listEmptyContainer = document.getElementById('list-empty-container');
    this.clearDoneBtn = document.getElementById('btn-clear-done');

    // Quick Add Bar elements
    this.quickAddInput = document.getElementById('quick-add-input');
    this.quickAddBtn = document.getElementById('quick-add-button');
    this.quickAddPreview = document.getElementById('quick-add-preview');
    this.btnOpenNewTaskModal = document.getElementById('btn-open-new-task');

    // Modal elements
    this.modalOverlay = document.getElementById('task-modal-overlay');
    this.modalForm = document.getElementById('task-modal-form');
    this.modalTitleInput = document.getElementById('modal-task-title');
    this.modalTitleCount = document.getElementById('modal-title-count');
    this.modalDateInput = document.getElementById('modal-task-date');
    this.modalTimeInput = document.getElementById('modal-task-time');
    this.modalPriorityBtns = document.querySelectorAll('[data-modal-priority]');
    this.modalNotesInput = document.getElementById('modal-task-notes');
    this.modalPastWarning = document.getElementById('modal-past-warning');
    this.modalDeleteBtn = document.getElementById('btn-modal-delete');
    this.modalCancelBtn = document.getElementById('btn-modal-cancel');
    this.modalCloseBtn = document.getElementById('btn-modal-close');
    this.modalHeading = document.getElementById('modal-heading');
    this.modalQuickChips = document.querySelectorAll('[data-modal-quick]');

    // Details Popover elements
    this.popoverOverlay = document.getElementById('details-popover-overlay');
    this.popoverCard = document.getElementById('task-details-popover');
    this.popoverArrow = document.getElementById('popover-arrow');
    this.popoverTitle = document.getElementById('popover-title');
    this.popoverCountdown = document.getElementById('popover-countdown');
    this.popoverPriority = document.getElementById('popover-priority');
    this.popoverDateTime = document.getElementById('popover-datetime');
    this.popoverNotesBlock = document.getElementById('popover-notes-block');
    this.popoverNotesText = document.getElementById('popover-notes-text');
    this.popoverBtnComplete = document.getElementById('popover-btn-complete');
    this.popoverBtnPostpone = document.getElementById('popover-btn-postpone');
    this.popoverBtnEdit = document.getElementById('popover-btn-edit');
    this.popoverBtnIcs = document.getElementById('popover-btn-ics');
    this.popoverBtnDelete = document.getElementById('popover-btn-delete');
    this.popoverBtnClose = document.getElementById('popover-btn-close');

    // Cluster Popover elements
    this.clusterPopover = document.getElementById('cluster-popover');
    this.clusterTitle = document.getElementById('cluster-popover-title');
    this.clusterList = document.getElementById('cluster-popover-list');
    this.clusterCloseBtn = document.getElementById('cluster-popover-close');

    // Settings Drawer elements
    this.drawerOverlay = document.getElementById('settings-drawer-overlay');
    this.drawerPanel = document.getElementById('settings-drawer');
    this.drawerCloseBtn = document.getElementById('btn-drawer-close');
    this.themeSystemBtn = document.getElementById('theme-opt-system');
    this.themeLightBtn = document.getElementById('theme-opt-light');
    this.themeDarkBtn = document.getElementById('theme-opt-dark');
    this.remindersToggle = document.getElementById('reminders-toggle-checkbox');
    this.remindersHint = document.getElementById('reminders-hint-text');
    this.btnExportBackup = document.getElementById('btn-export-backup');
    this.btnImportBackup = document.getElementById('btn-import-backup');
    this.importFileInput = document.getElementById('import-file-input');
    this.btnLoadDemo = document.getElementById('btn-load-demo');
    this.btnDeleteAll = document.getElementById('btn-delete-all');

    // Toasts element
    this.toastContainer = document.getElementById('toast-container');

    // Row Action Menu (floating)
    this.rowMenuEl = document.getElementById('row-actions-menu');
  }

  bindEvents() {
    // 1. Range selector in top bar
    this.rangeSelectBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const range = btn.dataset.range;
        this.store.updateSettings({ range });
      });
    });

    // 2. Next task chip click -> opens details
    if (this.nextTaskChip) {
      this.nextTaskChip.addEventListener('click', () => {
        const nextTask = this.getNextUpcomingTask();
        if (nextTask) {
          const rect = this.nextTaskChip.getBoundingClientRect();
          this.openDetailsPopover(nextTask, rect);
        }
      });
    }

    // 3. Overdue chip click -> scroll to first overdue row
    if (this.overdueChip) {
      this.overdueChip.addEventListener('click', () => {
        this.activeTab = 'upnext';
        this.renderTaskList();
        const firstOverdue = this.taskRowsContainer.querySelector('.task-row.is-overdue');
        if (firstOverdue) {
          firstOverdue.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstOverdue.classList.add('flash-highlight');
          setTimeout(() => firstOverdue.classList.remove('flash-highlight'), 1200);
        }
      });
    }

    // 4. Theme toggle button (Sun/Moon)
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = curTheme === 'dark' ? 'light' : 'dark';
        this.store.updateSettings({ theme: newTheme });
      });
    }

    // 5. Settings button
    if (this.settingsOpenBtn) {
      this.settingsOpenBtn.addEventListener('click', () => this.openSettingsDrawer());
    }

    // 6. Tabs
    if (this.tabUpNextBtn) {
      this.tabUpNextBtn.addEventListener('click', () => {
        this.activeTab = 'upnext';
        this.updateTabStyles();
        this.renderTaskList();
      });
    }
    if (this.tabDoneBtn) {
      this.tabDoneBtn.addEventListener('click', () => {
        this.activeTab = 'done';
        this.updateTabStyles();
        this.renderTaskList();
      });
    }
    if (this.clearDoneBtn) {
      this.clearDoneBtn.addEventListener('click', () => {
        if (confirm('Clear all completed tasks from history?')) {
          this.store.clearAllDone();
          this.showToast('Cleared all done tasks', 'info');
        }
      });
    }

    // 7. Modal Open & Close
    if (this.btnOpenNewTaskModal) {
      this.btnOpenNewTaskModal.addEventListener('click', () => this.openAddModal());
    }
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalCancelBtn) {
      this.modalCancelBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) this.closeModal();
      });
    }

    // 8. Modal Title char counter & Ghost dot preview
    if (this.modalTitleInput) {
      this.modalTitleInput.addEventListener('input', () => {
        const len = this.modalTitleInput.value.length;
        if (this.modalTitleCount) this.modalTitleCount.textContent = `${len}/120`;
      });
    }
    const updateModalGhost = () => {
      const dateVal = this.modalDateInput.value;
      const timeVal = this.modalTimeInput.value;
      const titleVal = this.modalTitleInput.value;
      if (dateVal) {
        const parsedDate = parseDateTimeInputs(dateVal, timeVal);
        this.timeline.setGhost(parsedDate, titleVal);
        if (parsedDate.getTime() < Date.now()) {
          this.modalPastWarning.style.display = 'flex';
        } else {
          this.modalPastWarning.style.display = 'none';
        }
      }
    };
    if (this.modalDateInput) this.modalDateInput.addEventListener('input', updateModalGhost);
    if (this.modalTimeInput) this.modalTimeInput.addEventListener('input', updateModalGhost);

    // 9. Modal Quick Date chips
    this.modalQuickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const target = chip.dataset.modalQuick;
        const now = new Date();
        let targetDate = new Date();
        if (target === 'today') {
          targetDate = now;
        } else if (target === 'tomorrow') {
          targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        } else if (target === 'in3d') {
          targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
        } else if (target === 'nextweek') {
          targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        } else if (target === 'nextmonth') {
          const maxDays = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate();
          const day = Math.min(now.getDate(), maxDays);
          targetDate = new Date(now.getFullYear(), now.getMonth() + 1, day);
        }
        this.modalDateInput.value = formatDateForInput(targetDate);
        this.modalQuickChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        updateModalGhost();
      });
    });

    // 10. Modal Priority Segmented Control
    this.modalPriorityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.modalPriorityBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });

    // 11. Modal Form Submit
    if (this.modalForm) {
      this.modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleModalSave();
      });
    }
    if (this.modalDeleteBtn) {
      this.modalDeleteBtn.addEventListener('click', async () => {
        if (this.editingTaskId) {
          const id = this.editingTaskId;
          this.closeModal();
          await this.store.deleteTask(id);
          this.showUndoToast('Task deleted');
        }
      });
    }

    // 12. Details Popover Buttons
    if (this.popoverBtnClose) {
      this.popoverBtnClose.addEventListener('click', () => this.closeDetailsPopover());
    }
    if (this.popoverBtnComplete) {
      this.popoverBtnComplete.addEventListener('click', async () => {
        if (!this.activePopoverTask) return;
        const task = this.activePopoverTask;
        this.closeDetailsPopover();
        await this.store.completeTask(task.id);
        this.showUndoToast(`Completed "${task.title}"`);
      });
    }
    if (this.popoverBtnPostpone) {
      this.popoverBtnPostpone.addEventListener('click', async () => {
        if (!this.activePopoverTask) return;
        const task = this.activePopoverTask;
        this.closeDetailsPopover();
        await this.store.postponeTask(task.id, 1);
        this.showUndoToast(`Postponed "${task.title}" by +1d`);
      });
    }
    if (this.popoverBtnEdit) {
      this.popoverBtnEdit.addEventListener('click', () => {
        if (!this.activePopoverTask) return;
        const task = this.activePopoverTask;
        this.closeDetailsPopover();
        this.openEditModal(task);
      });
    }
    if (this.popoverBtnIcs) {
      this.popoverBtnIcs.addEventListener('click', () => {
        if (!this.activePopoverTask) return;
        this.downloadIcs(this.activePopoverTask);
      });
    }
    if (this.popoverBtnDelete) {
      this.popoverBtnDelete.addEventListener('click', async () => {
        if (!this.activePopoverTask) return;
        const task = this.activePopoverTask;
        this.closeDetailsPopover();
        await this.store.deleteTask(task.id);
        this.showUndoToast(`Deleted "${task.title}"`);
      });
    }
    if (this.popoverOverlay) {
      this.popoverOverlay.addEventListener('click', (e) => {
        if (e.target === this.popoverOverlay) {
          this.closeDetailsPopover();
        }
      });
    }

    // 13. Cluster Popover Close
    if (this.clusterCloseBtn) {
      this.clusterCloseBtn.addEventListener('click', () => {
        this.closeClusterPopover();
      });
    }

    // 14. Settings Drawer Events
    if (this.drawerCloseBtn) {
      this.drawerCloseBtn.addEventListener('click', () => this.closeSettingsDrawer());
    }
    if (this.drawerOverlay) {
      this.drawerOverlay.addEventListener('click', (e) => {
        if (e.target === this.drawerOverlay) this.closeSettingsDrawer();
      });
    }
    if (this.themeSystemBtn) {
      this.themeSystemBtn.addEventListener('click', () => this.store.updateSettings({ theme: 'system' }));
    }
    if (this.themeLightBtn) {
      this.themeLightBtn.addEventListener('click', () => this.store.updateSettings({ theme: 'light' }));
    }
    if (this.themeDarkBtn) {
      this.themeDarkBtn.addEventListener('click', () => this.store.updateSettings({ theme: 'dark' }));
    }
    if (this.remindersToggle) {
      this.remindersToggle.addEventListener('change', async () => {
        const enabled = this.remindersToggle.checked;
        if (enabled && typeof Notification !== 'undefined') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            this.remindersHint.textContent = 'Browser notification permission was denied.';
            this.remindersHint.style.color = 'var(--color-overdue)';
          } else {
            this.remindersHint.textContent = 'Push alerts enabled for milestones.';
            this.remindersHint.style.color = '';
          }
        }
        await this.store.updateSettings({ reminders: enabled });
      });
    }
    if (this.btnExportBackup) {
      this.btnExportBackup.addEventListener('click', () => this.store.exportBackup());
    }
    if (this.btnImportBackup) {
      this.btnImportBackup.addEventListener('click', () => this.importFileInput.click());
    }
    if (this.importFileInput) {
      this.importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (confirm(`Restore ${parsed.tasks?.length || 0} tasks from "${file.name}"? This replaces current tasks.`)) {
            await this.store.importBackup(parsed);
            this.showToast('Workspace backup restored successfully', 'success');
            this.closeSettingsDrawer();
          }
        } catch (err) {
          alert('Invalid backup file: ' + err.message);
        }
        this.importFileInput.value = '';
      });
    }
    if (this.btnLoadDemo) {
      this.btnLoadDemo.addEventListener('click', async () => {
        await this.store.loadDemoTasks();
        this.showToast('Loaded 3 sample tasks', 'info');
        this.closeSettingsDrawer();
      });
    }
    if (this.btnDeleteAll) {
      this.btnDeleteAll.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete ALL tasks and settings?')) {
          if (confirm('This action is irreversible. Really delete all data?')) {
            await this.store.deleteAllData();
            this.showToast('All workspace data deleted', 'warning');
            this.closeSettingsDrawer();
          }
        }
      });
    }

    // 15. Global Click for Row Context Menu
    window.addEventListener('click', (e) => {
      if (this.rowMenuEl && !e.target.closest('#row-actions-menu') && !e.target.closest('.btn-row-more')) {
        this.closeRowMenu();
      }
    });

    // 16. Keyboard Shortcuts as defined in Section 16:
    // N new task, / quick add, Esc close anything open, Ctrl+Z undo, T toggle theme,
    // Left/Right arrows move focus between dots, Enter open the focused dot, Delete delete the focused task
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputActive = activeTag === 'input' || activeTag === 'textarea';

      // Global Esc
      if (e.key === 'Escape') {
        this.closeAllModalsAndPopovers();
        return;
      }

      // Global Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !isInputActive) {
        e.preventDefault();
        this.handleUndo();
        return;
      }

      // '/' focuses quick add from anywhere
      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        if (this.quickAddInput) {
          this.quickAddInput.focus();
          this.quickAddInput.select();
        }
        return;
      }

      // N opens new task modal
      if ((e.key === 'n' || e.key === 'N') && !isInputActive) {
        e.preventDefault();
        this.openAddModal();
        return;
      }

      // T toggles theme
      if ((e.key === 't' || e.key === 'T') && !isInputActive) {
        e.preventDefault();
        const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = curTheme === 'dark' ? 'light' : 'dark';
        this.store.updateSettings({ theme: newTheme });
        return;
      }

      // Left/Right arrows cycle dots on timeline
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !isInputActive) {
        const dots = Array.from(document.querySelectorAll('.timeline-dot, .timeline-cluster-bubble'));
        if (dots.length > 0) {
          e.preventDefault();
          if (e.key === 'ArrowRight') {
            this.focusedDotIndex = (this.focusedDotIndex + 1) % dots.length;
          } else {
            this.focusedDotIndex = (this.focusedDotIndex - 1 + dots.length) % dots.length;
          }
          dots[this.focusedDotIndex].focus();
        }
        return;
      }

      // Delete deletes focused task
      if (e.key === 'Delete' && !isInputActive) {
        if (document.activeElement && document.activeElement.classList.contains('timeline-dot')) {
          const taskId = document.activeElement.dataset.taskId;
          if (taskId) {
            e.preventDefault();
            this.store.deleteTask(taskId);
            this.showUndoToast('Task deleted');
          }
        }
      }
    });
  }

  closeAllModalsAndPopovers() {
    this.closeModal();
    this.closeDetailsPopover();
    this.closeClusterPopover();
    this.closeSettingsDrawer();
    this.closeRowMenu();
    this.timeline.clearGhost();
  }

  // --- Render Top Bar Meta Information ---

  renderTopBar() {
    // 1. Next task countdown chip
    const nextTask = this.getNextUpcomingTask();
    if (nextTask) {
      this.nextTaskChip.style.display = 'inline-flex';
      this.nextTaskText.textContent = nextTask.title;
      this.nextTaskCountdown.textContent = `· ${formatCountdown(nextTask.dueAt)}`;
    } else {
      this.nextTaskChip.style.display = 'none';
    }

    // 2. Overdue count chip
    const overdueCount = this.store.tasks.filter(t => !t.done && new Date(t.dueAt).getTime() < Date.now()).length;
    if (overdueCount > 0) {
      this.overdueChip.style.display = 'inline-flex';
      this.overdueCount.textContent = `${overdueCount} overdue`;
    } else {
      this.overdueChip.style.display = 'none';
    }

    // 3. Range active pill
    const curRange = this.store.settings.range || 'fit';
    this.rangeSelectBtns.forEach(btn => {
      if (btn.dataset.range === curRange) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('is-active');
        btn.removeAttribute('aria-current');
      }
    });

    // 4. Theme icon in top bar
    const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const iconSpan = this.themeToggleBtn ? this.themeToggleBtn.querySelector('.theme-icon') : null;
    if (iconSpan) {
      iconSpan.textContent = curTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  getNextUpcomingTask() {
    const now = Date.now();
    const upcoming = this.store.tasks
      .filter(t => !t.done && new Date(t.dueAt).getTime() >= now)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    return upcoming[0] || null;
  }

  // --- Render Task List (Up Next & Done) ---

  updateTabStyles() {
    if (this.activeTab === 'upnext') {
      this.tabUpNextBtn.classList.add('is-active');
      this.tabDoneBtn.classList.remove('is-active');
      this.clearDoneBtn.style.display = 'none';
    } else {
      this.tabUpNextBtn.classList.remove('is-active');
      this.tabDoneBtn.classList.add('is-active');
      this.clearDoneBtn.style.display = 'inline-flex';
    }
  }

  renderTaskList() {
    const nowMs = Date.now();
    const allTasks = this.store.tasks;

    const upNextTasks = allTasks.filter(t => !t.done);
    // Sort up next: overdue first (sorted by dueAt ascending), then upcoming (dueAt ascending)
    upNextTasks.sort((a, b) => {
      const aTime = new Date(a.dueAt).getTime();
      const bTime = new Date(b.dueAt).getTime();
      const aOverdue = aTime < nowMs;
      const bOverdue = bTime < nowMs;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return aTime - bTime;
    });

    const doneTasks = allTasks
      .filter(t => t.done)
      .sort((a, b) => {
        const aDone = a.doneAt ? new Date(a.doneAt).getTime() : 0;
        const bDone = b.doneAt ? new Date(b.doneAt).getTime() : 0;
        return bDone - aDone;
      });

    this.tabUpNextCount.textContent = String(upNextTasks.length);
    this.tabDoneCount.textContent = String(doneTasks.length);

    this.taskRowsContainer.innerHTML = '';
    const currentList = this.activeTab === 'upnext' ? upNextTasks : doneTasks;

    if (currentList.length === 0) {
      this.listEmptyContainer.style.display = 'flex';
      this.listEmptyContainer.querySelector('.list-empty-msg').textContent =
        this.activeTab === 'upnext'
          ? 'No pending tasks. You are all caught up!'
          : 'No completed tasks yet.';
      return;
    } else {
      this.listEmptyContainer.style.display = 'none';
    }

    currentList.forEach(task => {
      const row = this.createTaskRowElement(task);
      this.taskRowsContainer.appendChild(row);
    });
  }

  createTaskRowElement(task) {
    const row = document.createElement('div');
    row.className = 'task-row group';
    row.dataset.taskId = task.id;

    const dueTime = new Date(task.dueAt).getTime();
    const isOverdue = !task.done && dueTime < Date.now();
    if (isOverdue) row.classList.add('is-overdue');
    if (task.done) row.classList.add('is-done');

    // Left Column: Checkbox, Urgency Dot, Title
    const leftCol = document.createElement('div');
    leftCol.className = 'row-left';

    // Round checkbox
    const chkBtn = document.createElement('button');
    chkBtn.type = 'button';
    chkBtn.className = `task-checkbox ${task.done ? 'is-checked' : ''}`;
    chkBtn.setAttribute('aria-label', task.done ? 'Mark as incomplete' : 'Mark as complete');
    chkBtn.innerHTML = `
      <svg class="chk-check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    chkBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (task.done) {
        await this.store.restoreTask(task.id);
        this.showUndoToast(`Restored "${task.title}"`);
      } else {
        await this.store.completeTask(task.id);
        this.showUndoToast(`Completed "${task.title}"`);
      }
    });
    leftCol.appendChild(chkBtn);

    // Colored dot matching timeline urgency
    const dotSpan = document.createElement('span');
    dotSpan.className = 'row-urgency-dot';
    const hoursLeft = (dueTime - Date.now()) / 3600000;
    if (isOverdue) {
      dotSpan.classList.add('urgency-overdue');
    } else if (hoursLeft < 24) {
      dotSpan.classList.add('urgency-24h');
    } else if (hoursLeft < 72) {
      dotSpan.classList.add('urgency-3d');
    } else {
      dotSpan.classList.add('urgency-later');
    }
    leftCol.appendChild(dotSpan);

    // Title (properly textContent escaped)
    const titleSpan = document.createElement('span');
    titleSpan.className = 'row-title';
    titleSpan.textContent = task.title;
    leftCol.appendChild(titleSpan);

    // Notes indicator if notes exist
    if (task.notes && task.notes.trim()) {
      const noteBadge = document.createElement('span');
      noteBadge.className = 'row-notes-badge';
      noteBadge.title = task.notes;
      noteBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
      leftCol.appendChild(noteBadge);
    }

    row.appendChild(leftCol);

    // Right Column: Relative time, Priority pill, "..." Menu / Restore
    const rightCol = document.createElement('div');
    rightCol.className = 'row-right';

    // Relative Time text
    const timeSpan = document.createElement('span');
    timeSpan.className = `row-time ${isOverdue ? 'text-overdue' : ''}`;
    timeSpan.textContent = formatRelativeShort(task.dueAt);
    timeSpan.title = formatFriendlyDue(task.dueAt);
    rightCol.appendChild(timeSpan);

    // Priority Pill
    const priPill = document.createElement('span');
    priPill.className = `pri-pill pri-${task.priority || 'medium'}`;
    priPill.textContent = (task.priority || 'medium').toUpperCase();
    rightCol.appendChild(priPill);

    if (task.done) {
      // Restore Button
      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.className = 'btn btn-sm btn-secondary';
      restoreBtn.textContent = 'Restore';
      restoreBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.store.restoreTask(task.id);
        this.showUndoToast(`Restored "${task.title}"`);
      });
      rightCol.appendChild(restoreBtn);
    } else {
      // "..." action menu button
      const moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'btn-row-more';
      moreBtn.setAttribute('aria-label', 'Task options');
      moreBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      `;
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openRowMenu(task, moreBtn.getBoundingClientRect());
      });
      rightCol.appendChild(moreBtn);
    }

    row.appendChild(rightCol);

    // Row hover interaction: highlights corresponding timeline dot
    row.addEventListener('mouseenter', () => {
      this.timeline.setHighlight(task.id);
    });
    row.addEventListener('mouseleave', () => {
      this.timeline.clearHighlight();
    });

    // Row click: opens details popover
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const rect = row.getBoundingClientRect();
      this.openDetailsPopover(task, rect);
    });

    return row;
  }

  // --- Row Action Menu (Edit, +1 day, Delete) ---

  openRowMenu(task, anchorRect) {
    if (!this.rowMenuEl) return;
    this.rowMenuEl.style.display = 'block';
    this.rowMenuEl.dataset.taskId = task.id;

    // Position menu near the button
    const menuWidth = 140;
    let left = anchorRect.left - menuWidth + anchorRect.width;
    let top = anchorRect.bottom + 4;
    if (left < 10) left = 10;
    if (top + 120 > window.innerHeight) top = anchorRect.top - 124;

    this.rowMenuEl.style.left = `${left}px`;
    this.rowMenuEl.style.top = `${top}px`;

    // Bind item clicks
    const editItem = this.rowMenuEl.querySelector('[data-menu-action="edit"]');
    const postponeItem = this.rowMenuEl.querySelector('[data-menu-action="postpone"]');
    const deleteItem = this.rowMenuEl.querySelector('[data-menu-action="delete"]');

    editItem.onclick = (e) => {
      e.stopPropagation();
      this.closeRowMenu();
      this.openEditModal(task);
    };
    postponeItem.onclick = async (e) => {
      e.stopPropagation();
      this.closeRowMenu();
      await this.store.postponeTask(task.id, 1);
      this.showUndoToast(`Postponed "${task.title}" by +1d`);
    };
    deleteItem.onclick = async (e) => {
      e.stopPropagation();
      this.closeRowMenu();
      await this.store.deleteTask(task.id);
      this.showUndoToast(`Deleted "${task.title}"`);
    };
  }

  closeRowMenu() {
    if (this.rowMenuEl) {
      this.rowMenuEl.style.display = 'none';
      this.rowMenuEl.dataset.taskId = '';
    }
  }

  // --- Details Popover ---

  openDetailsPopover(task, anchorRect) {
    this.activePopoverTask = task;
    this.popoverOverlay.style.display = 'block';
    this.popoverCard.style.display = 'block';

    // Populate data
    this.popoverTitle.textContent = task.title;
    this.popoverCountdown.textContent = formatCountdown(task.dueAt);
    this.popoverPriority.textContent = `${(task.priority || 'medium').toUpperCase()} PRIORITY`;
    this.popoverPriority.className = `pri-pill pri-${task.priority || 'medium'}`;
    this.popoverDateTime.textContent = `${formatFullDate(task.dueAt)} · ${formatTime(task.dueAt)}`;

    if (task.notes && task.notes.trim()) {
      this.popoverNotesBlock.style.display = 'block';
      this.popoverNotesText.textContent = task.notes;
    } else {
      this.popoverNotesBlock.style.display = 'none';
    }

    // Dynamic positioning & flipping to stay inside viewport
    const popoverWidth = 370;
    const popoverHeight = this.popoverCard.offsetHeight || 260;

    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
    let top = anchorRect.top - popoverHeight - 14; // Default above

    // Flip below if not enough room above
    let placeBelow = false;
    if (top < 16) {
      top = anchorRect.bottom + 14;
      placeBelow = true;
    }

    // Clamp horizontally
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - 16 - popoverWidth;
    }

    this.popoverCard.style.left = `${left}px`;
    this.popoverCard.style.top = `${top}px`;

    // Position arrow pointing to the anchor
    const arrowX = Math.max(16, Math.min(popoverWidth - 16, anchorRect.left + anchorRect.width / 2 - left));
    this.popoverArrow.style.left = `${arrowX}px`;
    if (placeBelow) {
      this.popoverArrow.classList.add('is-top');
      this.popoverArrow.classList.remove('is-bottom');
    } else {
      this.popoverArrow.classList.add('is-bottom');
      this.popoverArrow.classList.remove('is-top');
    }
  }

  closeDetailsPopover() {
    this.activePopoverTask = null;
    if (this.popoverOverlay) this.popoverOverlay.style.display = 'none';
    if (this.popoverCard) this.popoverCard.style.display = 'none';
  }

  // --- Cluster Popover ---

  openClusterPopover(tasks, anchorRect, type = 'cluster') {
    this.activeClusterTasks = tasks;
    this.clusterPopover.style.display = 'block';
    this.clusterTitle.textContent = type === 'overdue' ? `${tasks.length} Overdue Tasks` : `${tasks.length} Tasks Clustered`;

    this.clusterList.innerHTML = '';
    tasks.forEach(t => {
      const item = document.createElement('div');
      item.className = 'cluster-item';
      item.innerHTML = `
        <div class="cluster-item-title">${escapeHtml(t.title)}</div>
        <div class="cluster-item-meta">
          <span class="pri-pill pri-${t.priority || 'medium'}">${(t.priority || 'medium').toUpperCase()}</span>
          <span>${formatFriendlyDue(t.dueAt)}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        this.closeClusterPopover();
        const itemRect = item.getBoundingClientRect();
        this.openDetailsPopover(t, itemRect);
      });
      this.clusterList.appendChild(item);
    });

    const popWidth = 320;
    let left = anchorRect.left + anchorRect.width / 2 - popWidth / 2;
    let top = anchorRect.top - 200;
    if (top < 16) top = anchorRect.bottom + 12;
    if (left < 16) left = 16;
    if (left + popWidth > window.innerWidth - 16) left = window.innerWidth - 16 - popWidth;

    this.clusterPopover.style.left = `${left}px`;
    this.clusterPopover.style.top = `${top}px`;
  }

  closeClusterPopover() {
    this.activeClusterTasks = null;
    if (this.clusterPopover) this.clusterPopover.style.display = 'none';
  }

  // --- Add / Edit Modal ---

  openAddModal(prefillTitle = '') {
    this.editingTaskId = null;
    this.modalHeading.textContent = 'Add Task';
    this.modalDeleteBtn.style.display = 'none';

    this.modalTitleInput.value = prefillTitle || '';
    if (this.modalTitleCount) {
      this.modalTitleCount.textContent = `${(prefillTitle || '').length}/120`;
    }

    // Default date: tomorrow, 11:59 PM
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.modalDateInput.value = formatDateForInput(tomorrow);
    this.modalTimeInput.value = '23:59';

    // Priority default: medium
    this.modalPriorityBtns.forEach(b => {
      if (b.dataset.modalPriority === 'medium') b.classList.add('is-active');
      else b.classList.remove('is-active');
    });

    this.modalNotesInput.value = '';
    this.modalPastWarning.style.display = 'none';

    this.modalOverlay.style.display = 'flex';
    setTimeout(() => this.modalTitleInput.focus(), 50);

    // Ghost dot preview
    this.timeline.setGhost(parseDateTimeInputs(this.modalDateInput.value, this.modalTimeInput.value), prefillTitle);
  }

  openEditModal(task) {
    this.editingTaskId = task.id;
    this.modalHeading.textContent = 'Edit Task';
    this.modalDeleteBtn.style.display = 'inline-flex';

    this.modalTitleInput.value = task.title;
    if (this.modalTitleCount) {
      this.modalTitleCount.textContent = `${task.title.length}/120`;
    }

    const d = new Date(task.dueAt);
    this.modalDateInput.value = formatDateForInput(d);
    this.modalTimeInput.value = formatTimeForInput(d);

    const pri = task.priority || 'medium';
    this.modalPriorityBtns.forEach(b => {
      if (b.dataset.modalPriority === pri) b.classList.add('is-active');
      else b.classList.remove('is-active');
    });

    this.modalNotesInput.value = task.notes || '';
    if (d.getTime() < Date.now()) {
      this.modalPastWarning.style.display = 'flex';
    } else {
      this.modalPastWarning.style.display = 'none';
    }

    this.modalOverlay.style.display = 'flex';
    setTimeout(() => this.modalTitleInput.focus(), 50);

    this.timeline.setGhost(d, task.title);
  }

  closeModal() {
    if (this.modalOverlay) this.modalOverlay.style.display = 'none';
    this.editingTaskId = null;
    this.timeline.clearGhost();
  }

  async handleModalSave() {
    const title = this.modalTitleInput.value.trim();
    if (!title) {
      this.modalTitleInput.focus();
      return;
    }

    const dateVal = this.modalDateInput.value;
    const timeVal = this.modalTimeInput.value || '23:59';
    const dueDate = parseDateTimeInputs(dateVal, timeVal);

    let priority = 'medium';
    this.modalPriorityBtns.forEach(b => {
      if (b.classList.contains('is-active')) priority = b.dataset.modalPriority;
    });

    const notes = this.modalNotesInput.value.trim();

    const payload = {
      title,
      dueAt: dueDate.toISOString(),
      priority,
      notes
    };

    if (this.editingTaskId) {
      await this.store.updateTask(this.editingTaskId, payload);
      this.showToast(`Updated "${title}"`, 'info');
    } else {
      await this.store.addTask(payload);
      this.showToast(`Added "${title}"`, 'success');
    }

    this.closeModal();
  }

  // --- Settings Drawer ---

  openSettingsDrawer() {
    if (!this.drawerOverlay) return;
    this.drawerOverlay.style.display = 'flex';

    // Sync current settings
    const s = this.store.settings;
    if (this.themeSystemBtn) {
      this.themeSystemBtn.classList.toggle('is-active', s.theme === 'system');
      this.themeLightBtn.classList.toggle('is-active', s.theme === 'light');
      this.themeDarkBtn.classList.toggle('is-active', s.theme === 'dark');
    }
    if (this.remindersToggle) {
      this.remindersToggle.checked = Boolean(s.reminders);
    }
    if (this.remindersHint) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        this.remindersHint.textContent = 'Browser notification permission was denied.';
        this.remindersHint.style.color = 'var(--color-overdue)';
      } else {
        this.remindersHint.textContent = 'Push before urgent milestones.';
        this.remindersHint.style.color = '';
      }
    }
  }

  closeSettingsDrawer() {
    if (this.drawerOverlay) this.drawerOverlay.style.display = 'none';
  }

  // --- ICS Download ---

  downloadIcs(task) {
    const icsContent = generateIcs(task);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(task.title || 'task').slice(0, 24).replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Downloaded calendar file (.ics)', 'success');
  }

  // --- Toast Notifications & Undo ---

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-fading-out');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  showUndoToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-item toast-undo';
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      <button type="button" class="btn-toast-undo">Undo</button>
      <div class="toast-progress"></div>
    `;

    const undoBtn = toast.querySelector('.btn-toast-undo');
    undoBtn.addEventListener('click', async () => {
      toast.remove();
      await this.handleUndo();
    });

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('is-fading-out');
        setTimeout(() => toast.remove(), 400);
      }
    }, 6000); // 6 seconds undo window as requested in specs
  }

  async handleUndo() {
    const undoneAction = await this.store.undo();
    if (undoneAction) {
      this.showToast(`Undone: ${undoneAction.description}`, 'info');
    } else {
      this.showToast('Nothing to undo', 'info');
    }
  }
}
