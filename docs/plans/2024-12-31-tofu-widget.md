# Tofu Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a context-aware Tofu mascot widget that displays different GIFs and moods based on date/time, with HK-first event priority.

**Architecture:** JavaScript widget loads a calendar JSON, checks today's date against events (HK priority, then global, sorted by priority level), falls back to time-of-day defaults. Widget updates hourly and at midnight.

**Tech Stack:** Vanilla JavaScript, JSON data file, existing HTML/CSS structure

---

### Task 1: Create Tofu Images Directory Structure

**Files:**
- Create: `images/tofu/` directory
- Move: existing GIF to new location

**Step 1: Create directory and move default GIF**

```bash
mkdir -p "/Users/home/Desktop/Bear Hedge/images/tofu"
cp "/Users/home/Desktop/Bear Hedge/images/tofu.gif" "/Users/home/Desktop/Bear Hedge/images/tofu/default.gif"
```

**Step 2: Copy additional GIFs from ComfyUI output**

```bash
# Copy a few existing GIFs as placeholders for different states
cp "/Users/home/Desktop/APE YOLO/NFT/ComfyUI/output/tofu_animated_00018.gif" "/Users/home/Desktop/Bear Hedge/images/tofu/morning.gif"
cp "/Users/home/Desktop/APE YOLO/NFT/ComfyUI/output/tofu_animated_00017.gif" "/Users/home/Desktop/Bear Hedge/images/tofu/afternoon.gif"
cp "/Users/home/Desktop/APE YOLO/NFT/ComfyUI/output/tofu_animated_00013.gif" "/Users/home/Desktop/Bear Hedge/images/tofu/evening.gif"
cp "/Users/home/Desktop/APE YOLO/NFT/ComfyUI/output/tofu_animated_00010.gif" "/Users/home/Desktop/Bear Hedge/images/tofu/night.gif"
```

**Step 3: Verify files exist**

```bash
ls -la "/Users/home/Desktop/Bear Hedge/images/tofu/"
```

Expected: 5 GIF files (default, morning, afternoon, evening, night)

**Step 4: Commit**

```bash
cd "/Users/home/Desktop/Bear Hedge"
git add images/tofu/
git commit -m "feat: add tofu gif directory structure"
```

---

### Task 2: Create Calendar Data File

**Files:**
- Create: `data/tofu-calendar.json`

**Step 1: Create data directory**

```bash
mkdir -p "/Users/home/Desktop/Bear Hedge/data"
```

**Step 2: Create calendar JSON with initial events**

Create file `data/tofu-calendar.json`:

