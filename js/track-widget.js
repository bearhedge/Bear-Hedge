/**
 * Track Widget - Streak tracker with day-by-day breakdown
 */

const TrackWidget = {
  API_BASE: 'https://apeyolo.com',
  updateInterval: 30000,

  async init() {
    console.log('Track Widget: Initializing...');
    await this.fetchAndRender();
    setInterval(() => this.fetchAndRender(), this.updateInterval);
  },

  async fetchTrades() {
    try {
      const response = await fetch(`${this.API_BASE}/api/defi/trades`, {
        credentials: 'omit',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.trades || [];
    } catch (error) {
      console.error('Track Widget: Failed to fetch trades', error);
      return [];
    }
  },

  async fetchCurrent() {
    try {
      const response = await fetch(`${this.API_BASE}/api/defi/current`, {
        credentials: 'omit',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Track Widget: Failed to fetch current', error);
      return null;
    }
  },

  calculateStreak(trades) {
    const sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    const streakTrades = [];
    for (const trade of sorted) {
      if (trade.outcome === 'win') {
        streakTrades.push(trade);
      } else {
        break;
      }
    }
    return streakTrades.reverse();
  },

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                   day === 2 || day === 22 ? 'nd' :
                   day === 3 || day === 23 ? 'rd' : 'th';
    return `${days[date.getDay()]}, ${day}${suffix} ${months[date.getMonth()]} ${date.getFullYear()}`;
  },

  formatShortDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  },

  formatExitStatus(trade) {
    const status = (trade.status || '').toLowerCase();
    const reason = (trade.exitReason || '').toLowerCase();

    if (status === 'expired' || reason.includes('expired')) {
      return 'Expired';
    }
    if (status === 'stopped out' || reason.includes('stop') || reason.includes('auto-closed')) {
      return 'Stopped';
    }
    if (reason.includes('exercised') || reason.includes('assigned')) {
      return 'Exercised';
    }
    return 'Closed';
  },

  getContractsBreakdown(trade) {
    const hasPut = trade.putStrike != null;
    const hasCall = trade.callStrike != null;

    if (hasPut && hasCall) {
      // Strangle: split contracts evenly
      const perLeg = trade.contracts / 2;
      return `${perLeg}P / ${perLeg}C`;
    } else if (hasPut) {
      return `${trade.contracts}P`;
    } else if (hasCall) {
      return `${trade.contracts}C`;
    }
    return `${trade.contracts}`;
  },

  async fetchAndRender() {
    const [trades, current] = await Promise.all([
      this.fetchTrades(),
      this.fetchCurrent()
    ]);
    this.render(trades, current);
  },

  render(trades, current) {
    const container = document.querySelector('#window-track .window__content');
    if (!container) return;

    if (!trades || trades.length === 0) {
      container.innerHTML = `<p style="color: #666;">No trade data available</p>`;
      return;
    }

    const streakTrades = this.calculateStreak(trades);
    const streakLength = streakTrades.length;

    // Calculate accumulated P&L for streak (use premiumReceived for USD, entryPremium for HKD)
    let accumulatedUSD = 0;
    let accumulatedHKD = 0;
    for (const t of streakTrades) {
      accumulatedUSD += t.premiumReceived || 0;
      accumulatedHKD += t.entryPremium || 0;
    }

    let html = `<div style="font-family: 'IBM Plex Mono', monospace; font-size: 13px;">`;

    // === STREAK HEADER ===
    if (streakLength > 0) {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #333;">
          <div>
            <span style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Streak</span>
            <div style="font-size: 20px; font-weight: 600; color: #4ade80;">${streakLength} Day${streakLength > 1 ? 's' : ''}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: #666; text-transform: uppercase;">Total</span>
            <div style="font-size: 18px; font-weight: 600; color: #4ade80;">HKD ${accumulatedHKD.toFixed(0)}</div>
            <div style="font-size: 11px; color: #666;">USD ${accumulatedUSD.toFixed(0)}</div>
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #333;">
          <span style="font-size: 11px; color: #666;">No active streak</span>
        </div>
      `;
    }

    // === DAY-BY-DAY BREAKDOWN ===
    if (streakLength > 0) {
      streakTrades.forEach((trade, idx) => {
        const dayNum = idx + 1;
        const isLatest = idx === streakTrades.length - 1;
        const pnlHKD = trade.entryPremium || 0;
        const pnlUSD = trade.premiumReceived || 0;
        const exitStatus = this.formatExitStatus(trade);
        const isStopped = exitStatus === 'Stopped';

        html += `
          <div style="padding: 12px; margin-bottom: 8px; background: ${isLatest ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'}; border-radius: 4px; ${isLatest ? 'border-left: 2px solid #4ade80;' : ''}">

            <!-- Header: Day + Date + P&L -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <span style="font-size: 13px; font-weight: 600; color: #fff;">Day ${dayNum}</span>
                <span style="font-size: 11px; color: #555; margin-left: 8px;">${this.formatShortDate(trade.date)}</span>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 14px; font-weight: 600; color: #4ade80;">HKD ${pnlHKD.toFixed(0)}</div>
                <div style="font-size: 10px; color: #555;">USD ${pnlUSD.toFixed(0)}</div>
              </div>
            </div>

            <!-- Trade Info Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
              <div>
                <span style="color: #555;">${trade.symbol}</span>
                <span style="color: #888; margin-left: 4px;">${trade.strategy}</span>
              </div>
              <div style="text-align: right;">
                <span style="color: #555;">Entry</span>
                <span style="color: #888; margin-left: 4px;">${trade.entryTime}</span>
              </div>
              <div>
                <span style="color: #555;">Strikes</span>
                <span style="color: #888; margin-left: 4px;">${trade.putStrike || '-'}P / ${trade.callStrike || '-'}C</span>
              </div>
              <div style="text-align: right;">
                <span style="color: #555;">Contracts</span>
                <span style="color: #888; margin-left: 4px;">${this.getContractsBreakdown(trade)}</span>
              </div>
            </div>

            <!-- Premium per leg -->
            <div style="font-size: 10px; color: #444; margin-bottom: 8px;">
              ${trade.leg1Premium ? `Put @${trade.leg1Premium.toFixed(3)}` : ''}
              ${trade.leg1Premium && trade.leg2Premium ? ' · ' : ''}
              ${trade.leg2Premium ? `Call @${trade.leg2Premium.toFixed(3)}` : ''}
            </div>

            <!-- Exit Status -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #222;">
              <span style="font-size: 10px; padding: 2px 8px; background: ${isStopped ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.1)'}; color: ${isStopped ? '#ef4444' : '#4ade80'}; border-radius: 3px;">
                ${exitStatus}
              </span>
              <span style="font-size: 10px; color: #444;">
                Exit ${trade.exitTime}${trade.costToClose ? ` @ ${trade.costToClose.toFixed(2)}` : ''}
              </span>
            </div>
          </div>
        `;
      });
    }

    // === LIVE TRADE (only show if there's actually a trade today) ===
    if (current && current.hasTrade && current.trade) {
      const t = current.trade;
      html += `
        <div style="padding: 12px; background: rgba(245, 158, 11, 0.08); border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.2); margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 600; color: #f59e0b;">LIVE</span>
            <span style="font-size: 10px; color: #666;">${t.entryTime}</span>
          </div>
          <div style="font-size: 12px; color: #fff;">
            ${t.symbol} ${t.strategy} · ${t.contracts} contracts
          </div>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
    console.log('Track Widget: Rendered', { streakLength, trades: trades.length });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TrackWidget.init());
} else {
  TrackWidget.init();
}
