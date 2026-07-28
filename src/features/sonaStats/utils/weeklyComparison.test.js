import { buildComparison, buildCountComparison, parseLeadingNumber } from './weeklyComparison';

describe('parseLeadingNumber', () => {
  it('parses numbers out of stat strings', () => {
    expect(parseLeadingNumber('91.7% Accuracy')).toBe(91.7);
    expect(parseLeadingNumber('3.0 mins')).toBe(3.0);
    expect(parseLeadingNumber('18.4 pts')).toBe(18.4);
    expect(parseLeadingNumber(42)).toBe(42);
    expect(parseLeadingNumber('N/A')).toBeNull();
    expect(parseLeadingNumber(undefined)).toBeNull();
  });
});

describe('buildComparison', () => {
  it('marks a higher accuracy as favorable (green, up)', () => {
    const c = buildComparison({ thisWeek: '91.7% Accuracy', baseline: '88.1', unit: 'pts', betterWhenHigher: true });
    expect(c).toEqual({ text: '3.6 pts vs 20-session avg (88.1 pts)', direction: 'up', tone: 'positive' });
  });

  it('marks a faster time as favorable even though the number is lower', () => {
    const c = buildComparison({ thisWeek: '3.0 mins', baseline: '4.1', unit: 'min', betterWhenHigher: false });
    expect(c).toEqual({ text: '1.1 min vs 20-session avg (4.1 min)', direction: 'down', tone: 'positive' });
  });

  it('spells out the baseline value in the comparison text', () => {
    const c = buildComparison({ thisWeek: '17.4 pts', baseline: '14.6', unit: 'pts', neutral: true });
    expect(c.text).toBe('2.8 pts vs 20-session avg (14.6 pts)');
  });

  it('omits the space between number and unit for percentages', () => {
    const c = buildComparison({ thisWeek: '92.9', baseline: '91.5', unit: '%' });
    expect(c.text).toBe('1.4% vs 20-session avg (91.5%)');
  });

  it('keeps retraction neutral (grey) regardless of direction', () => {
    const c = buildComparison({ thisWeek: '18.4 pts', baseline: '16.2', unit: 'pts', neutral: true });
    expect(c.tone).toBe('neutral');
    expect(c.direction).toBe('up');
  });

  it('says "in line" when the change is negligible', () => {
    const c = buildComparison({ thisWeek: '88.1', baseline: '88.1', unit: 'pts' });
    expect(c).toEqual({ text: 'in line with 20-session avg (88.1 pts)', direction: null, tone: 'neutral' });
  });

  it('returns null when a value is missing', () => {
    expect(buildComparison({ thisWeek: 'N/A', baseline: '88.1', unit: 'pts' })).toBeNull();
    expect(buildComparison({ thisWeek: '88.1', baseline: null, unit: 'pts' })).toBeNull();
  });
});

describe('buildCountComparison', () => {
  it('shows the rounded typical-week count, not a fractional delta', () => {
    expect(buildCountComparison({ thisWeek: 37, baselinePerWeek: 35.0 }))
      .toEqual({ text: 'vs 35 in a typical week', direction: 'up', tone: 'positive' });
    // 29.5 rounds to 30; this week 32 is above it
    expect(buildCountComparison({ thisWeek: 32, baselinePerWeek: 29.5 }))
      .toEqual({ text: 'vs 30 in a typical week', direction: 'up', tone: 'positive' });
  });

  it('reds the arrow when below a typical week', () => {
    const c = buildCountComparison({ thisWeek: 20, baselinePerWeek: 35.4 });
    expect(c.direction).toBe('down');
    expect(c.tone).toBe('negative');
  });

  it('says "in line" when it rounds to the same count', () => {
    expect(buildCountComparison({ thisWeek: 35, baselinePerWeek: 35.2 }))
      .toEqual({ text: 'in line with a typical week', direction: null, tone: 'neutral' });
  });
});