```json
{
  "events": [
    {
      "name": "New Year",
      "date": "01-01",
      "type": "fixed",
      "priority": 1,
      "emoji": "🎆",
      "region": "global",
      "status": "CELEBRATING",
      "gif": null
    },
    {
      "name": "New Year's Eve",
      "date": "12-31",
      "type": "fixed",
      "priority": 1,
      "emoji": "🎉",
      "region": "global",
      "status": "PARTY MODE",
      "gif": null
    },
    {
      "name": "Chinese New Year",
      "date": "2025-01-29",
      "type": "lunar",
      "priority": 1,
      "emoji": "🧧",
      "region": "hk",
      "status": "GONG HEI FAT CHOY",
      "gif": null
    },
    {
      "name": "Valentine's Day",
      "date": "02-14",
      "type": "fixed",
      "priority": 2,
      "emoji": "💕",
      "region": "global",
      "status": "FEELING LOVE",
      "gif": null
    },
    {
      "name": "International Women's Day",
      "date": "03-08",
      "type": "fixed",
      "priority": 3,
      "emoji": "💜",
      "region": "global",
      "status": "RESPECTING",
      "gif": null
    },
    {
      "name": "Earth Day",
      "date": "04-22",
      "type": "fixed",
      "priority": 3,
      "emoji": "🌍",
      "region": "global",
      "status": "ECO MODE",
      "gif": null
    },
    {
      "name": "Ching Ming Festival",
      "date": "2025-04-04",
      "type": "lunar",
      "priority": 2,
      "emoji": "🙏",
      "region": "hk",
      "status": "REMEMBERING",
      "gif": null
    },
    {
      "name": "Buddha's Birthday",
      "date": "2025-05-05",
      "type": "lunar",
      "priority": 2,
      "emoji": "🪷",
      "region": "hk",
      "status": "PEACEFUL",
      "gif": null
    },
    {
      "name": "Dragon Boat Festival",
      "date": "2025-05-31",
      "type": "lunar",
      "priority": 1,
      "emoji": "🐉",
      "region": "hk",
      "status": "RACING",
      "gif": null
    },
    {
      "name": "Mid-Autumn Festival",
      "date": "2025-10-06",
      "type": "lunar",
      "priority": 1,
      "emoji": "🥮",
      "region": "hk",
      "status": "MOONCAKE TIME",
      "gif": null
    },
    {
      "name": "Halloween",
      "date": "10-31",
      "type": "fixed",
      "priority": 2,
      "emoji": "🎃",
      "region": "global",
      "status": "SPOOKY",
      "gif": null
    },
    {
      "name": "Remembrance Day",
      "date": "11-11",
      "type": "fixed",
      "priority": 3,
      "emoji": "🌺",
      "region": "global",
      "status": "HONORING",
      "gif": null
    },
    {
      "name": "Christmas Eve",
      "date": "12-24",
      "type": "fixed",
      "priority": 1,
      "emoji": "🎄",
      "region": "global",
      "status": "FESTIVE",
      "gif": null
    },
    {
      "name": "Christmas",
      "date": "12-25",
      "type": "fixed",
      "priority": 1,
      "emoji": "🎅",
      "region": "global",
      "status": "MERRY",
      "gif": null
    },
    {
      "name": "World Mental Health Day",
      "date": "10-10",
      "type": "fixed",
      "priority": 4,
      "emoji": "💚",
      "region": "global",
      "status": "MINDFUL",
      "gif": null
    },
    {
      "name": "International Coffee Day",
      "date": "10-01",
      "type": "fixed",
      "priority": 5,
      "emoji": "☕",
      "region": "global",
      "status": "CAFFEINATED",
      "gif": null
    }
  ],
  "defaults": {
    "morning": {
      "hours": [6, 11],
      "status": "WAKING UP",
      "mood": "MORNING",
      "emoji": "🌅",
      "gif": "morning.gif"
    },
    "afternoon": {
      "hours": [12, 17],
      "status": "WORKING",
      "mood": "AFTERNOON",
      "emoji": "☀️",
      "gif": "afternoon.gif"
    },
    "evening": {
      "hours": [18, 21],
      "status": "CHILLING",
      "mood": "EVENING",
      "emoji": "🌆",
      "gif": "evening.gif"
    },
    "night": {
      "hours": [22, 5],
      "status": "SLEEPY",
      "mood": "NIGHT",
      "emoji": "🌙",
      "gif": "night.gif"
    }
  }
}
```

**Step 3: Verify JSON is valid**

```bash
python3 -c "import json; json.load(open('/Users/home/Desktop/Bear Hedge/data/tofu-calendar.json'))" && echo "Valid JSON"
```

Expected: "Valid JSON"

**Step 4: Commit**

```bash
cd "/Users/home/Desktop/Bear Hedge"
git add data/
git commit -m "feat: add tofu calendar data with HK and global events"
```

---

### Task 3: Create Tofu Widget JavaScript

**Files:**
- Create: `js/tofu-widget.js`

**Step 1: Create the widget JavaScript**

Create file `js/tofu-widget.js`:

