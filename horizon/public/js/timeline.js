// horizon/public/js/timeline.js
// Proportional timeline math, ticks, label collision layout, clusters, gap chips, and drag-reschedule

import {
  formatTime,
  formatFriendlyDue,
  humanizeGap,
  isToday,
  isTomorrow
} from './time.js';

export class TimelineEngine {
  constructor(options = {}) {
    this.container = options.container; // DOM element for timeline canvas
    this.onTaskClick = options.onTaskClick || (() => {});
    this.onTaskReschedule = options.onTaskReschedule || (() => {});
    this.onClusterClick = options.onClusterClick || (() => {});
    this.onRangeChange = options.onRangeChange || (() => {});
    this.onHoverTask = options.onHoverTask || (() => {});
    this.onLeaveTask = options.onLeaveTask || (() => {});
    this.onOpenModal = options.onOpenModal || (() => {});
    this.onLoadDemo = options.onLoadDemo || (() => {});

    this.tasks = [];
    this.rangeMode = 'fit'; // 'fit' | '7d' | '30d' | '90d'
    this.now = new Date();
    this.cardWidth = 1000;
    this.trackHeight = 360;

    // Scale state
    this.axisStart = this.now.getTime();
    this.axisEnd = this.now.getTime() + 7 * 24 * 3600 * 1000;
    this.plotLeft = 48;
    this.plotRight = 952;
    this.hasOverdue = false;

    // Dragging state
    this.isDragging = false;
    this.dragTaskId = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragCurrentX = 0;
    this.dragInitialDue = null;
    this.dragTargetTime = null;
    this.dragThresholdPassed = false;

    // Ghost dot state
    this.ghostDate = null;
    this.ghostTitle = null;

    // Highlight state
    this.highlightedTaskId = null;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="timeline-viewport select-none" id="timeline-viewport">
        <!-- Ambient background gradient -->
        <div class="timeline-ambient-glow" aria-hidden="true"></div>

        <!-- Canvas Card Content -->
        <div class="timeline-card-content" id="timeline-content">
          <!-- Overdue Zone Backdrop -->
          <div class="timeline-overdue-zone" id="timeline-overdue-zone" style="display: none;">
            <div class="timeline-overdue-badge">
              <span class="overdue-pulse-dot"></span>
              <span>OVERDUE</span>
            </div>
          </div>

          <!-- Main Track Elements -->
          <div class="timeline-track-wrapper" id="timeline-track-wrapper">
            <!-- Background base line -->
            <div class="timeline-main-bar" id="timeline-main-bar"></div>
            <!-- Active brighter line from NOW to first dot -->
            <div class="timeline-active-segment" id="timeline-active-segment"></div>

            <!-- NOW Indicator -->
            <div class="timeline-now-marker" id="timeline-now-marker">
              <div class="now-pulse-ring"></div>
              <div class="now-center-dot"></div>
              <div class="now-pill" id="now-pill">NOW · 12:00 PM</div>
            </div>

            <!-- Layer for Ticks -->
            <div class="timeline-ticks-layer" id="timeline-ticks-layer"></div>

            <!-- Layer for Gap Chips -->
            <div class="timeline-gaps-layer" id="timeline-gaps-layer"></div>

            <!-- Layer for Stems and Labels -->
            <div class="timeline-labels-layer" id="timeline-labels-layer"></div>

            <!-- Layer for Dots & Clusters -->
            <div class="timeline-dots-layer" id="timeline-dots-layer"></div>

            <!-- Ghost Dot for quick-add preview -->
            <div class="timeline-ghost-dot" id="timeline-ghost-dot" style="display: none;">
              <div class="ghost-dot-ring"></div>
              <div class="ghost-dot-core"></div>
              <div class="ghost-dot-tooltip" id="ghost-dot-tooltip"></div>
            </div>

            <!-- Later Tasks Chip (+N later →) -->
            <div class="timeline-later-chip" id="timeline-later-chip" style="display: none;"></div>
          </div>

          <!-- Drag Tooltip -->
          <div class="timeline-drag-tooltip" id="timeline-drag-tooltip" style="display: none;"></div>

          <!-- Empty State Overlay -->
          <div class="timeline-empty-overlay" id="timeline-empty-overlay" style="display: none;">
            <div class="empty-state-card">
              <div class="empty-icon-wrapper">
                <div class="empty-ambient-pulse"></div>
                <div class="empty-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </div>
              </div>
              <h2 class="empty-title">Your timeline is empty</h2>
              <p class="empty-desc">Add a task and watch it land on the line. Proportional spacing brings calm clarity to your deadlines.</p>
              <div class="empty-actions">
                <button type="button" class="btn btn-primary" id="btn-empty-add">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Add your first task</span>
                </button>
                <button type="button" class="btn btn-secondary" id="btn-empty-demo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  <span>Load demo tasks</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.viewportEl = this.container.querySelector('#timeline-viewport');
    this.overdueZoneEl = this.container.querySelector('#timeline-overdue-zone');
    this.mainBarEl = this.container.querySelector('#timeline-main-bar');
    this.activeSegmentEl = this.container.querySelector('#timeline-active-segment');
    this.nowMarkerEl = this.container.querySelector('#timeline-now-marker');
    this.nowPillEl = this.container.querySelector('#now-pill');
    this.ticksLayerEl = this.container.querySelector('#timeline-ticks-layer');
    this.gapsLayerEl = this.container.querySelector('#timeline-gaps-layer');
    this.labelsLayerEl = this.container.querySelector('#timeline-labels-layer');
    this.dotsLayerEl = this.container.querySelector('#timeline-dots-layer');
    this.ghostDotEl = this.container.querySelector('#timeline-ghost-dot');
    this.ghostTooltipEl = this.container.querySelector('#ghost-dot-tooltip');
    this.laterChipEl = this.container.querySelector('#timeline-later-chip');
    this.dragTooltipEl = this.container.querySelector('#timeline-drag-tooltip');
    this.emptyOverlayEl = this.container.querySelector('#timeline-empty-overlay');

    // Empty state buttons
    this.container.querySelector('#btn-empty-add').addEventListener('click', () => this.onOpenModal());
    this.container.querySelector('#btn-empty-demo').addEventListener('click', () => this.onLoadDemo());
    this.laterChipEl.addEventListener('click', () => this.onRangeChange('fit'));
  }

