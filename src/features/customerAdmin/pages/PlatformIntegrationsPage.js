/** @fileoverview Platform-wide integration directory with organization/user filters. */
import React, {useState} from 'react';
import {Alert, Button, Card, Col, Form, Row, Spinner} from 'react-bootstrap';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import {useCustomerOrganizations} from '../hooks/useCustomerOrganizations';
import {useIntegrations} from '../hooks/useIntegrations';
import IntegrationList from '../components/IntegrationList';
import IntegrationForm from '../components/IntegrationForm';
import IntegrationApiClients from '../components/IntegrationApiClients';
import EmailRecipientManagement from '../components/EmailRecipientManagement';
import copy from '../locales/integrations.en.json';

/**
 * Exposes platform-only browsing and scoped customer support actions.
 * @returns {JSX.Element} Platform integration management.
 */
export default function PlatformIntegrationsPage() {
  const admin = useCustomerOrganizations();
  const [skin, setSkin] = useState('');
  const [user, setUser] = useState('');
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState({});
  const orgId = admin.selectedOrgId || '';
  const state = useIntegrations({...filters, ...(orgId ? {orgId} : {})}, true);
  const members = admin.customerRecord?.members || [];
  const features = admin.customerRecord?.entitlement?.features || {};
  /** @param {Event} event - Filter submission. @returns {void} */
  const applyFilters = (event) => {
    event.preventDefault();
    setFilters({...user ? {responsibleUserId: user.trim()} : {}, ...status ? {status} : {}});
  };
  return <>
    <Header onSkin={setSkin} />
    <main className="main main-app p-3 p-lg-4" data-skin={skin || undefined}>
      <h1 className="main-title">{copy.platformTitle}</h1><p>{copy.platformIntro}</p>
      {(admin.error || admin.detailError) && <Alert variant="danger">{copy.error}</Alert>}
      <Form.Group controlId="platform-integration-org" className="mb-3">
        <Form.Label>{copy.organization}</Form.Label>
        <Form.Select value={orgId} onChange={(e) => { admin.selectOrganization(e.target.value || null); setUser(''); setFilters({}); }}>
          <option value="">{copy.allOrganizations}</option>
          {admin.organizations.map((org) => <option value={org.id} key={org.id}>{org.name}</option>)}
        </Form.Select>
        {admin.nextCursor && <Button variant="link" disabled={admin.loadingMore} onClick={admin.loadMoreOrganizations}>{copy.next}</Button>}
      </Form.Group>
      <Form onSubmit={applyFilters} className="d-flex flex-wrap align-items-end gap-3 mb-4">
        <Form.Group controlId="platform-integration-user"><Form.Label>{orgId ? copy.responsibleUser : copy.userFilter}</Form.Label>
          {orgId ? <Form.Select value={user} onChange={(e) => setUser(e.target.value)}>
            <option value="">{copy.allUsers}</option>
            {members.map((m) => <option key={m.uid} value={m.uid}>{m.displayName || m.email || m.uid}</option>)}
          </Form.Select> : <Form.Control value={user} maxLength={128} onChange={(e) => setUser(e.target.value)} />}
        </Form.Group>
        <Form.Group controlId="platform-integration-status"><Form.Label>{copy.status}</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{copy.allStatuses}</option>
            {Object.entries(copy.states).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Form.Select>
        </Form.Group>
        <Button type="submit">{copy.filter}</Button>
      </Form>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.notice && <Alert variant="info" role="status">{state.notice}</Alert>}
      {orgId && <EmailRecipientManagement key={`recipients-${orgId}`} orgId={orgId} members={members} platform />}
      <Row className="g-4">
        <Col lg={orgId ? 8 : 12}>
          {state.loading && <Spinner animation="border" aria-label={copy.loading} />}
          <IntegrationList key={orgId} state={state} members={members} organizations={admin.organizations} />
          <div className="d-flex gap-2 mt-3">
            <Button variant="outline-secondary" onClick={state.reload}>{copy.refresh}</Button>
            <Button variant="outline-secondary" onClick={state.first}>{copy.first}</Button>
            {state.nextCursor && <Button onClick={state.next}>{copy.next}</Button>}
          </div>
        </Col>
        {orgId && <Col lg={4}><Card><Card.Body>
          {admin.detailLoading ? <Spinner animation="border" aria-label={copy.loading} /> :
            features['delivery.webhooks'] ? state.allowance && <IntegrationForm key={orgId} allowance={state.allowance} members={members} busy={state.busy}
              onCreate={(input) => state.create(orgId, input)} /> : <p>{copy.notLicensed}</p>}
          {features['api.rest'] && <IntegrationApiClients key={`api-${orgId}`} orgId={orgId} features={features} />}
        </Card.Body></Card></Col>}
      </Row>
      <Footer />
    </main>
  </>;
}