```javascript
/**
 * Tofu Widget - Context-aware mascot for Bear Hedge
 * Shows different GIFs and moods based on date/time
 * Priority: HK events > Global events > Time-of-day defaults
 */

const TofuWidget = {
  calendarData: null,
  gifBasePath: 'images/tofu/',

  async init() {
    try {
      const response = await fetch('data/tofu-calendar.json');
      this.calendarData = await response.json();
      this.update();
      // Update every hour
      setInterval(() => this.update(), 60 * 60 * 1000);
      // Also update at midnight
      this.schedulesMidnightUpdate();
    } catch (error) {
      console.error('Tofu Widget: Failed to load calendar', error);
      this.setFallback();
    }
  },

  schedulesMidnightUpdate() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
      this.update();
      // Then schedule daily
      setInterval(() => this.update(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  },

  getTodayEvents() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();

    const todayFixed = `${month}-${day}`;
    const todayFull = `${year}-${month}-${day}`;

    return this.calendarData.events.filter(event => {
      if (event.type === 'fixed') {
        return event.date === todayFixed;
      } else if (event.type === 'lunar') {
        return event.date === todayFull;
      }
      return false;
    });
  },

  getHighestPriorityEvent(events) {
    if (events.length === 0) return null;

    // Sort by: HK region first, then by priority number (lower = higher priority)
    const sorted = events.sort((a, b) => {
      // HK region gets priority
      if (a.region === 'hk' && b.region !== 'hk') return -1;
      if (b.region === 'hk' && a.region !== 'hk') return 1;
      // Then sort by priority number
      return a.priority - b.priority;
    });

    return sorted[0];
  },

  getTimeOfDay() {
    const hour = new Date().getHours();
    const defaults = this.calendarData.defaults;

    for (const [period, config] of Object.entries(defaults)) {
      const [start, end] = config.hours;
      if (start <= end) {
        // Normal range (e.g., 6-11)
        if (hour >= start && hour <= end) return config;
      } else {
        // Wrapping range (e.g., 22-5 for night)
        if (hour >= start || hour <= end) return config;
      }
    }

    // Fallback to afternoon
    return defaults.afternoon;
  },

  update() {
    const events = this.getTodayEvents();
    const event = this.getHighestPriorityEvent(events);

    let status, mood, emoji, gif;

    if (event) {
      status = event.status;
      mood = event.name.toUpperCase();
      emoji = event.emoji;
      gif = event.gif || 'default.gif';
    } else {
      const timeOfDay = this.getTimeOfDay();
      status = timeOfDay.status;
      mood = timeOfDay.mood;
      emoji = timeOfDay.emoji;
      gif = timeOfDay.gif;
    }

    this.render(status, mood, emoji, gif);
  },

  render(status, mood, emoji, gif) {
    // Update GIF
    const gifEl = document.querySelector('#window-tofu .tofu-image img');
    if (gifEl) {
      gifEl.src = this.gifBasePath + gif;
      gifEl.onerror = () => {
        gifEl.src = this.gifBasePath + 'default.gif';
      };
    }

    // Update status text
    const statusEl = document.getElementById('tofu-status');
    if (statusEl) {
      statusEl.textContent = status;
    }

    // Update or create mood element
    let moodEl = document.getElementById('tofu-mood');
    if (!moodEl) {
      const contentEl = document.querySelector('#window-tofu .window__content');
      if (contentEl) {
        const moodP = document.createElement('p');
        moodP.innerHTML = `> MOOD: <span id="tofu-mood" class="tofu-mood"></span>`;
        contentEl.appendChild(moodP);
        moodEl = document.getElementById('tofu-mood');
      }
    }

    if (moodEl) {
      moodEl.textContent = `${mood} ${emoji}`;
    }
  },

  setFallback() {
    this.render('GOOD BOY', 'UNKNOWN', '🐕', 'default.gif');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TofuWidget.init());
} else {
  TofuWidget.init();
}
```

**Step 2: Verify file was created**

```bash
ls -la "/Users/home/Desktop/Bear Hedge/js/tofu-widget.js"
```

Expected: File exists with ~150 lines

**Step 3: Commit**

```bash
cd "/Users/home/Desktop/Bear Hedge"
git add js/tofu-widget.js
git commit -m "feat: add tofu widget with calendar and time-of-day logic"
```

---

### Task 4: Update index.html to Use Widget

**Files:**
- Modify: `index.html`

**Step 1: Add script tag before closing body**

Add before `</body>`:

```html
<script src="js/tofu-widget.js"></script>
```

**Step 2: Update tofu image src to use default**

Change the img src from `images/tofu.gif` to `images/tofu/default.gif`

**Step 3: Remove the old tofu status animation JavaScript**

Remove or comment out the `tofuStatuses` array and `updateTofuStatus` interval since the widget now handles this.

**Step 4: Test in browser**

```bash
# Ensure server is running
lsof -i :3000 || (cd "/Users/home/Desktop/Bear Hedge" && python3 -m http.server 3000 &)
```

Open http://localhost:3000, click tofu.exe, verify:
- GIF loads
- STATUS shows (should be "PARTY MODE" for Dec 31)
- MOOD shows "NEW YEAR'S EVE 🎉"

**Step 5: Commit**

```bash
cd "/Users/home/Desktop/Bear Hedge"
git add index.html
git commit -m "feat: integrate tofu widget into site"
```

---

### Task 5: Test Different Scenarios

**Files:**
- No new files, testing only

**Step 1: Test current date (Dec 31)**

Open browser console, verify:
```javascript
TofuWidget.getTodayEvents()
// Should return New Year's Eve event
```

**Step 2: Test time-of-day fallback**

```javascript
// Temporarily clear events to test fallback
TofuWidget.calendarData.events = [];
TofuWidget.update();
// Should show time-of-day mood (MORNING/AFTERNOON/EVENING/NIGHT)
```

**Step 3: Restore and verify**

Refresh page, confirm New Year's Eve mood returns.

**Step 4: Final commit**

```bash
cd "/Users/home/Desktop/Bear Hedge"
git add -A
git commit -m "feat: complete tofu widget implementation"
```

---

## Summary

After completing all tasks:
- Tofu shows context-aware moods based on HK-priority calendar
- Falls back to time-of-day when no events
- Easy to add new events to `data/tofu-calendar.json`
- Easy to add themed GIFs by setting `gif` property in events
- Updates automatically at midnight and hourly
