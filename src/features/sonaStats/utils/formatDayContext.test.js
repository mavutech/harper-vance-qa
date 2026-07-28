import { formatDayContextLabel } from './formatDayContext';

describe('formatDayContextLabel — render guards', () => {
  it('returns null for null / undefined / non-object input', () => {
    expect(formatDayContextLabel(null)).toBeNull();
    expect(formatDayContextLabel(undefined)).toBeNull();
    expect(formatDayContextLabel('regular')).toBeNull();
  });

  it('returns null when classification is missing', () => {
    expect(formatDayContextLabel({ eventTags: ['cpi'], severity: 'low' })).toBeNull();
  });

  it('returns null for weekend (never noteworthy)', () => {
    expect(formatDayContextLabel({ classification: 'weekend', eventTags: [], severity: 'none' })).toBeNull();
  });

  it('returns null for a regular day with no event tags', () => {
    expect(formatDayContextLabel({ classification: 'regular', eventTags: [], severity: 'none' })).toBeNull();
  });

  it('returns null when eventTags is missing on a regular day', () => {
    expect(formatDayContextLabel({ classification: 'regular', severity: 'none' })).toBeNull();
  });
});

describe('formatDayContextLabel — composition', () => {
  it('renders classification only when there are no tags and severity is none', () => {
    expect(formatDayContextLabel({
      classification: 'holiday_closed', eventTags: [], severity: 'none',
    })).toBe('Holiday Closed');
  });

  it('renders classification + severity (high)', () => {
    expect(formatDayContextLabel({
      classification: 'holiday_closed', eventTags: [], severity: 'high',
    })).toBe('Holiday Closed · high severity');
  });

  it('renders classification + single tag + severity', () => {
    expect(formatDayContextLabel({
      classification: 'expiry', eventTags: ['futures_roll'], severity: 'low',
    })).toBe('Expiry · Futures Roll · low severity');
  });

  it('renders classification + multiple comma-joined tags', () => {
    expect(formatDayContextLabel({
      classification: 'macro_event',
      eventTags: ['fomc_rate_decision', 'fomc_press_conference'],
      severity: 'critical',
    })).toBe('Macro Event · FOMC Rate Decision, FOMC Press Conference · critical severity');
  });

  it('omits severity when value is none', () => {
    expect(formatDayContextLabel({
      classification: 'expiry', eventTags: ['opex_monthly'], severity: 'none',
    })).toBe('Expiry · Monthly OpEx');
  });

  it('renders regular + one tag (no longer guarded null since tags are present)', () => {
    expect(formatDayContextLabel({
      classification: 'regular', eventTags: ['cpi'], severity: 'medium',
    })).toBe('Regular · CPI · medium severity');
  });

  it('falls back to the raw enum value when the label map has no entry', () => {
    expect(formatDayContextLabel({
      classification: 'half_day_after_overnight_gap',
      eventTags: ['some_future_tag'],
      severity: 'apocalyptic',
    })).toBe('half_day_after_overnight_gap · some_future_tag · apocalyptic');
  });

  it('renders all known classifications', () => {
    expect(formatDayContextLabel({ classification: 'holiday_early_close', eventTags: [], severity: 'low' }))
        .toBe('Early Close · low severity');
    expect(formatDayContextLabel({ classification: 'late_open', eventTags: [], severity: 'medium' }))
        .toBe('Late Open · medium severity');
    expect(formatDayContextLabel({ classification: 'macro_event', eventTags: ['nfp'], severity: 'high' }))
        .toBe('Macro Event · NFP · high severity');
  });
});
