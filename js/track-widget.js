/**
 * Track Widget - Streak tracker with day-by-day breakdown
 */

const TrackWidget = {
  API_BASE: 'https://apeyolo.com',
  updateInterval: 30000,

  // Format number with commas (e.g., 2285 -> "2,285")
  formatNumber(num) {
    return Math.round(num).toLocaleString();
  },

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
    // Sort by date descending, filter out open trades
    const closedTrades = trades
      .filter(t => t.outcome !== 'open' && t.status !== 'open')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const streakTrades = [];
    for (const trade of closedTrades) {
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

    // Calculate accumulated P&L and notional for streak
    let accumulatedUSD = 0;
    let accumulatedHKD = 0;
    let accumulatedNotional = 0;
    for (const t of streakTrades) {
      accumulatedUSD += t.premiumReceived || 0;
      accumulatedHKD += t.entryPremium || 0;
      accumulatedNotional += t.totalNotionalHKD || 0;
    }

    let html = `<div style="font-family: 'IBM Plex Mono', monospace; font-size: 13px;">`;

    // === STREAK HEADER ===
    // Only show realized P&L from closed trades
    const hasOpenTrade = current && current.hasTrade && current.trade && current.trade.isOpen && current.trade.status === 'open';
    const displayDays = hasOpenTrade ? streakLength + 1 : streakLength;


    if (streakLength > 0 || hasOpenTrade) {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #333;">
          <div>
            <span style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Streak</span>
            <div style="font-size: 20px; font-weight: 600; color: #4ade80;">${displayDays} Day${displayDays > 1 ? 's' : ''}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: #666; text-transform: uppercase;">Total P&L</span>
            <div style="font-size: 18px; font-weight: 600; color: #4ade80;">HKD ${this.formatNumber(accumulatedHKD)} <span style="font-size: 11px; color: #666; font-weight: 400;">(USD ${this.formatNumber(accumulatedUSD)})</span></div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #333;">
          <div>
            <span style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Implied Notional</span>
            <div style="font-size: 16px; font-weight: 500; color: #888;">HKD ${accumulatedNotional.toLocaleString()}</div>
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
        const pnlHKD = trade.entryPremium || 0;
        const pnlUSD = trade.premiumReceived || 0;
        const exitStatus = this.formatExitStatus(trade);
        const isStopped = exitStatus === 'Stopped';

        html += `
          <div style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">

            <!-- Header: Day + Date + P&L -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <span style="font-size: 13px; font-weight: 600; color: #fff;">Day ${dayNum}</span>
                <span style="font-size: 11px; color: #555; margin-left: 8px;">${this.formatShortDate(trade.date)}</span>
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #4ade80;">HKD ${this.formatNumber(pnlHKD)} <span style="font-size: 10px; color: #555; font-weight: 400;">(USD ${this.formatNumber(pnlUSD)})</span></div>
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
                <span style="color: #888; margin-left: 4px;">${trade.putStrike ? trade.putStrike + 'P' : ''}${trade.putStrike && trade.callStrike ? ' / ' : ''}${trade.callStrike ? trade.callStrike + 'C' : ''}</span>
              </div>
              <div style="text-align: right;">
                <span style="color: #555;">Contracts</span>
                <span style="color: #888; margin-left: 4px;">${this.getContractsBreakdown(trade)}</span>
              </div>
              <div>
                <span style="color: #555;">Implied Notional</span>
              </div>
              <div style="text-align: right;">
                <span style="color: #888;">HKD ${(trade.totalNotionalHKD || 0).toLocaleString()}</span>
              </div>
            </div>

            <!-- Premium per leg + Stop loss -->
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #444; margin-bottom: 8px;">
              <span>
                ${trade.leg1Premium ? `Put @${trade.leg1Premium.toFixed(3)}` : ''}
                ${trade.leg1Premium && trade.leg2Premium ? ' · ' : ''}
                ${trade.leg2Premium ? `Call @${trade.leg2Premium.toFixed(3)}` : ''}
              </span>
              ${trade.stopLossMultiplier ? `<span style="color: #666;">Stop: ${trade.stopLossMultiplier.toFixed(1)}x</span>` : ''}
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

    // === LIVE TRADE (show as next day in streak format) ===
    // Only show if trade is truly open (not expired/closed)
    if (current && current.hasTrade && current.trade && current.trade.isOpen && current.trade.status === 'open') {
      const t = current.trade;
      const dayNum = streakLength + 1;
      const pnlHKD = t.totalPremiumHKD || 0;
      const pnlUSD = t.totalPremiumUSD || 0;

      // Calculate premium sold from legs
      let premiumSoldUSD = 0;
      let putStrike = null, callStrike = null, leg1Premium = null, leg2Premium = null;
      if (t.legs && t.legs.length > 0) {
        for (const leg of t.legs) {
          premiumSoldUSD += leg.premiumUSD || 0;
          if (leg.type === 'PUT') {
            putStrike = leg.strike;
            leg1Premium = leg.premiumUSD / (leg.contracts * 100);
          } else if (leg.type === 'CALL') {
            callStrike = leg.strike;
            leg2Premium = leg.premiumUSD / (leg.contracts * 100);
          }
        }
      }
      const HKD_RATE = 7.8;
      const premiumSoldHKD = premiumSoldUSD * HKD_RATE;
      const costToCloseUSD = premiumSoldUSD - pnlUSD;
      const costToCloseHKD = premiumSoldHKD - pnlHKD;

      // Contract breakdown
      let contractsText = `${t.contracts}`;
      if (putStrike && callStrike) {
        contractsText = `${t.contracts / 2}P / ${t.contracts / 2}C`;
      } else if (putStrike) {
        contractsText = `${t.contracts}P`;
      } else if (callStrike) {
        contractsText = `${t.contracts}C`;
      }

      html += `
        <div style="padding: 12px; margin-bottom: 8px; background: rgba(245, 158, 11, 0.06); border-radius: 4px; border-left: 2px solid #f59e0b;">

          <!-- Header: Day + Date + P&L -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span style="font-size: 13px; font-weight: 600; color: #fff;">Day ${dayNum}</span>
              <span style="font-size: 11px; color: #555; margin-left: 8px;">${this.formatShortDate(current.todayStr)}</span>
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #f59e0b;">HKD ${this.formatNumber(premiumSoldHKD)} <span style="font-size: 10px; color: #555; font-weight: 400;">(USD ${this.formatNumber(premiumSoldUSD)})</span></div>
          </div>

          <!-- Trade Info Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
            <div>
              <span style="color: #555;">${t.symbol}</span>
              <span style="color: #888; margin-left: 4px;">${t.strategy}</span>
            </div>
            <div style="text-align: right;">
              <span style="color: #555;">Entry</span>
              <span style="color: #888; margin-left: 4px;">${t.entryTime}</span>
            </div>
            <div>
              <span style="color: #555;">Strikes</span>
              <span style="color: #888; margin-left: 4px;">${putStrike ? putStrike + 'P' : ''}${putStrike && callStrike ? ' / ' : ''}${callStrike ? callStrike + 'C' : ''}</span>
            </div>
            <div style="text-align: right;">
              <span style="color: #555;">Contracts</span>
              <span style="color: #888; margin-left: 4px;">${contractsText}</span>
            </div>
            <div>
              <span style="color: #555;">Implied Notional</span>
            </div>
            <div style="text-align: right;">
              <span style="color: #888;">HKD ${(((putStrike || 0) + (callStrike || 0)) * (t.contracts / (putStrike && callStrike ? 2 : 1)) * 100 * 7.8).toLocaleString()}</span>
            </div>
          </div>

          <!-- Premium per leg + Stop loss -->
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #444; margin-bottom: 8px;">
            <span>
              ${leg1Premium ? `Put @${leg1Premium.toFixed(3)}` : ''}
              ${leg1Premium && leg2Premium ? ' · ' : ''}
              ${leg2Premium ? `Call @${leg2Premium.toFixed(3)}` : ''}
            </span>
            ${t.stopLossMultiplier ? `<span style="color: #666;">Stop: ${parseFloat(t.stopLossMultiplier).toFixed(1)}x</span>` : ''}
          </div>

          <!-- Status -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #333;">
            <span style="font-size: 10px; padding: 2px 8px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-radius: 3px;">
              Open
            </span>
            ${current.timeUntilClose ? `<span style="font-size: 10px; color: #666;">Closes in ${current.timeUntilClose}</span>` : ''}
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
