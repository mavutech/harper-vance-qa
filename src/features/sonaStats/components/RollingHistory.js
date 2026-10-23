import React from 'react';
import { Alert, Card, Col, Row, Spinner } from 'react-bootstrap';
import { useRecentPerformance } from '../hooks/useRecentPerformance';
import RollingAccuracyChart from './RollingAccuracyChart';
import DailyBreakdownTable from './DailyBreakdownTable';
import DirectionBiasChart from './DirectionBiasChart';
import AnalyticsErrorNotice from './AnalyticsErrorNotice';
import { ROLLING_COPY as C } from '../utils/rollingCopy';
import { formatRate } from '../utils/rollingPresentation';

/** Presents one compact report; all statistics come from the shared reporting backend. */
export default function RollingHistory({ days }) {
  const { report, loading, error, retry } = useRecentPerformance(days);
  if (loading) return <div className="py-5 text-center"><Spinner animation="border" role="status"><span className="visually-hidden">{C.loading}</span></Spinner></div>;
  if (error) return <AnalyticsErrorNotice message={error} onRetry={retry} />;
  if (!report) return null;
  const cards = [
    [C.created, report.summary.created], [C.hits, report.summary.hits], [C.accuracy, formatRate(report.summary.accuracy)],
    [C.latest5, formatRate(report.latest5.accuracy)], [C.latest20, formatRate(report.latest20.accuracy)],
  ];
  return <section aria-label={C.title}>
    <p className="mb-1">{report.period.start} – {report.period.end} · {report.period.timezone}</p>
    <p className="text-secondary">{C.coverage}: {report.coverage.covered} / {report.coverage.expected} {C.sessions}</p>
    {report.coverage.status !== 'complete' && <Alert variant="warning">{C.incomplete}</Alert>}
    <Row className="g-2 mb-3">{cards.map(([label, value]) => <Col xs={6} lg key={label}>
      <Card className="card-one h-100"><Card.Body className="p-3"><div className="text-secondary fs-sm">{label}</div>
        <strong className="fs-4" data-testid={`rolling-${label}`}>{value}</strong></Card.Body></Card>
    </Col>)}</Row>
    <p className="text-secondary fs-sm">{C.definition}</p>
    {report.latest20.status !== 'complete' && <p className="text-secondary fs-sm">{C.trendUnavailable}</p>}
    <RollingAccuracyChart report={report} />
    <DirectionBiasChart report={report} />
    <DailyBreakdownTable days={report.days} />
  </section>;
}
