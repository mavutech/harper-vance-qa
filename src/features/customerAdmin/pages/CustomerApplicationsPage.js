/**
 * @fileoverview Platform-admin inbox for business access applications.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Badge, Button, Card, Col, Form, Row, Spinner} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import {useCustomerAccessRequests} from '../hooks/useCustomerAccessRequests';
import copy from '../locales/en.json';
import {
  billingIntervalsForLicense,
  defaultBillingIntervalForLicense,
  humanizeIdentifier,
  LICENSE_OPTIONS,
  licenseLabel,
} from '../utils/customerAdminConstants';

const REVIEWABLE_STATUSES = Object.freeze([
  'submitted',
  'more_information_requested',
  'enterprise_review',
]);

const APPLICATION_STATUSES = Object.freeze([
  'email_verification_pending',
  ...REVIEWABLE_STATUSES,
  'approved',
  'waitlisted',
  'declined',
  'withdrawn',
]);

const STATUS_VARIANTS = Object.freeze({
  email_verification_pending: 'secondary',
  submitted: 'primary',
  more_information_requested: 'warning',
  enterprise_review: 'info',
  approved: 'success',
  waitlisted: 'warning',
  declined: 'danger',
  withdrawn: 'secondary',
});

/**
 * Formats a Firestore timestamp or serialized date for the administrator.
 *
 * @param {*} value - Date value returned by the backend
 * @return {string} Readable date or an em dash
 */
