import { getWeekSelectionFromSearch, getWeeklySummaryFallbackMessage } from './SonaWeekly';
import moment from 'moment';

describe('getWeekSelectionFromSearch', () => {
  it('uses a valid week and year from the URL', () => {
    expect(getWeekSelectionFromSearch(new URLSearchParams('week=29&year=2026')))
      .toEqual({ weekNumber: 29, year: 2026 });
  });

  it('falls back for an invalid week parameter', () => {
    const fallback = getWeekSelectionFromSearch(new URLSearchParams('week=99&year=2026'));

    expect(fallback).toEqual({ weekNumber: moment().isoWeek(), year: moment().isoWeekYear() });
  });

  it('falls back for a future week parameter', () => {
    const currentYear = moment().isoWeekYear();
    const currentWeek = moment().isoWeek();
    const next = moment().isoWeekYear(currentYear).isoWeek(currentWeek).add(1, 'week');
    const fallback = getWeekSelectionFromSearch(new URLSearchParams(
      `week=${next.isoWeek()}&year=${next.isoWeekYear()}`
    ));

    expect(fallback).toEqual({ weekNumber: currentWeek, year: currentYear });
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
