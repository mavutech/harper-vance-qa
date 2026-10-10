/**
 * @fileoverview Customer administrator team and seat management page.
 */

import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Card, Col, Form, Row, Spinner} from 'react-bootstrap';
import {useSelector} from 'react-redux';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import {useAccess} from '../../access';
import CustomerUsersPanel from '../components/CustomerUsersPanel';
import {useOrganizationTeam} from '../hooks/useOrganizationTeam';
import copy from '../locales/en.json';

const MANAGER_ROLES = Object.freeze(['owner', 'admin']);
const currentSkin = localStorage.getItem('skin-mode') ? 'dark' : '';

/**
 * Allows a customer owner or administrator to manage only their organization.
 *
 * @return {JSX.Element} Customer team administration page
 */
export default function OrganizationTeamPage() {
  const [skin, setSkin] = useState(currentSkin);
  const {access} = useAccess();
  const viewerUid = useSelector((state) => state.auth?.user?.id || null);
  const manageableOrganizations = useMemo(() => (
    (Array.isArray(access?.organizations) ? access.organizations : [])
        .filter((organization) => MANAGER_ROLES.includes(organization.orgRole))
  ), [access]);
  const [selectedOrgId, setSelectedOrgId] = useState(() => (
    manageableOrganizations.find((organization) => organization.orgId === access?.defaultOrgId)?.orgId
      || manageableOrganizations[0]?.orgId
      || null
  ));

  useEffect(() => {
    if (!manageableOrganizations.some((organization) => organization.orgId === selectedOrgId)) {
      setSelectedOrgId(
          manageableOrganizations.find((organization) => organization.orgId === access?.defaultOrgId)?.orgId
          || manageableOrganizations[0]?.orgId
          || null,
      );
    }
  }, [access?.defaultOrgId, manageableOrganizations, selectedOrgId]);

  const selectedAccess = manageableOrganizations.find(
      (organization) => organization.orgId === selectedOrgId,
  ) || null;
  const {
    record,
    loading,
    error,
    submitting,
    operationError,
    reload,
    inviteMember,
    revokeInvitation,
    changeMemberRole,
    removeMember,
  } = useOrganizationTeam(selectedOrgId);

  const seatUsage = record?.seatUsage || {used: 0, pending: 0, allocated: 0, available: 0, limit: 0};
  const pendingCount = Array.isArray(record?.pendingInvitations) ? record.pendingInvitations.length : 0;
  const reservedSeats = seatUsage.pending ?? pendingCount;
  const allocatedSeats = seatUsage.allocated ?? seatUsage.used + reservedSeats;
  const availableSeats = seatUsage.available ?? (
    seatUsage.limit === null ? null : Math.max(seatUsage.limit - allocatedSeats, 0)
  );

  return (
    <React.Fragment>
      <Header onSkin={setSkin} />
      <div className="main main-app p-3 p-lg-4" data-skin={skin || undefined}>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div>
            <div className="text-uppercase text-secondary fs-xs mb-1">{copy.team.section}</div>
            <h4 className="main-title mb-1">{copy.team.title}</h4>
            <p className="text-secondary mb-0">{copy.team.subtitle}</p>
          </div>
          {manageableOrganizations.length > 1 && (
            <Form.Group controlId="managed-organization">
              <Form.Label className="fs-sm">{copy.team.organization}</Form.Label>
              <Form.Select value={selectedOrgId || ''} onChange={(event) => setSelectedOrgId(event.target.value)}>
                {manageableOrganizations.map((organization) => (
                  <option key={organization.orgId} value={organization.orgId}>{organization.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </div>

        {loading && (
          <div className="d-flex align-items-center gap-2 py-5" aria-live="polite">
            <Spinner animation="border" size="sm" />
            <span className="text-secondary">{copy.team.loading}</span>
          </div>
        )}
        {!loading && error && (
          <Alert variant="danger">
            <p>{copy.team.error}</p>
            <Button size="sm" onClick={reload}>{copy.team.retry}</Button>
          </Alert>
        )}
        {!loading && !error && record && (
          <React.Fragment>
            <Row className="g-3 mb-3">
              <Col xs="12" sm="6" xl="3">
                <Card className="card-one h-100">
                  <Card.Body>
                    <div className="text-secondary fs-sm">{copy.team.activeSeats}</div>
                    <div className="fs-3 fw-semibold">{seatUsage.used}</div>
                    <div className="text-secondary fs-sm">{copy.team.seatsHint}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs="12" sm="6" xl="3">
                <Card className="card-one h-100">
                  <Card.Body>
                    <div className="text-secondary fs-sm">{copy.team.pendingInvitations}</div>
                    <div className="fs-3 fw-semibold">{reservedSeats}</div>
                    <div className="text-secondary fs-sm">{copy.team.pendingHint}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs="12" sm="6" xl="3">
                <Card className="card-one h-100">
                  <Card.Body>
                    <div className="text-secondary fs-sm">{copy.team.seatsAllocated}</div>
                    <div className="fs-3 fw-semibold">
                      {allocatedSeats} of {seatUsage.limit ?? copy.team.unlimited}
                    </div>
                    <div className="text-secondary fs-sm">{copy.team.allocatedHint}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs="12" sm="6" xl="3">
                <Card className="card-one h-100">
                  <Card.Body>
                    <div className="text-secondary fs-sm">{copy.team.seatsAvailable}</div>
                    <div className="fs-3 fw-semibold">{availableSeats ?? copy.team.unlimited}</div>
                    <div className="text-secondary fs-sm">{copy.team.availableHint}</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Card className="card-one">
              <Card.Body>
                <CustomerUsersPanel
                  orgId={selectedOrgId}
                  members={Array.isArray(record.members) ? record.members : []}
                  invitations={Array.isArray(record.pendingInvitations) ? record.pendingInvitations : []}
                  submitting={submitting}
                  error={operationError}
                  onInvite={inviteMember}
                  onRevoke={revokeInvitation}
                  onChangeRole={changeMemberRole}
                  onRemove={removeMember}
                  viewerOrgRole={selectedAccess?.orgRole}
                  viewerUid={viewerUid}
                />
              </Card.Body>
            </Card>
          </React.Fragment>
        )}
        <Footer />
      </div>
    </React.Fragment>
  );
}