const formatDate = (value) => {
  if (!value) return '—';
  const date = typeof value.toDate === 'function' ? value.toDate() :
    (value._seconds ? new Date(value._seconds * 1000) : new Date(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

/**
 * Returns one request's review draft, with safe defaults from its application.
 *
 * @param {Object} request - Application record
 * @param {Object} drafts - Draft state keyed by request identifier
 * @return {Object} Review form values
 */
const draftForRequest = (request, drafts) => drafts[request.requestId] || ({
  decision: '',
  reason: '',
  approvedLicenseCode: request.requestedLicenseCode,
  approvedBillingInterval: request.requestedBillingInterval ||
    defaultBillingIntervalForLicense(request.requestedLicenseCode),
});

/**
 * Shows the application details and guarded decision controls.
 *
 * @param {Object} props - Application card properties
 * @return {JSX.Element} Application card
 */
function ApplicationCard({request, drafts, onDraftChange, onDecision, submitting, error}) {
  const text = copy.applications;
  const draft = draftForRequest(request, drafts);
  const verified = Boolean(request.verifiedAt);
  const reviewable = verified && REVIEWABLE_STATUSES.includes(request.status);
  const intervals = billingIntervalsForLicense(draft.approvedLicenseCode);

  /**
   * Submits one decision using only the values accepted by the review API.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const submitDecision = async (event) => {
    event.preventDefault();
    if (!reviewable || !draft.decision) return;
    const input = {
      decision: draft.decision,
      reason: draft.reason.trim(),
    };
    if (draft.decision === 'approve') {
      input.approvedLicenseCode = draft.approvedLicenseCode;
      input.approvedBillingInterval = draft.approvedBillingInterval;
    }
    await onDecision(request.requestId, input);
  };

  return (
    <Card className="card-one mb-3" data-testid="access-request-card">
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h5 className="mb-1">{request.companyName}</h5>
            <div className="text-secondary">{request.applicantName} · {request.jobTitle}</div>
          </div>
          <Badge bg={STATUS_VARIANTS[request.status] || 'secondary'}>
            {text.filters[request.status] || humanizeIdentifier(request.status)}
          </Badge>
        </div>

        <Row className="g-3 mb-3">
          <Col xs="12" md="6">
            <strong>{text.contact}:</strong>{' '}
            <a href={`mailto:${request.workEmail}`}>{request.workEmail}</a>
          </Col>
          <Col xs="12" md="6"><strong>{text.domain}:</strong> {request.companyWebsiteDomain}</Col>
          <Col xs="6" md="3"><strong>{text.country}:</strong> {request.country}</Col>
          <Col xs="6" md="3"><strong>{text.expectedUsers}:</strong> {request.expectedUsers}</Col>
          <Col xs="12" md="3"><strong>{text.requestedLicense}:</strong> {request.requestedPlanName || licenseLabel(request.requestedLicenseCode)}</Col>
          <Col xs="12" md="3"><strong>{text.requestedBilling}:</strong> {humanizeIdentifier(request.requestedBillingInterval)}</Col>
          <Col xs="12"><strong>{text.integrations}:</strong> {(request.requestedIntegrations || []).map(humanizeIdentifier).join(', ') || text.noIntegrations}</Col>
          <Col xs="12"><strong>{text.businessUse}:</strong><div className="text-secondary">{request.intendedBusinessUse}</div></Col>
          <Col xs="12"><strong>{text.submittedAt}:</strong> {formatDate(request.createdAt)}</Col>
          {request.onboardingStatus && (
            <Col xs="12" md="6"><strong>{text.onboardingStatus}:</strong> {humanizeIdentifier(request.onboardingStatus)}</Col>
          )}
          {request.onboardingOrgId && (
            <Col xs="12" md="6"><strong>{text.onboardingOrganization}:</strong> {request.onboardingOrgId}</Col>
          )}
        </Row>

        {!verified && <Alert variant="info" className="mb-0">{text.verification}</Alert>}
        {verified && !reviewable && <Alert variant="light" className="mb-0">{text.notReviewable}</Alert>}
        {reviewable && (
          <Form onSubmit={submitDecision} className="border-top pt-3">
            <h6>{text.reviewTitle}</h6>
            <Row className="g-3">
              <Col xs="12" md="6">
                <Form.Group controlId={`decision-${request.requestId}`}>
                  <Form.Label>{text.decision}</Form.Label>
                  <Form.Select
                    required
                    value={draft.decision}
                    onChange={(event) => onDraftChange(request.requestId, 'decision', event.target.value)}
                  >
                    <option value="">{text.chooseDecision}</option>
                    {Object.entries(text.decisions).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              {draft.decision === 'approve' && (
                <>
                  <Col xs="12" md="6">
                    <Form.Group controlId={`approved-license-${request.requestId}`}>
                      <Form.Label>{text.approvedLicense}</Form.Label>
                      <Form.Select
                        value={draft.approvedLicenseCode}
                        onChange={(event) => {
                          const approvedLicenseCode = event.target.value;
                          onDraftChange(request.requestId, 'approvedLicenseCode', approvedLicenseCode);
                          onDraftChange(
                              request.requestId,
                              'approvedBillingInterval',
                              defaultBillingIntervalForLicense(approvedLicenseCode),
                          );
                        }}
                      >
                        {LICENSE_OPTIONS.map((license) => (
                          <option key={license} value={license}>{licenseLabel(license)}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs="12" md="6">
                    <Form.Group controlId={`approved-billing-${request.requestId}`}>
                      <Form.Label>{text.approvedBilling}</Form.Label>
                      <Form.Select
                        value={draft.approvedBillingInterval}
                        onChange={(event) => onDraftChange(request.requestId, 'approvedBillingInterval', event.target.value)}
                      >
                        {intervals.map((interval) => (
                          <option key={interval} value={interval}>{humanizeIdentifier(interval)}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </>
              )}
              <Col xs="12">
                <Form.Group controlId={`review-reason-${request.requestId}`}>
                  <Form.Label>{text.reason}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    minLength={4}
                    maxLength={500}
                    required
                    value={draft.reason}
                    onChange={(event) => onDraftChange(request.requestId, 'reason', event.target.value)}
                  />
                </Form.Group>
              </Col>
              {error && <Col xs="12"><Alert variant="danger" className="mb-0" role="alert">{text.operationError}</Alert></Col>}
              <Col xs="12">
                <Button type="submit" disabled={submitting || !draft.decision}>
                  {submitting ? text.saving : text.saveDecision}
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}

/**
 * Renders the super-admin application inbox within the dashboard.
 *
 * @return {JSX.Element} Application administration page
 */
export default function CustomerApplicationsPage() {
  const [skin, setSkin] = useState(localStorage.getItem('skin-mode') ? 'dark' : '');
  const [drafts, setDrafts] = useState({});
  const {
    requests,
    statusFilter,
    nextCursor,
    loading,
    loadingMore,
    error,
    operationLoading,
    operationError,
    operationSucceeded,
    loadRequests,
    loadMoreRequests,
    decideRequest,
  } = useCustomerAccessRequests();

  /**
   * Updates one field in an application review draft.
   *
   * @param {string} requestId - Request identifier
   * @param {string} field - Draft field
   * @param {string} value - New field value
   * @return {void}
   */
  const updateDraft = (requestId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [requestId]: {
        ...draftForRequest({
          requestId,
          requestedLicenseCode: requests.find((request) => request.requestId === requestId)?.requestedLicenseCode,
          requestedBillingInterval: requests.find((request) => request.requestId === requestId)?.requestedBillingInterval,
        }, current),
        [field]: value,
      },
    }));
  };

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
            <h4 className="main-title mb-1">{copy.applications.title}</h4>
            <p className="text-secondary mb-0">{copy.applications.subtitle}</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button as={Link} to="/admin/organizations" variant="outline-secondary">
              {copy.applications.backToCustomers}
            </Button>
            <Button variant="outline-primary" onClick={() => loadRequests(statusFilter)} disabled={loading}>
              {copy.applications.refresh}
            </Button>
          </div>
        </div>

        {operationSucceeded && <Alert variant="success" role="status">{copy.applications.success}</Alert>}
        <Card className="card-one mb-3">
          <Card.Body>
            <Row className="align-items-end g-3">
              <Col xs="12" md="6">
                <Form.Group controlId="application-status-filter">
                  <Form.Label>{copy.applications.filterLabel}</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(event) => loadRequests(event.target.value)}
                    disabled={loading}
                  >
                    <option value="">{copy.applications.filters.all}</option>
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>{copy.applications.filters[status]}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs="12" md="6" className="text-secondary text-md-end">
                {copy.applications.count.replace('{count}', String(requests.length))}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {loading && (
          <div className="d-flex justify-content-center align-items-center gap-2 py-5" aria-live="polite">
            <Spinner animation="border" size="sm" />
            <span className="text-secondary">{copy.applications.loading}</span>
          </div>
        )}
        {!loading && error && (
          <Alert variant="danger" role="alert">
            <p>{copy.applications.error}</p>
            <Button size="sm" onClick={() => loadRequests(statusFilter)}>{copy.applications.retry}</Button>
          </Alert>
        )}
        {!loading && !error && requests.length === 0 && (
          <Card className="card-one"><Card.Body className="text-secondary">{copy.applications.empty}</Card.Body></Card>
        )}
        {!loading && !error && requests.map((request) => (
          <ApplicationCard
            key={request.requestId}
            request={request}
            drafts={drafts}
            onDraftChange={updateDraft}
            onDecision={decideRequest}
            submitting={operationLoading}
            error={operationError}
          />
        ))}
        {!loading && !error && nextCursor && (
          <div className="d-flex justify-content-center py-3">
            <Button variant="outline-primary" onClick={loadMoreRequests} disabled={loadingMore}>
              {loadingMore ? copy.applications.loadingMore : copy.applications.loadMore}
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </React.Fragment>
  );
}
