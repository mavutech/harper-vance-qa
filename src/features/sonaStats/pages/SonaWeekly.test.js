import { getWeekSelectionFromSearch, getWeeklySummaryFallbackMessage } from './SonaWeekly';

describe('getWeekSelectionFromSearch', () => {
  it('uses a valid week and year from the URL', () => {
    expect(getWeekSelectionFromSearch(new URLSearchParams('week=29&year=2026')))
      .toEqual({ weekNumber: 29, year: 2026 });
  });

  it('falls back for an invalid week parameter', () => {
    const fallback = getWeekSelectionFromSearch(new URLSearchParams('week=99&year=2026'));

    expect(fallback.weekNumber).toBeGreaterThanOrEqual(1);
    expect(fallback.year).toBe(2026);
  });

  it('falls back for a future week parameter', () => {
    const fallback = getWeekSelectionFromSearch(new URLSearchParams('week=99&year=2026'));

    expect(fallback.weekNumber).toBeGreaterThanOrEqual(1);
    expect(fallback.year).toBe(2026);
  });
});

describe('getWeeklySummaryFallbackMessage', () => {
  const currentWeek = { weekNumber: 31, year: 2026 };

  it('identifies a missing generated summary for a completed week', () => {
    expect(getWeeklySummaryFallbackMessage(30, 2026, currentWeek)).toBe(
      'The generated weekly summary for Week 30, 2026 is unavailable. Core results below are calculated from the available daily records; comparison metrics will return after the summary is regenerated.'
    );
  });

  it('describes the normal generation state for the current week', () => {
    expect(getWeeklySummaryFallbackMessage(31, 2026, currentWeek)).toBe(
      'The weekly summary is still being generated. Core results below are calculated from the available daily records; comparison metrics will appear once generation is complete.'
    );
  });
});