/**
 * @fileoverview Platform-owner inbox for verified report-request leads.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Badge, Button, Card, Col, Form, Row, Spinner} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import {useReportRequests} from '../hooks/useReportRequests';
import copy from '../locales/en.json';
import {humanizeIdentifier} from '../utils/customerAdminConstants';

const STATUSES = Object.freeze([
  'email_verification_pending',
  'under_review',
  'approved',
  'declined',
  'delivered',
  'delivery_failed',
]);

const STATUS_VARIANTS = Object.freeze({
  email_verification_pending: 'secondary',
  under_review: 'primary',
  approved: 'info',
  declined: 'danger',
  delivered: 'success',
  delivery_failed: 'warning',
});

/**
 * Formats one API date value for the owner.
 *
 * @param {*} value - Serialized Firestore date
 * @return {string} Readable date
 */
const formatDate = (value) => {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

/**
 * Shows one report request and its review controls.
 *
 * @param {Object} props - Report request card properties
 * @return {JSX.Element} Report request card
 */
function ReportRequestCard({request, onDecision, submitting, operationError}) {
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const text = copy.reportRequests;
  const reviewable = Boolean(request.verifiedAt) && [
    'under_review',
    'approved',
    'delivery_failed',
  ].includes(request.status);
  const canDecline = request.status === 'under_review';

  /**
   * Submits the controlled owner decision.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const submitDecision = async (event) => {
    event.preventDefault();
    if (!reviewable || !decision) return;
    await onDecision(request.requestId, {decision, reason: reason.trim()});
  };

  return (
    <Card className="card-one mb-3" data-testid="report-request-card">
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h5 className="mb-1">{request.companyName}</h5>
            <div className="text-secondary">{request.fullName} · {request.jobTitle}</div>
          </div>
          <Badge bg={STATUS_VARIANTS[request.status] || 'secondary'}>
            {text.filters[request.status] || humanizeIdentifier(request.status)}
          </Badge>
        </div>
        <Row className="g-3 mb-3">
          <Col xs="12" md="6"><strong>{text.workEmail}:</strong>{' '}<a href={`mailto:${request.workEmail}`}>{request.workEmail}</a></Col>
          <Col xs="12" md="6"><strong>{text.companyDomain}:</strong> {request.companyDomain}</Col>
          <Col xs="12" md="6"><strong>{text.organizationType}:</strong> {humanizeIdentifier(request.organizationType)}</Col>
          <Col xs="12" md="6"><strong>{text.submittedAt}:</strong> {formatDate(request.createdAt)}</Col>
          <Col xs="12" md="6"><strong>{text.emailRepeats}:</strong> {request.priorReportRequestCount}</Col>
          <Col xs="12" md="6"><strong>{text.ipRepeats}:</strong> {request.priorIpRequestCount}</Col>
        </Row>
        {!request.verifiedAt && <Alert variant="info" className="mb-0">{text.verificationPending}</Alert>}
        {request.verifiedAt && !reviewable && <Alert variant="light" className="mb-0">{text.closed}</Alert>}
        {reviewable && (
          <Form onSubmit={submitDecision} className="border-top pt-3">
            <Row className="g-3">
              <Col xs="12" md="6">
                <Form.Group controlId={`report-decision-${request.requestId}`}>
                  <Form.Label>{text.decision}</Form.Label>
                  <Form.Select required value={decision} onChange={(event) => setDecision(event.target.value)}>
                    <option value="">{text.chooseDecision}</option>
                    <option value="approve_and_send">{request.status === 'under_review' ? text.approveAndSend : text.retryDelivery}</option>
                    {canDecline && <option value="decline">{text.decline}</option>}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs="12">
                <Form.Group controlId={`report-reason-${request.requestId}`}>
                  <Form.Label>{text.reason}</Form.Label>
                  <Form.Control as="textarea" rows={2} minLength={4} maxLength={500} required value={reason} onChange={(event) => setReason(event.target.value)} />
                </Form.Group>
              </Col>
              {operationError && <Col xs="12"><Alert variant="danger" className="mb-0">{text.operationError}</Alert></Col>}
              <Col xs="12"><Button type="submit" disabled={submitting || !decision}>{submitting ? text.saving : text.saveDecision}</Button></Col>
            </Row>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}

/**
 * Renders the platform-owner report lead inbox.
 *
 * @return {JSX.Element} Report-request administration page
 */
export default function ReportRequestsPage() {
  const [skin, setSkin] = useState(localStorage.getItem('skin-mode') ? 'dark' : '');
  const state = useReportRequests();
  const text = copy.reportRequests;

  useEffect(() => {
    setSkin(localStorage.getItem('skin-mode') ? 'dark' : '');
  }, []);

  return (
    <React.Fragment>
      <Header onSkin={setSkin} />
      <div className="main main-app p-3 p-lg-4" data-skin={skin || undefined}>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div>
            <div className="text-uppercase text-secondary fs-xs mb-1">{copy.navigation.section}</div>
            <h4 className="main-title mb-1">{text.title}</h4>
            <p className="text-secondary mb-0">{text.subtitle}</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button as={Link} to="/admin/applications" variant="outline-secondary">{text.accessApplications}</Button>
            <Button variant="outline-primary" onClick={() => state.loadRequests(state.statusFilter)} disabled={state.loading}>{text.refresh}</Button>
          </div>
        </div>
        {state.operationSucceeded && <Alert variant="success" role="status">{text.success}</Alert>}
        <Card className="card-one mb-3"><Card.Body><Row className="align-items-end g-3">
          <Col xs="12" md="6"><Form.Group controlId="report-status-filter"><Form.Label>{text.filterLabel}</Form.Label><Form.Select value={state.statusFilter} onChange={(event) => state.loadRequests(event.target.value)} disabled={state.loading}><option value="">{text.filters.all}</option>{STATUSES.map((status) => <option key={status} value={status}>{text.filters[status]}</option>)}</Form.Select></Form.Group></Col>
          <Col xs="12" md="6" className="text-secondary text-md-end">{text.count.replace('{count}', String(state.requests.length))}</Col>
        </Row></Card.Body></Card>
        {state.loading && <div className="d-flex justify-content-center gap-2 py-5"><Spinner animation="border" size="sm" /><span>{text.loading}</span></div>}
        {!state.loading && state.error && <Alert variant="danger"><p>{text.error}</p><Button size="sm" onClick={() => state.loadRequests(state.statusFilter)}>{text.retry}</Button></Alert>}
        {!state.loading && !state.error && state.requests.length === 0 && <Card className="card-one"><Card.Body className="text-secondary">{text.empty}</Card.Body></Card>}
        {!state.loading && !state.error && state.requests.map((request) => <ReportRequestCard key={request.requestId} request={request} onDecision={state.decideRequest} submitting={state.operationLoading} operationError={state.operationError} />)}
        {!state.loading && !state.error && state.nextCursor && <div className="d-flex justify-content-center py-3"><Button variant="outline-primary" onClick={state.loadMoreRequests} disabled={state.loadingMore}>{state.loadingMore ? text.loadingMore : text.loadMore}</Button></div>}
      </div>
      <Footer />
    </React.Fragment>
  );
}