  bindEvents() {
    // ResizeObserver on viewport
    this.resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => this.recalculateAndRender());
    });
    this.resizeObserver.observe(this.viewportEl);

    // Global drag handlers
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDragging) {
        this.cancelDrag();
      }
    });

    // Touch support for dragging
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches[0]) {
        this.handleMouseMove(e.touches[0]);
      }
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
      if (this.isDragging) {
        this.handleMouseUp(e);
      }
    });
  }

  setData(tasks, rangeMode = 'fit') {
    this.tasks = Array.isArray(tasks) ? tasks : [];
    this.rangeMode = rangeMode;
    this.now = new Date();
    this.recalculateAndRender();
  }

  setGhost(date, title = '') {
    this.ghostDate = date instanceof Date && !isNaN(date.getTime()) ? date : null;
    this.ghostTitle = title;
    this.renderGhost();
  }

  clearGhost() {
    this.ghostDate = null;
    this.ghostTitle = null;
    if (this.ghostDotEl) {
      this.ghostDotEl.style.display = 'none';
    }
  }

  setHighlight(taskId) {
    this.highlightedTaskId = taskId;
    const allDots = this.dotsLayerEl.querySelectorAll('.timeline-dot');
    allDots.forEach(dot => {
      if (dot.dataset.taskId === taskId) {
        dot.classList.add('is-highlighted');
      } else {
        dot.classList.remove('is-highlighted');
      }
    });
    const allLabels = this.labelsLayerEl.querySelectorAll('.stem-label-card');
    allLabels.forEach(lbl => {
      if (lbl.dataset.taskId === taskId) {
        lbl.classList.add('is-highlighted');
        lbl.style.opacity = '1';
        lbl.style.pointerEvents = 'auto';
      } else {
        lbl.classList.remove('is-highlighted');
      }
    });
  }

  clearHighlight() {
    this.highlightedTaskId = null;
    const allDots = this.dotsLayerEl.querySelectorAll('.timeline-dot');
    allDots.forEach(dot => dot.classList.remove('is-highlighted'));
    const allLabels = this.labelsLayerEl.querySelectorAll('.stem-label-card');
    allLabels.forEach(lbl => {
      lbl.classList.remove('is-highlighted');
      if (lbl.dataset.initiallyHidden === 'true') {
        lbl.style.opacity = '0';
        lbl.style.pointerEvents = 'none';
      }
    });
  }

  /**
   * Proportional scale calculation as defined in Section 9
   */
  computeScale() {
    this.now = new Date();
    const nowMs = this.now.getTime();
    this.axisStart = nowMs;

    // Filter active tasks
    const activeTasks = this.tasks.filter(t => !t.done);
    this.upcoming = activeTasks.filter(t => new Date(t.dueAt).getTime() >= nowMs);
    this.overdue = activeTasks.filter(t => new Date(t.dueAt).getTime() < nowMs);
    this.hasOverdue = this.overdue.length > 0;

    // 1. Calculate axisEnd
    if (this.rangeMode === 'fit') {
      if (this.upcoming.length > 0) {
        const lastDue = Math.max(...this.upcoming.map(t => new Date(t.dueAt).getTime()));
        const diff = Math.max(lastDue - nowMs, 24 * 3600 * 1000);
        this.axisEnd = nowMs + diff * 1.06; // 6% breathing room
      } else {
        this.axisEnd = nowMs + 7 * 24 * 3600 * 1000;
      }
    } else if (this.rangeMode === '7d') {
      this.axisEnd = nowMs + 7 * 24 * 3600 * 1000;
    } else if (this.rangeMode === '30d') {
      this.axisEnd = nowMs + 30 * 24 * 3600 * 1000;
    } else if (this.rangeMode === '90d') {
      this.axisEnd = nowMs + 90 * 24 * 3600 * 1000;
    }

    // 2. Plot boundaries
    const rect = this.viewportEl.getBoundingClientRect();
    this.cardWidth = Math.max(800, rect.width || 1000);

    // Overdue zone: 96px wide if any overdue tasks exist
    this.plotLeft = 48 + (this.hasOverdue ? 96 : 0);
    this.plotRight = this.cardWidth - 48;
    this.scaleLength = Math.max(100, this.plotRight - this.plotLeft);
  }

  /**
   * Strict linear mathematical projection from timestamp to x position
   * x(task) = plotLeft + (dueAt - axisStart) / (axisEnd - axisStart) * (plotRight - plotLeft)
   */
  timeToX(timeMs) {
    if (this.axisEnd <= this.axisStart) return this.plotLeft;
    const ratio = (timeMs - this.axisStart) / (this.axisEnd - this.axisStart);
    return this.plotLeft + ratio * this.scaleLength;
  }

  /**
   * Reverse projection: from x coordinate back to timestamp
   */
  xToTime(x) {
    if (this.scaleLength <= 0) return this.axisStart;
    const ratio = (x - this.plotLeft) / this.scaleLength;
    return this.axisStart + ratio * (this.axisEnd - this.axisStart);
  }

  recalculateAndRender() {
    this.computeScale();

    // Check empty state: no active tasks
    const totalActive = this.upcoming.length + this.overdue.length;
    if (totalActive === 0) {
      this.emptyOverlayEl.style.display = 'flex';
      this.renderEmptyAxis();
      return;
    } else {
      this.emptyOverlayEl.style.display = 'none';
    }

    // Render Overdue zone
    if (this.hasOverdue) {
      this.overdueZoneEl.style.display = 'block';
      this.overdueZoneEl.style.left = '48px';
      this.overdueZoneEl.style.width = '96px';
    } else {
      this.overdueZoneEl.style.display = 'none';
    }

    // Position Main Bar
    this.mainBarEl.style.left = `${this.plotLeft}px`;
    this.mainBarEl.style.width = `${this.scaleLength}px`;

    // Position NOW Marker
    this.nowMarkerEl.style.left = `${this.plotLeft}px`;
    this.nowPillEl.textContent = `NOW · ${formatTime(this.now)}`;

    // Render Ticks
    this.renderTicks();

    // Separate upcoming tasks into on-axis vs beyond-axis
    const onAxisTasks = [];
    const laterTasks = [];
    for (const t of this.upcoming) {
      const dueTime = new Date(t.dueAt).getTime();
      if (dueTime <= this.axisEnd) {
        onAxisTasks.push({ task: t, time: dueTime, x: this.timeToX(dueTime) });
      } else {
        laterTasks.push(t);
      }
    }

    // Sort onAxisTasks by x ascending
    onAxisTasks.sort((a, b) => a.x - b.x);

    // Active Highlight segment: from NOW to first upcoming dot
    if (onAxisTasks.length > 0) {
      const firstX = onAxisTasks[0].x;
      this.activeSegmentEl.style.display = 'block';
      this.activeSegmentEl.style.left = `${this.plotLeft}px`;
      this.activeSegmentEl.style.width = `${Math.max(0, firstX - this.plotLeft)}px`;
    } else {
      this.activeSegmentEl.style.display = 'none';
    }

    // Later chip (+N later →)
    if (laterTasks.length > 0) {
      this.laterChipEl.style.display = 'flex';
      this.laterChipEl.style.left = `${this.plotRight}px`;
      this.laterChipEl.textContent = `+${laterTasks.length} later →`;
      this.laterChipEl.title = 'Click to Fit All on timeline';
    } else {
      this.laterChipEl.style.display = 'none';
    }

    // Render Overdue dots (spaced evenly in 96px zone, or 1 cluster if > 5)
    this.renderOverdueTasks();

    // Group on-axis tasks into clusters if gap < 14px
    const clustersAndSingles = this.clusterOnAxisTasks(onAxisTasks);

    // Render Dots and Clusters
    this.renderDotsAndClusters(clustersAndSingles);

    // Render Gap Chips between consecutive upcoming items if pixel gap >= 64px
    this.renderGapChips(clustersAndSingles);

    // Collision-free Label Layout with stems
    this.renderLabels(clustersAndSingles);

    // Render Ghost Dot if any active
    this.renderGhost();
  }

  renderEmptyAxis() {
    this.overdueZoneEl.style.display = 'none';
    this.activeSegmentEl.style.display = 'none';
    this.ticksLayerEl.innerHTML = '';
    this.gapsLayerEl.innerHTML = '';
    this.labelsLayerEl.innerHTML = '';
    this.dotsLayerEl.innerHTML = '';
    this.laterChipEl.style.display = 'none';

    this.mainBarEl.style.left = '48px';
    this.mainBarEl.style.width = `${this.cardWidth - 96}px`;
    this.nowMarkerEl.style.left = '48px';
    this.nowPillEl.textContent = `NOW · ${formatTime(this.now)}`;
  }

  renderOverdueTasks() {
    // Overdue items are rendered in dotsLayerEl
    const count = this.overdue.length;
    if (count === 0) return;

    if (count <= 5) {
      // Space evenly inside [48, 144]
      const step = 96 / count;
      this.overdue.forEach((task, idx) => {
        const x = 48 + (idx + 0.5) * step;
        const dot = this.createDotElement(task, x, true);
        this.dotsLayerEl.appendChild(dot);
      });
    } else {
      // Cluster bubble with count in center: x = 96
      const bubble = document.createElement('button');
      bubble.type = 'button';
      bubble.className = 'timeline-cluster-bubble is-overdue';
      bubble.style.left = '96px';
      bubble.textContent = String(count);
      bubble.setAttribute('aria-label', `${count} overdue tasks`);
      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onClusterClick(this.overdue, bubble.getBoundingClientRect(), 'overdue');
      });
      this.dotsLayerEl.appendChild(bubble);
    }
  }

  /**
   * Clusters consecutive dots whose pixel distance is under 14px
   */
  clusterOnAxisTasks(onAxisTasks) {
    const result = [];
    if (onAxisTasks.length === 0) return result;

    let currentGroup = [onAxisTasks[0]];

    for (let i = 1; i < onAxisTasks.length; i++) {
      const prev = currentGroup[currentGroup.length - 1];
      const curr = onAxisTasks[i];

      if (curr.x - prev.x < 14) {
        currentGroup.push(curr);
      } else {
        if (currentGroup.length === 1) {
          result.push({ isCluster: false, ...currentGroup[0] });
        } else {
          const avgX = currentGroup.reduce((s, it) => s + it.x, 0) / currentGroup.length;
          result.push({
            isCluster: true,
            tasks: currentGroup.map(it => it.task),
            time: currentGroup[0].time,
            x: avgX
          });
        }
        currentGroup = [curr];
      }
    }

    if (currentGroup.length === 1) {
      result.push({ isCluster: false, ...currentGroup[0] });
    } else if (currentGroup.length > 1) {
      const avgX = currentGroup.reduce((s, it) => s + it.x, 0) / currentGroup.length;
      result.push({
        isCluster: true,
        tasks: currentGroup.map(it => it.task),
        time: currentGroup[0].time,
        x: avgX
      });
    }

    return result;
  }

  createDotElement(task, x, isOverdue = false) {
    const dotBtn = document.createElement('button');
    dotBtn.type = 'button';
    dotBtn.className = 'timeline-dot';
    dotBtn.dataset.taskId = task.id;
    dotBtn.style.left = `${x}px`;

    // Size by priority: low 12px, medium 16px, high 20px
    const pri = task.priority || 'medium';
    dotBtn.classList.add(`pri-${pri}`);

    // Urgency coloring:
    // overdue: red, <24h: orange, <3d: amber, later: indigo
    const nowMs = this.now.getTime();
    const dueTime = new Date(task.dueAt).getTime();
    const diffHours = (dueTime - nowMs) / 3600000;

    if (isOverdue || diffHours < 0) {
      dotBtn.classList.add('urgency-overdue');
    } else if (diffHours < 24) {
      dotBtn.classList.add('urgency-24h');
    } else if (diffHours < 72) {
      dotBtn.classList.add('urgency-3d');
    } else {
      dotBtn.classList.add('urgency-later');
    }

    // Pulse ring for under 24 hours
    if (diffHours >= 0 && diffHours < 24 && !isOverdue) {
      const pulseRing = document.createElement('span');
      pulseRing.className = 'dot-pulse-ring';
      dotBtn.appendChild(pulseRing);
    }

    // Center dot core
    const core = document.createElement('span');
    core.className = 'dot-core';
    dotBtn.appendChild(core);

    // Aria label example from specs:
    // "Submit lab record, due Fri 20 Nov 5:00 PM, high priority"
    const friendlyDue = formatFriendlyDue(task.dueAt, this.now);
    dotBtn.setAttribute('aria-label', `${task.title}, due ${friendlyDue}, ${pri} priority`);

    // Event handlers
    dotBtn.addEventListener('mouseenter', () => {
      this.onHoverTask(task.id);
      this.setHighlight(task.id);
    });
    dotBtn.addEventListener('mouseleave', () => {
      this.onLeaveTask(task.id);
      this.clearHighlight();
    });
    dotBtn.addEventListener('focus', () => {
      this.onHoverTask(task.id);
      this.setHighlight(task.id);
    });
    dotBtn.addEventListener('blur', () => {
      this.onLeaveTask(task.id);
      this.clearHighlight();
    });
    dotBtn.addEventListener('click', (e) => {
      if (this.dragThresholdPassed) return;
      this.onTaskClick(task, dotBtn.getBoundingClientRect());
    });

    // Mousedown initiates drag
    dotBtn.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only left click
      this.startDrag(task, x, e.clientX, e.clientY);
    });
    dotBtn.addEventListener('touchstart', (e) => {
      if (e.touches[0]) {
        this.startDrag(task, x, e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    return dotBtn;
  }

  renderDotsAndClusters(clustersAndSingles) {
    this.dotsLayerEl.innerHTML = '';

    // If overdue dots exist, render them first
    this.renderOverdueTasks();

    for (const item of clustersAndSingles) {
      if (item.isCluster) {
        const bubble = document.createElement('button');
        bubble.type = 'button';
        bubble.className = 'timeline-cluster-bubble is-upcoming';
        bubble.style.left = `${item.x}px`;
        bubble.textContent = String(item.tasks.length);
        bubble.setAttribute('aria-label', `${item.tasks.length} tasks clustered here`);
        bubble.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onClusterClick(item.tasks, bubble.getBoundingClientRect(), 'cluster');
        });
        this.dotsLayerEl.appendChild(bubble);
      } else {
        const dot = this.createDotElement(item.task, item.x, false);
        this.dotsLayerEl.appendChild(dot);
      }
    }
  }

  /**
   * Gap chips between consecutive upcoming items if pixel gap >= 64px
   */
  renderGapChips(clustersAndSingles) {
    this.gapsLayerEl.innerHTML = '';
    if (clustersAndSingles.length < 2) return;

    for (let i = 0; i < clustersAndSingles.length - 1; i++) {
      const itemA = clustersAndSingles[i];
      const itemB = clustersAndSingles[i + 1];
      const gapPx = itemB.x - itemA.x;

      if (gapPx >= 64) {
        const midX = (itemA.x + itemB.x) / 2;
        const diffMs = itemB.time - itemA.time;
        const text = humanizeGap(diffMs);

        const chip = document.createElement('div');
        chip.className = 'timeline-gap-chip';
        chip.style.left = `${midX}px`;
        chip.textContent = text;
        this.gapsLayerEl.appendChild(chip);
      }
    }
  }

  /**
   * Collision-free label allocation as defined in Section 9
   * Slots:
   * 1: above-near (-56px)
   * 2: below-near (+56px)
   * 3: above-far (-116px)
   * 4: below-far (+116px)
   * Slot is free if lastEndX[slot] + 8 <= labelLeft
   */
  renderLabels(clustersAndSingles) {
    this.labelsLayerEl.innerHTML = '';

    // Slot definitions: relative vertical offsets from line center (y=0)
    const SLOTS = [
      { id: 'above-near', offsetY: -56, side: 'above' },
      { id: 'below-near', offsetY: 56, side: 'below' },
      { id: 'above-far', offsetY: -116, side: 'above' },
      { id: 'below-far', offsetY: 116, side: 'below' }
    ];

    const lastEndX = {
      'above-near': -Infinity,
      'below-near': -Infinity,
      'above-far': -Infinity,
      'below-far': -Infinity
    };

    const labelApproxWidth = 150; // max width 150px
    const halfWidth = labelApproxWidth / 2;

    for (const item of clustersAndSingles) {
      if (item.isCluster) continue; // Clusters do not show standard stem labels

      const task = item.task;
      const x = item.x;

      // Find first free slot
      let chosenSlot = null;
      let labelLeft = x - halfWidth;
      let labelRight = x + halfWidth;

      // Clamp label horizontally inside card bounds
      const minLeft = 16;
      const maxRight = this.cardWidth - 16;
      if (labelLeft < minLeft) {
        labelLeft = minLeft;
        labelRight = minLeft + labelApproxWidth;
      } else if (labelRight > maxRight) {
        labelRight = maxRight;
        labelLeft = maxRight - labelApproxWidth;
      }

      for (const slot of SLOTS) {
        if (lastEndX[slot.id] + 8 <= labelLeft) {
          chosenSlot = slot;
          lastEndX[slot.id] = labelRight;
          break;
        }
      }

      // Create stem and card
      const labelContainer = document.createElement('div');
      labelContainer.className = `stem-label-wrapper slot-${chosenSlot ? chosenSlot.id : 'hidden'}`;
      labelContainer.dataset.taskId = task.id;
      labelContainer.style.left = `${x}px`;

      const friendlyDue = formatFriendlyDue(task.dueAt, this.now);
      const isUrgent = (new Date(task.dueAt).getTime() - this.now.getTime()) < 24 * 3600 * 1000;

      // Card element
      const card = document.createElement('div');
      card.className = `stem-label-card ${isUrgent ? 'is-urgent' : ''}`;
      card.dataset.taskId = task.id;

      // Title
      const titleP = document.createElement('p');
      titleP.className = 'label-title';
      titleP.textContent = task.title;
      card.appendChild(titleP);

      // Subtitle
      const dueP = document.createElement('p');
      dueP.className = 'label-due';
      dueP.textContent = friendlyDue;
      card.appendChild(dueP);

      if (chosenSlot) {
        // Vertical Stem
        const stem = document.createElement('div');
        stem.className = `stem-line ${chosenSlot.side}`;
        if (chosenSlot.id === 'above-near') {
          card.style.bottom = '18px';
          stem.style.bottom = '0px';
          stem.style.height = '18px';
        } else if (chosenSlot.id === 'below-near') {
          card.style.top = '18px';
          stem.style.top = '0px';
          stem.style.height = '18px';
        } else if (chosenSlot.id === 'above-far') {
          card.style.bottom = '78px';
          stem.style.bottom = '0px';
          stem.style.height = '78px';
        } else if (chosenSlot.id === 'below-far') {
          card.style.top = '78px';
          stem.style.top = '0px';
          stem.style.height = '78px';
        }

        labelContainer.appendChild(stem);
        labelContainer.appendChild(card);
      } else {
        // Hidden slot: shows on hover / focus
        labelContainer.dataset.initiallyHidden = 'true';
        labelContainer.style.opacity = '0';
        labelContainer.style.pointerEvents = 'none';
        card.style.bottom = '22px';
        const stem = document.createElement('div');
        stem.className = 'stem-line above';
        stem.style.bottom = '0px';
        stem.style.height = '22px';
        labelContainer.appendChild(stem);
        labelContainer.appendChild(card);
      }

      // Clicking label opens task details
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTaskClick(task, card.getBoundingClientRect());
      });

      this.labelsLayerEl.appendChild(labelContainer);
    }
  }

  /**
   * Ticks calculation as defined in Section 9:
   * smallest step from [1h, 3h, 6h, 12h, 1d, 2d, 7d, 14d, 1 month, 3 months]
   * that keeps ticks at least 90px apart.
   */
  renderTicks() {
    this.ticksLayerEl.innerHTML = '';
    const spanMs = this.axisEnd - this.axisStart;
    if (spanMs <= 0 || this.scaleLength <= 0) return;

    const CANDIDATES = [
      { unit: 'h', val: 1, ms: 3600 * 1000 },
      { unit: 'h', val: 3, ms: 3 * 3600 * 1000 },
      { unit: 'h', val: 6, ms: 6 * 3600 * 1000 },
      { unit: 'h', val: 12, ms: 12 * 3600 * 1000 },
      { unit: 'd', val: 1, ms: 24 * 3600 * 1000 },
      { unit: 'd', val: 2, ms: 2 * 24 * 3600 * 1000 },
      { unit: 'd', val: 7, ms: 7 * 24 * 3600 * 1000 },
      { unit: 'd', val: 14, ms: 14 * 24 * 3600 * 1000 },
      { unit: 'm', val: 1, ms: 30 * 24 * 3600 * 1000 },
      { unit: 'm', val: 3, ms: 90 * 24 * 3600 * 1000 }
    ];

    // Find smallest step where pixel gap >= 90
    let chosen = CANDIDATES[CANDIDATES.length - 1];
    for (const cand of CANDIDATES) {
      const px = (cand.ms / spanMs) * this.scaleLength;
      if (px >= 90) {
        chosen = cand;
        break;
      }
    }

    // Generate aligned ticks in local time
    const ticks = [];
    const curDate = new Date(this.axisStart);

    if (chosen.unit === 'h') {
      // Align to next multiple of chosen.val hours
      curDate.setMinutes(0, 0, 0);
      const remHours = curDate.getHours() % chosen.val;
      if (remHours !== 0) {
        curDate.setHours(curDate.getHours() + (chosen.val - remHours));
      } else {
        curDate.setHours(curDate.getHours() + chosen.val);
      }
      while (curDate.getTime() <= this.axisEnd) {
        ticks.push(new Date(curDate));
        curDate.setHours(curDate.getHours() + chosen.val);
      }
    } else if (chosen.unit === 'd') {
      // Align to midnight
      curDate.setDate(curDate.getDate() + 1);
      curDate.setHours(0, 0, 0, 0);
      if (chosen.val === 2 && curDate.getDate() % 2 !== 0) {
        curDate.setDate(curDate.getDate() + 1);
      }
      while (curDate.getTime() <= this.axisEnd) {
        ticks.push(new Date(curDate));
        curDate.setDate(curDate.getDate() + chosen.val);
      }
    } else if (chosen.unit === 'm') {
      // Align to 1st of next month
      curDate.setDate(1);
      curDate.setMonth(curDate.getMonth() + 1);
      curDate.setHours(0, 0, 0, 0);
      while (curDate.getTime() <= this.axisEnd) {
        ticks.push(new Date(curDate));
        curDate.setMonth(curDate.getMonth() + chosen.val);
      }
    }

    // Render each tick
    for (const t of ticks) {
      const tMs = t.getTime();
      const x = this.timeToX(tMs);
      if (x < this.plotLeft - 10 || x > this.plotRight + 10) continue;

      const isMidnight = t.getHours() === 0 && t.getMinutes() === 0;

      const tickEl = document.createElement('div');
      tickEl.className = `timeline-tick ${isMidnight ? 'is-midnight' : ''}`;
      tickEl.style.left = `${x}px`;

      // Tick mark line
      const line = document.createElement('span');
      line.className = 'tick-mark';
      tickEl.appendChild(line);

      // Tick label text
      const label = document.createElement('span');
      label.className = 'tick-label';

      if (chosen.unit === 'h') {
        label.textContent = isMidnight ? '12 AM' : formatTime(t).replace(':00', '');
      } else if (chosen.unit === 'd') {
        if (isToday(t, this.now)) {
          label.textContent = 'Today';
        } else if (isTomorrow(t, this.now)) {
          label.textContent = 'Tomorrow';
        } else {
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][t.getDay()];
          label.textContent = `${dayName} ${t.getDate()}`;
        }
      } else if (chosen.unit === 'm') {
        const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t.getMonth()];
        label.textContent = t.getMonth() === 0 ? `${monthName} ${t.getFullYear()}` : monthName;
      }

      tickEl.appendChild(label);
      this.ticksLayerEl.appendChild(tickEl);
    }
  }

  renderGhost() {
    if (!this.ghostDotEl) return;
    if (!this.ghostDate) {
      this.ghostDotEl.style.display = 'none';
      return;
    }

    const ghostMs = this.ghostDate.getTime();
    this.ghostDotEl.style.display = 'flex';

    if (ghostMs > this.axisEnd) {
      // Extends the line: pin to plotRight with arrow indicator
      this.ghostDotEl.style.left = `${this.plotRight}px`;
      this.ghostDotEl.classList.add('is-extended');
      this.ghostTooltipEl.textContent = `→ ${formatFriendlyDue(this.ghostDate, this.now)} (extends the line)`;
    } else if (ghostMs < this.axisStart) {
      // Overdue position
      this.ghostDotEl.style.left = '48px';
      this.ghostDotEl.classList.remove('is-extended');
      this.ghostTooltipEl.textContent = `Overdue · ${formatFriendlyDue(this.ghostDate, this.now)}`;
    } else {
      const x = this.timeToX(ghostMs);
      this.ghostDotEl.style.left = `${x}px`;
      this.ghostDotEl.classList.remove('is-extended');
      this.ghostTooltipEl.textContent = formatFriendlyDue(this.ghostDate, this.now);
    }
  }

  // --- Drag and Reschedule handlers ---

  startDrag(task, x, clientX, clientY) {
    this.isDragging = true;
    this.dragTaskId = task.id;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragCurrentX = x;
    this.dragInitialDue = task.dueAt;
    this.dragThresholdPassed = false;
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;

    if (!this.dragThresholdPassed && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      this.dragThresholdPassed = true;
      document.body.classList.add('is-dragging-dot');
      this.dragTooltipEl.style.display = 'block';
    }

    if (!this.dragThresholdPassed) return;

    // Movement on the axis
    const rect = this.viewportEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Clamp between now (plotLeft) and axisEnd (plotRight)
    const clampedX = Math.max(this.plotLeft, Math.min(this.plotRight, mouseX));

    // Calculate time and snap to 15 min
    let targetTime = this.xToTime(clampedX);
    targetTime = Math.max(this.axisStart, Math.min(this.axisEnd, targetTime));
    const fifteenMinMs = 15 * 60 * 1000;
    targetTime = Math.round(targetTime / fifteenMinMs) * fifteenMinMs;

    this.dragTargetTime = targetTime;
    const targetX = this.timeToX(targetTime);

    // Update dragged dot visual position
    const dotEl = this.dotsLayerEl.querySelector(`.timeline-dot[data-task-id="${this.dragTaskId}"]`);
    if (dotEl) {
      dotEl.style.left = `${targetX}px`;
      dotEl.classList.add('is-dragging');
    }

    // Update drag tooltip
    const dateObj = new Date(targetTime);
    this.dragTooltipEl.style.left = `${targetX}px`;
    this.dragTooltipEl.textContent = formatFriendlyDue(dateObj, this.now);
  }

  handleMouseUp(e) {
    if (!this.isDragging) return;

    if (this.dragThresholdPassed && this.dragTargetTime) {
      const newDueIso = new Date(this.dragTargetTime).toISOString();
      const taskId = this.dragTaskId;
      this.cleanupDragVisuals();
      this.onTaskReschedule(taskId, newDueIso, this.dragInitialDue);
    } else {
      this.cleanupDragVisuals();
    }
  }

  cancelDrag() {
    if (!this.isDragging) return;
    this.cleanupDragVisuals();
    this.recalculateAndRender();
  }

  cleanupDragVisuals() {
    this.isDragging = false;
    this.dragThresholdPassed = false;
    this.dragTaskId = null;
    this.dragTargetTime = null;
    document.body.classList.remove('is-dragging-dot');
    if (this.dragTooltipEl) this.dragTooltipEl.style.display = 'none';
  }
}
