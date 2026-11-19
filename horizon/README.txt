========================================================================
HORIZON — Timeline To-Do App for Windows
========================================================================

Horizon is a continuous proportional timeline to-do application. Every task
is a dot on a single horizontal timeline where distances between dots
exactly correspond to real-time ratios between deadlines.

------------------------------------------------------------------------
HOW TO RUN
------------------------------------------------------------------------
1. Double-click "START-HORIZON.bat" inside this folder.
   - It will automatically check Node.js availability.
   - It probes ports 5173 to 5183. If a Horizon server is already active,
     it focuses the existing window without starting a duplicate server.
   - Otherwise, it binds to 127.0.0.1 on the first available port.
   - It automatically launches Horizon as a clean standalone app window
     via Microsoft Edge or Google Chrome (with default browser fallback).
   - Auto-stop: closing the Horizon app window automatically stops the
     background server after 10 seconds. Any pending data writes are
     flushed atomically to disk.

------------------------------------------------------------------------
KEYBOARD SHORTCUTS
------------------------------------------------------------------------
  N            Open "Add Task" modal
  /            Focus floating Quick Add bar from anywhere
  Enter        Add parsed quick task immediately / submit modal / open focused dot
  Esc          Close open modal, popover, drawer, or cancel dot dragging
  Ctrl+Z       Undo last action (supports last 10 actions: complete, delete, edit, drag, +1d)
  T            Toggle interface theme (Light / Dark)
  Delete       Delete currently focused task (with undo toast)
  Left / Right Arrow keys: Cycle keyboard focus between dots on timeline

------------------------------------------------------------------------
FEATURES & ARCHITECTURE
------------------------------------------------------------------------
- Proportional Scale Math:
  * Strict linear scaling with 6% breathing room.
  * Range modes: Fit all, 7 days, 30 days, 90 days.
  * Tasks beyond the chosen range show as "+N later ->" chip; clicking it
    switches to "Fit all".
- Collision-Free Stem Labels:
  * Four alternating slots (above-near, below-near, above-far, below-far)
    with minimum 8px spacing.
  * Dots within 14px automatically collapse into interactive cluster bubbles.
  * Gap chips appear between dots with >= 64px spacing ("+5h", "+2d", "+1w 4d").
- Natural Language Quick Add:
  * In-line parser for today, tomorrow, day after tomorrow, tonight, next week,
    next month, weekdays, dates ("20 nov 5pm"), relative spans ("in 3 days"),
    and priority flags ("!high", "!low").
  * Live translucent ghost dot previews the exact landing point on the timeline.
- Interactive Rescheduling:
  * Drag any dot along the line to reschedule with live 15-minute snapping
    and date tooltip.
- Complete Offline Support:
  * Vanilla JS (ES modules), HTML5, CSS variables, Node.js built-ins only.
  * Zero third-party dependencies, zero npm install, zero external runtime CDN.
  * Atomic JSON storage with automated backup protection.
