import React from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment-timezone';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';
import { MONTHLY_COPY as C } from '../utils/monthlyCopy';
import { useMonthlyStats } from '../hooks/useMonthlyStats';
import { trackEvent } from '../../../utils/analytics';
import AnalyticsErrorNotice from './AnalyticsErrorNotice';
import MonthlyReport from './MonthlyReport';

/**
 * Calendar-month selection and loading states within the History page.
 * @returns {JSX.Element} Month navigation and report.
 */
export default function MonthlyHistory() {
  const [params, setParams] = useSearchParams();
  const currentMonth = moment().tz(EST_TIMEZONE).format('YYYY-MM');
  const month = params.get('month') ?? currentMonth;
  const valid = /^\d{4}-\d{2}$/.test(month) && moment(month, 'YYYY-MM', true).isValid() && month <= currentMonth;
  const { report, loading, error, retry } = useMonthlyStats(valid ? month : null);
  /** Changes month without discarding the selected History view. */
  const selectMonth = (value) => {
    const next = new URLSearchParams(params);
    next.set('month', value);
    setParams(next);
    trackEvent('sona_monthly_month_changed', { month: value });
  };
  return <>
    <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
      <button type="button" className="btn btn-outline-primary" disabled={!valid}
        onClick={() => selectMonth(moment(month, 'YYYY-MM', true).subtract(1, 'month').format('YYYY-MM'))}>{C.previous}</button>
      <Form.Group controlId="sona-report-month">
        <Form.Label>{C.month}</Form.Label>
        <Form.Control type="month" value={month} max={currentMonth} onChange={(event) => selectMonth(event.target.value)} />
      </Form.Group>
      <button type="button" className="btn btn-outline-primary" disabled={!valid || month >= currentMonth}
        onClick={() => selectMonth(moment(month, 'YYYY-MM', true).add(1, 'month').format('YYYY-MM'))}>{C.next}</button>
    </div>
    {!valid && <Alert variant="warning">{C.invalidMonth}</Alert>}
    {valid && loading && <Spinner animation="border" role="status"><span className="visually-hidden">{C.loading}</span></Spinner>}
    {valid && !loading && error && <AnalyticsErrorNotice message={error} onRetry={retry} />}
    {valid && !loading && !error && report && <MonthlyReport report={report} />}
  </>;
}
