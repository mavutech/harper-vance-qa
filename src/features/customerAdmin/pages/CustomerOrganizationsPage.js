/**
 * @fileoverview Super-admin customer organization review page.
 */

import React, {useMemo, useState} from 'react';
import {Badge, Button, Card, Col, Form, Row, Spinner, Table} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import SubscriptionModal from '../components/SubscriptionModal';
import CustomerUsersPanel from '../components/CustomerUsersPanel';
import copy from '../locales/en.json';
import {useCustomerOrganizations} from '../hooks/useCustomerOrganizations';
import {
  STATUS_VARIANTS,
  humanizeIdentifier,
  licenseLabel,
  statusLabel,
} from '../utils/customerAdminConstants';

/**
 * Renders one status value using the established dashboard badge styling.
 *
 * @param {{value: string}} props - Component properties
 * @return {JSX.Element} Status badge
 */
const StatusBadge = ({value}) => (
  <Badge bg={STATUS_VARIANTS[value] || 'secondary'}>{statusLabel(value)}</Badge>
);

/**
 * Displays a compact platform metric.
 *
 * @param {{label: string, value: number, icon: string}} props - Component properties
 * @return {JSX.Element} Metric card
 */
const SummaryCard = ({label, value, icon}) => (
  <Card className="card-one h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className="avatar bg-primary-subtle text-primary">
        <i className={icon}></i>
      </div>
      <div>
        <div className="fs-sm text-secondary">{label}</div>
        <div className="fs-4 fw-semibold">{value}</div>
      </div>
    </Card.Body>
  </Card>
);

/**
 * Renders the selected organization's governed customer record.
 *
 * @param {{record: Object|null, loading: boolean, error: Error|null}} props - Component properties
 * @return {JSX.Element} Customer detail panel
 */
