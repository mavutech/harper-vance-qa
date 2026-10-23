/** Centralized recent-performance copy and presentation settings. */
export const ROLLING_COPY = Object.freeze({
  title: 'Recent Performance', loading: 'Loading recent performance…',
  loadError: 'Recent performance could not be loaded. Please try again.',
  sessions: 'sessions', coverage: 'Report coverage', through: 'Completed sessions through',
  incomplete: 'Some reports are missing or need review. Totals include available reports only; incomplete trend windows show N/A.',
  definition: 'Accuracy is total hits divided by total targets. Zero-target sessions have no accuracy percentage.',
  created: 'Targets', hits: 'Hits', accuracy: 'Target accuracy', latest5: 'Latest 5 sessions', latest20: 'Latest 20 sessions',
  chart: 'Daily accuracy and 20-session trend', daily: 'Daily accuracy', trend: '20-session accuracy',
  chartNote: 'Bars show each session. The line pools targets across 20 completed sessions. Gaps mean unavailable results, not 0%.',
  trendUnavailable: 'A full 20-session trend requires complete reports within your history access.',
  directions: 'Direction comparison', bullish: 'Bullish', bearish: 'Bearish',
  directionNote: 'Hit rates across the selected sessions. Counts show the size of each sample.',
  breakdown: 'Daily breakdown', date: 'Session', outcome: 'Hits / targets', details: 'Details',
  medianTime: 'Median time to hit', measured: 'Measured hits', open: 'Open daily report',
  empty: 'No validated reports are available for this range.', na: 'N/A',
  status: {included: 'Included', zero_targets: 'No targets', missing: 'Report unavailable', invalid: 'Needs review'},
});
export const ROLLING_SESSION_OPTIONS = [10, 20, 40];
export const ROLLING_CHART_COLORS = ['#506fd9', '#e7a33e'];
