import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MonthlyReport from './MonthlyReport';
import fixture from './__fixtures__/monthlyReport.json';

jest.mock('react-apexcharts', () => () => <div />);

const renderReport = (report = fixture) => render(<MemoryRouter><MonthlyReport report={report} /></MemoryRouter>);

it('shows target-weighted statistics, samples, coverage and the prior month side by side', () => {
  renderReport();
  expect(screen.getByText('2026-10 · Month so far')).toBeInTheDocument();
  expect(screen.getByText(/Missing or inconsistent reports/)).toBeInTheDocument();
  expect(screen.getByText(/Their saved target records passed the report consistency checks/)).toBeInTheDocument();
  expect(screen.getAllByText('66.7%').length).toBeGreaterThan(0);
  expect(screen.getByText('Previous month (2026-09)')).toBeInTheDocument();
  expect(screen.getByText('75%')).toBeInTheDocument();
  expect(screen.getAllByText('2 / 2').length).toBe(2);
  const zeroDay = screen.getByRole('row', {name: /Open daily report 2026-10-02/});
  expect(within(zeroDay).getByText('Zero targets')).toBeInTheDocument();
  expect(within(zeroDay).getAllByText('N/A').length).toBeGreaterThan(0);
  expect(screen.queryByText('Market closed')).not.toBeInTheDocument();
  expect(screen.queryByRole('row', {name: /2026-10-03/})).not.toBeInTheDocument();
  expect(screen.getByText('Trading weekdays only. Closed dates are omitted; missing and inconsistent reports remain visible.')).toBeInTheDocument();
  expect(screen.getAllByText('Report unavailable').length).toBeGreaterThan(0);
  expect(screen.getByRole('row', {name: /example-1/})).toHaveTextContent('Hit');
  expect(screen.getByRole('row', {name: /example-3/})).toHaveTextContent('Miss');
  expect(screen.getByText(/Cross-session fills are not evaluated here/)).toBeInTheDocument();
});
it('shows no-report and unavailable-baseline states without fabricated percentages', () => {
  renderReport({...fixture, period: {...fixture.period, inProgress: false}, coverage: {...fixture.coverage, daysCovered: 0, legacyDates: []},
    summary: {...fixture.summary, created: 0, hits: 0, missed: 0, accuracy: null, medianTime: null, medianPullback: null},
    consistency: {...fixture.consistency, bestDay: null, worstDay: null}, comparison: {month: '2026-09', summary: null, coverage: null},
    targets: []});
  expect(screen.getByText('2026-10 · Full calendar month')).toBeInTheDocument();
  expect(screen.getByText('No completed daily reports are available for this month.')).toBeInTheDocument();
  expect(screen.getByText(/Comparison unavailable/)).toBeInTheDocument();
  expect(screen.queryByText('Previous month (2026-09)')).not.toBeInTheDocument();
});