const CustomerRecord = ({record, loading, error, onManageSubscription}) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 text-secondary py-4" aria-live="polite">
        <Spinner animation="border" size="sm" />
        <span>{copy.detail.loading}</span>
      </div>
    );
  }
  if (error) return <div className="alert alert-danger mb-0" role="alert">{copy.detail.error}</div>;
  if (!record) return <p className="text-secondary mb-0">{copy.detail.select}</p>;

  const subscription = record.subscription;
  const org = record.org || {};
  const members = Array.isArray(record.members) ? record.members : [];
  const invitations = Array.isArray(record.pendingInvitations) ? record.pendingInvitations : [];
  const seatUsage = record.seatUsage || {};
  const features = record.entitlement && record.entitlement.features ? record.entitlement.features : {};
  const enabledFeatures = Object.keys(features).filter((key) => features[key] === true);

  return (
    <div>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-4">
        <div>
          <h5 className="mb-1">{org.name}</h5>
          <div className="text-secondary fs-sm">{org.slug}</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <StatusBadge value={org.status} />
          <Button size="sm" variant="outline-primary" onClick={onManageSubscription}>
            {copy.detail.subscriptionAction}
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col xs="6" xl="4">
          <div className="text-secondary fs-xs text-uppercase">{copy.detail.license}</div>
          <div className="fw-medium">{subscription ? licenseLabel(subscription.licenseCode) : copy.detail.noLicense}</div>
        </Col>
        <Col xs="6" xl="4">
          <div className="text-secondary fs-xs text-uppercase">{copy.detail.subscriptionStatus}</div>
          <div className="fw-medium">{subscription ? statusLabel(subscription.status) : copy.detail.noLicense}</div>
        </Col>
        <Col xs="6" xl="4">
          <div className="text-secondary fs-xs text-uppercase">{copy.detail.billingMode}</div>
          <div className="fw-medium">{subscription ? humanizeIdentifier(subscription.billingMode) : copy.detail.noLicense}</div>
        </Col>
        <Col xs="6" xl="4">
          <div className="text-secondary fs-xs text-uppercase">{copy.detail.seats}</div>
          <div className="fw-medium">{seatUsage.used || 0} / {seatUsage.limit ?? subscription?.seatLimit ?? 0}</div>
        </Col>
        <Col xs="6" xl="4">
          <div className="text-secondary fs-xs text-uppercase">{copy.detail.members}</div>
          <div className="fw-medium">{members.length}</div>
        </Col>
        <Col xs="6" xl="4">
          <div className="text-secondary fs-xs text-uppercase">{copy.detail.pendingInvitations}</div>
          <div className="fw-medium">{invitations.length}</div>
        </Col>
      </Row>

      <div className="text-secondary fs-xs text-uppercase mb-2">{copy.detail.enabledCapabilities}</div>
      {enabledFeatures.length > 0 ? (
        <div className="d-flex flex-wrap gap-2">
          {enabledFeatures.map((feature) => (
            <Badge bg="light" text="dark" className="border" key={feature}>
              {humanizeIdentifier(feature)}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-secondary fs-sm mb-0">{copy.detail.noCapabilities}</p>
      )}
    </div>
  );
};

/**
 * Customer organization administration page for platform super administrators.
 *
 * @return {JSX.Element} Customer administration page
 */
export default function CustomerOrganizationsPage() {
  const [skin, setSkin] = useState(localStorage.getItem('skin-mode') ? 'dark' : '');
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const {
    organizations,
    selectedOrgId,
    customerRecord,
    loading,
    detailLoading,
    error,
    detailError,
    operationLoading,
    operationError,
    operationSucceeded,
    loadOrganizations,
    selectOrganization,
    applySearch,
    createCustomer,
    saveSubscription,
    clearOperationState,
    inviteMember,
    revokeInvitation,
    changeMemberRole,
    removeMember,
  } = useCustomerOrganizations();

  const counts = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter((org) => org.status === 'active').length,
    onboarding: organizations.filter((org) => org.status === 'onboarding').length,
    suspended: organizations.filter((org) => org.status === 'suspended').length,
  }), [organizations]);

  /**
   * Submits the current organization search.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {void}
   */
  const handleSearch = (event) => {
    event.preventDefault();
    applySearch(searchInput);
  };

  /**
   * Clears the search and reloads the organization page.
   *
   * @return {void}
   */
  const handleClear = () => {
    setSearchInput('');
    applySearch('');
  };

  /**
   * Opens the organization creation workflow with clean operation state.
   *
   * @return {void}
   */
  const openCreate = () => {
    clearOperationState();
    setShowCreate(true);
  };

  /**
   * Creates an organization and closes the dialog after success.
   *
   * @param {Object} input - Organization input
   * @return {Promise<void>}
   */
  const handleCreate = async (input) => {
    try {
      await createCustomer(input);
      setShowCreate(false);
    } catch (_error) {
      // The hook exposes a safe error state for the dialog.
    }
  };

  /**
   * Opens the selected customer's subscription workflow.
   *
   * @return {void}
   */
  const openSubscription = () => {
    clearOperationState();
    setShowSubscription(true);
  };

  /**
   * Saves a subscription and closes the dialog after success.
   *
   * @param {Object} input - Subscription decision
   * @return {Promise<void>}
   */
  const handleSubscriptionSave = async (input) => {
    if (!selectedOrgId) return;
    try {
      await saveSubscription(selectedOrgId, input);
      setShowSubscription(false);
    } catch (_error) {
      // The hook exposes a safe error state for the dialog.
    }
  };

  return (
    <React.Fragment>
      <Header onSkin={setSkin} />
      <div className="main main-app p-3 p-lg-4" data-skin={skin || undefined}>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div>
          <ol className="breadcrumb fs-sm mb-1">
            <li className="breadcrumb-item"><Link to="/admin/organizations">{copy.navigation.section}</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{copy.navigation.current}</li>
          </ol>
          <h4 className="main-title mb-1">{copy.page.title}</h4>
          <p className="text-secondary mb-0">{copy.page.subtitle}</p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <i className="ri-add-line me-1"></i>{copy.page.createAction}
          </Button>
        </div>

        {operationSucceeded && (
          <div className="alert alert-success" role="status">{copy.page.operationSuccess}</div>
        )}

        <Row className="g-3 mb-4">
          <Col xs="6" xl="3"><SummaryCard label={copy.summary.organizations} value={counts.total} icon="ri-building-4-line" /></Col>
          <Col xs="6" xl="3"><SummaryCard label={copy.summary.active} value={counts.active} icon="ri-checkbox-circle-line" /></Col>
          <Col xs="6" xl="3"><SummaryCard label={copy.summary.onboarding} value={counts.onboarding} icon="ri-user-add-line" /></Col>
          <Col xs="6" xl="3"><SummaryCard label={copy.summary.suspended} value={counts.suspended} icon="ri-pause-circle-line" /></Col>
        </Row>
        <Row className="g-3 align-items-stretch">
          <Col xs="12" xl="7">
            <Card className="card-one h-100">
              <Card.Body>
                <Form className="row g-2 align-items-end mb-4" onSubmit={handleSearch}>
                  <Form.Group className="col" controlId="customer-search">
                    <Form.Label className="fs-sm">{copy.page.searchLabel}</Form.Label>
                    <Form.Control
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder={copy.page.searchPlaceholder}
                    />
                  </Form.Group>
                  <div className="col-auto d-flex gap-2">
                    <Button type="submit" variant="primary">{copy.page.searchAction}</Button>
                    <Button type="button" variant="outline-secondary" onClick={handleClear}>{copy.page.clearAction}</Button>
                  </div>
                </Form>

                {loading && (
                  <div className="d-flex justify-content-center align-items-center gap-2 py-5" aria-live="polite">
                    <Spinner animation="border" size="sm" />
                    <span className="text-secondary">{copy.page.loading}</span>
                  </div>
                )}
                {!loading && error && (
                  <div className="alert alert-danger" role="alert">
                    <p>{copy.page.error}</p>
                    <Button size="sm" variant="primary" onClick={() => loadOrganizations('')}>{copy.page.retry}</Button>
                  </div>
                )}
                {!loading && !error && organizations.length === 0 && (
                  <p className="text-secondary py-4 mb-0">{copy.page.empty}</p>
                )}
                {!loading && !error && organizations.length > 0 && (
                  <div className="table-responsive">
                    <Table hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>{copy.table.organization}</th>
                          <th>{copy.table.status}</th>
                          <th>{copy.table.seats}</th>
                          <th className="text-end">{copy.table.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {organizations.map((org) => (
                          <tr key={org.id} className={selectedOrgId === org.id ? 'table-active' : undefined}>
                            <td>
                              <div className="fw-medium">{org.name}</div>
                              <div className="text-secondary fs-xs">{org.slug}</div>
                            </td>
                            <td><StatusBadge value={org.status} /></td>
                            <td>{org.seatLimit ?? 0}</td>
                            <td className="text-end">
                              <Button size="sm" variant="outline-primary" onClick={() => selectOrganization(org.id)}>
                                {copy.table.review}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col xs="12" xl="5">
            <Card className="card-one h-100">
              <Card.Body>
                <h6 className="mb-4">{copy.detail.title}</h6>
                <CustomerRecord
                  record={customerRecord}
                  loading={detailLoading}
                  error={detailError}
                  onManageSubscription={openSubscription}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {customerRecord && (
          <Card className="card-one mt-3">
            <Card.Body>
              <CustomerUsersPanel
                orgId={selectedOrgId}
                members={Array.isArray(customerRecord.members) ? customerRecord.members : []}
                invitations={Array.isArray(customerRecord.pendingInvitations) ? customerRecord.pendingInvitations : []}
                submitting={operationLoading}
                error={operationError}
                onInvite={inviteMember}
                onRevoke={revokeInvitation}
                onChangeRole={changeMemberRole}
                onRemove={removeMember}
              />
            </Card.Body>
          </Card>
        )}
        <CreateOrganizationModal
          show={showCreate}
          onHide={() => setShowCreate(false)}
          onCreate={handleCreate}
          submitting={operationLoading}
          error={showCreate ? operationError : null}
        />
        <SubscriptionModal
          show={showSubscription}
          onHide={() => setShowSubscription(false)}
          onSave={handleSubscriptionSave}
          subscription={customerRecord && customerRecord.subscription}
          submitting={operationLoading}
          error={showSubscription ? operationError : null}
        />
        <Footer />
      </div>
    </React.Fragment>
  );
}
