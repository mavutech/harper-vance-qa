import React from 'react';
import { Col, Row, Spinner } from 'react-bootstrap';
import { useRollingStats } from '../hooks/useRollingStats';
import RollingAccuracyChart from './RollingAccuracyChart';
import StreakIndicator from './StreakIndicator';
import DailyBreakdownTable from './DailyBreakdownTable';
import DirectionBiasChart from './DirectionBiasChart';
import AnalyticsErrorNotice from './AnalyticsErrorNotice';

/**
 * Existing rolling History view, fetched only while selected.
 * @param {Object} props - End date and number of sessions.
 * @returns {JSX.Element} Rolling analytics.
 */
export default function RollingHistory({ toDate, days }) {
  const { rangeData, rolling5Day, rolling20Day, streak, loading, error, retry } = useRollingStats(toDate, days);
  return (<>
    {/* Loading state */}
        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Loading historical stats...</span>
            </Spinner>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <AnalyticsErrorNotice message={error} onRetry={retry} />
        )}

        {/* Content */}
        {!loading && !error && (
          <Row className="g-3">
            <Col xs="12" xl="8">
              <RollingAccuracyChart
                rangeData={rangeData}
                rolling5Day={rolling5Day}
                rolling20Day={rolling20Day}
              />
            </Col>
            <Col xs="12" xl="4">
              <StreakIndicator streak={streak} rangeData={rangeData} />
            </Col>
            <Col xs="12">
              <DirectionBiasChart rangeData={rangeData} />
            </Col>
            <Col xs="12">
              <DailyBreakdownTable rangeData={rangeData} />
            </Col>
          </Row>
        )}
  </>);
}
