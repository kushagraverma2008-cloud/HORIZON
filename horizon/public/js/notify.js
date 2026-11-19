// horizon/public/js/notify.js
// Reminder checks, browser Web Notifications, and in-app milestone alerts

export class ReminderManager {
  constructor(store, toastCallback) {
    this.store = store;
    this.toastCallback = toastCallback || (() => {});
    this.intervalId = null;
    this.permissionState = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  }

  init() {
    this.checkPermission();
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.checkReminders(), 30000); // Check every 30s
    // Also run an initial check
    this.checkReminders();
  }

  checkPermission() {
    if (typeof Notification !== 'undefined') {
      this.permissionState = Notification.permission;
    } else {
      this.permissionState = 'unsupported';
    }
    return this.permissionState;
  }

  async requestPermission() {
    if (typeof Notification === 'undefined') {
      this.permissionState = 'unsupported';
      return 'unsupported';
    }
    try {
      const perm = await Notification.requestPermission();
      this.permissionState = perm;
      return perm;
    } catch (err) {
      console.warn('Notification permission error:', err);
      return 'denied';
    }
  }

  async checkReminders() {
    if (!this.store.settings.reminders) return;
    const now = Date.now();
    const tasks = this.store.tasks;

    for (const task of tasks) {
      if (task.done) continue;
      const dueTime = new Date(task.dueAt).getTime();
      const diffMs = dueTime - now;

      const notifiedSoon = Boolean(task.notified && task.notified.soon);
      const notifiedDue = Boolean(task.notified && task.notified.due);

      // 1. One hour before deadline (between 0 and 60 minutes remaining)
      if (diffMs > 0 && diffMs <= 60 * 60 * 1000 && !notifiedSoon) {
        this.sendAlert(`Upcoming Task: "${task.title}"`, `Due in about ${Math.round(diffMs / 60000)} minutes.`);
        await this.store.updateTask(task.id, {
          notified: { soon: true, due: notifiedDue }
        }, false);
      }

      // 2. At or after deadline
      if (diffMs <= 0 && !notifiedDue) {
        this.sendAlert(`Due now: "${task.title}"`, `This task has reached its deadline.`);
        this.toastCallback(`Milestone reached: "${task.title}" is due now!`, 'warning');
        await this.store.updateTask(task.id, {
          notified: { soon: true, due: true }
        }, false);
      }
    }
  }

  sendAlert(title, body) {
    // 1. In-app toast callback
    this.toastCallback(`${title} - ${body}`);

    // 2. System Browser notification if permitted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/assets/icon.svg',
          badge: '/assets/icon.svg'
        });
      } catch (err) {
        console.warn('Notification constructor error:', err);
      }
    }
  }
}
