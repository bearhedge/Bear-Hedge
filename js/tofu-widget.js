/**
 * Tofu Widget v2 - Manifest-based GIF system
 *
 * Priority layers:
 * 1. Event/Holiday (if today matches)
 * 2. Market mood (when market open) - TODO: implement SPX/VIX feed
 * 3. Time of day (fallback)
 *
 * Rotation: Every 30 seconds, pick from pool of matching GIFs
 */

const TofuWidget = {
  calendar: null,
  manifest: null,
  currentPool: [],
  poolIndex: 0,
  shownGifs: new Set(),
  rotationTimer: null,

  async init() {
    try {
      const [calendarRes, manifestRes] = await Promise.all([
        fetch('data/tofu-calendar.json'),
        fetch('data/tofu-manifest.json')
      ]);

      this.calendar = await calendarRes.json();
      this.manifest = await manifestRes.json();

      this.updateContext();
      this.startRotation();
      this.scheduleMidnightUpdate();

      console.log('Tofu Widget v2 initialized', {
        gifs: this.manifest.gifs.length,
        events: this.calendar.events.length
      });
    } catch (error) {
      console.error('Tofu Widget: Failed to load data', error);
      this.setFallback();
    }
  },

  // Determine current time period
  getTimePeriod() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 17) return 'afternoon';
    if (hour >= 18 && hour <= 21) return 'evening';
    return 'night';
  },

  // Check for today's event
  getTodayEvent() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const todayFixed = `${month}-${day}`;
    const todayFull = `${year}-${month}-${day}`;

    const matches = this.calendar.events.filter(event => {
      if (event.type === 'fixed') return event.date === todayFixed;
      if (event.type === 'lunar') return event.date === todayFull;
      return false;
    });

    if (matches.length === 0) return null;

    // HK priority, then by priority number
    return matches.sort((a, b) => {
      if (a.region === 'hk' && b.region !== 'hk') return -1;
      if (b.region === 'hk' && a.region !== 'hk') return 1;
      return a.priority - b.priority;
    })[0];
  },

  // Get market mood - placeholder for now
  // TODO: Implement SPX/VIX streaming
  getMarketMood() {
    // Check if US market is open (9:30am-4pm ET = 10:30pm-5am HKT next day)
    // For now, return null (use time-of-day fallback)
    return null;
  },

  // Filter GIFs that match current context
  getMatchingGifs(context) {
    const { time, mood, event } = context;

    return this.manifest.gifs.filter(gif => {
      // If event specified, check if GIF is tagged for that event
      if (event && gif.events.length > 0) {
        const eventKey = event.name.toLowerCase().replace(/[^a-z]/g, '-');
        if (gif.events.includes(eventKey)) return true;
      }

      // Check time match
      if (!gif.time.includes(time)) return false;

      // Check mood match (if market mood active)
      if (mood && !gif.mood.includes(mood)) return false;

      return true;
    });
  },

  // Build a pool of GIFs for current context
  buildPool() {
    const event = this.getTodayEvent();
    const marketMood = this.getMarketMood();
    const timePeriod = this.getTimePeriod();

    const context = {
      time: timePeriod,
      mood: marketMood || 'neutral',
      event: event
    };

    let matching = this.getMatchingGifs(context);

    // If no matches, use all GIFs as fallback
    if (matching.length === 0) {
      matching = this.manifest.gifs;
    }

    // Shuffle and pick up to poolSize
    const poolSize = this.manifest.config.poolSize || 5;
    const shuffled = this.shuffle([...matching]);

    // Prefer GIFs we haven't shown recently
    const notShown = shuffled.filter(g => !this.shownGifs.has(g.file));
    const pool = notShown.length >= poolSize
      ? notShown.slice(0, poolSize)
      : shuffled.slice(0, poolSize);

    this.currentPool = pool;
    this.poolIndex = 0;

    // Track what we're showing
    pool.forEach(g => this.shownGifs.add(g.file));

    // Reset shown tracking if we've shown most GIFs
    if (this.shownGifs.size > this.manifest.gifs.length * 0.7) {
      this.shownGifs.clear();
    }

    // Update status/mood display
    this.updateDisplay(context, event);

    console.log('Pool built:', pool.map(g => g.file), 'Context:', context);
  },

  // Fisher-Yates shuffle
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  // Rotate to next GIF in pool
  rotateGif() {
    if (this.currentPool.length === 0) return;

    const gif = this.currentPool[this.poolIndex];
    const gifEl = document.querySelector('#window-tofu .tofu-image img');

    if (gifEl && gif) {
      const path = this.manifest.config.basePath + gif.file;
      gifEl.src = path;
      gifEl.onerror = () => {
        gifEl.src = 'images/tofu/default.gif';
      };
    }

    this.poolIndex = (this.poolIndex + 1) % this.currentPool.length;
  },

  // Mood to CSS class mapping
  moodClasses: {
    'ZOOMIES': 'mood-party',
    'CELEBRATING': 'mood-party',
    'SLEEPY': 'mood-sleepy',
    'FESTIVE': 'mood-festive',
    'MERRY': 'mood-festive',
    'SPOOKY': 'mood-spooky',
    'FEELING LOVE': 'mood-love',
    'GREAT': 'mood-great',
    'BAD': 'mood-bad'
  },

  // Update status and mood text with dynamic styling
  updateDisplay(context, event) {
    const statusEl = document.getElementById('tofu-status');
    const moodEl = document.getElementById('tofu-mood');

    // Clear previous mood classes
    if (statusEl) {
      statusEl.className = 'tofu-status';
    }
    if (moodEl) {
      moodEl.className = 'tofu-mood';
    }

    let status, moodText;

    if (event) {
      // Event day
      status = event.status;
      moodText = `${event.name.toUpperCase()} ${event.emoji}`;
    } else {
      // Time-based default
      const defaults = this.calendar.defaults[context.time];
      status = defaults.status;
      moodText = `${defaults.mood} ${defaults.emoji}`;
    }

    if (statusEl) {
      statusEl.textContent = status;
      // Apply dynamic mood class
      const moodClass = this.moodClasses[status];
      if (moodClass) {
        statusEl.classList.add(moodClass);
      }
    }

    if (moodEl) {
      moodEl.textContent = moodText;
      // Apply same mood class to mood element for coordinated animation
      const moodClass = this.moodClasses[status];
      if (moodClass) {
        moodEl.classList.add(moodClass);
      }
    }
  },

  // Start rotation timer
  startRotation() {
    this.buildPool();
    this.rotateGif();

    const interval = this.manifest.config.rotationInterval || 30000;

    this.rotationTimer = setInterval(() => {
      this.rotateGif();
    }, interval);

    // Rebuild pool every 5 minutes (context might change)
    setInterval(() => {
      this.buildPool();
    }, 5 * 60 * 1000);
  },

  // Update context (called on time period change)
  updateContext() {
    this.buildPool();
  },

  scheduleMidnightUpdate() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
      this.updateContext();
      setInterval(() => this.updateContext(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  },

  setFallback() {
    const gifEl = document.querySelector('#window-tofu .tofu-image img');
    if (gifEl) gifEl.src = 'images/tofu/default.gif';

    const statusEl = document.getElementById('tofu-status');
    if (statusEl) statusEl.textContent = 'GOOD BOY';
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TofuWidget.init());
} else {
  TofuWidget.init();
}
