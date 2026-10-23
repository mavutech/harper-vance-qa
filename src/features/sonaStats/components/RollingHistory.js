import React from 'react';
import { Spinner } from 'react-bootstrap';
import { useRecentPerformance } from '../hooks/useRecentPerformance';
import { ROLLING_COPY as C } from '../utils/rollingCopy';
import AnalyticsErrorNotice from './AnalyticsErrorNotice';
import RecentPerformanceReport from './RecentPerformanceReport';

/** Loads recent performance only while this History view is selected. */
export default function RollingHistory({ days }) {
  const { report, loading, error, retry } = useRecentPerformance(days);
  if (loading) return <div className="py-5 text-center"><Spinner animation="border" role="status"><span className="visually-hidden">{C.loading}</span></Spinner></div>;
  if (error) return <AnalyticsErrorNotice message={error} onRetry={retry} />;
  return report ? <RecentPerformanceReport report={report} /> : null;
}
