/** @fileoverview Customer organization integration management page. */
import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Card, Col, Form, Row, Spinner} from 'react-bootstrap';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import {useAccess} from '../../access';
import {useOrganizationTeam} from '../hooks/useOrganizationTeam';
import {useIntegrations} from '../hooks/useIntegrations';
import IntegrationForm from '../components/IntegrationForm';
import IntegrationList from '../components/IntegrationList';
import IntegrationApiClients from '../components/IntegrationApiClients';
import DailyEmailPreferences from '../components/DailyEmailPreferences';
import EmailRecipientManagement from '../components/EmailRecipientManagement';
import copy from '../locales/integrations.en';

/**
 * Exposes only the current user's manageable organizations.
 * @returns {JSX.Element} Customer integrations.
 */
export default function OrganizationIntegrationsPage() {
  const {access} = useAccess();
  const organizations = useMemo(() => access?.organizations || [], [access]);
  const [orgId, setOrgId] = useState('');
  const [skin, setSkin] = useState('');
  useEffect(() => {
    if (!organizations.some((org) => org.orgId === orgId)) setOrgId(organizations[0]?.orgId || '');
  }, [organizations, orgId]);
  const selected = organizations.find((org) => org.orgId === orgId);
  const canManage = ['owner', 'admin'].includes(selected?.orgRole);
  const team = useOrganizationTeam(canManage ? orgId : null);
  const state = useIntegrations({orgId}, !!orgId && canManage);
  return <>
    <Header onSkin={setSkin} />
    <main className="main main-app p-3 p-lg-4" data-skin={skin || undefined}>
      <h1 className="main-title">{copy.title}</h1><p>{copy.intro}</p>
      {!organizations.length ? <Alert variant="secondary">{copy.noOrganization}</Alert> : <>
        <Form.Group controlId="integration-organization" className="mb-3">
          <Form.Label>{copy.organization}</Form.Label>
          <Form.Select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            {organizations.map((org) => <option value={org.orgId} key={org.orgId}>{org.name}</option>)}
          </Form.Select>
        </Form.Group>
        {orgId && selected?.features?.['delivery.email'] && <DailyEmailPreferences key={`email-${orgId}`} orgId={orgId} />}
        {orgId && canManage && <EmailRecipientManagement key={`recipients-${orgId}`} orgId={orgId} members={team.record?.members || []} />}
        {state.error && <Alert variant="danger">{state.error}</Alert>}
        {state.notice && <Alert variant="info" role="status">{state.notice}</Alert>}
        {canManage && <Row className="g-4">
          <Col lg={4}><Card><Card.Body>
            {team.loading ? <Spinner animation="border" aria-label={copy.loading} /> : team.error ? <Alert variant="danger">{copy.error}</Alert> :
              selected?.features?.['delivery.webhooks'] ?
              state.allowance && <IntegrationForm key={orgId} allowance={state.allowance} members={team.record?.members || []} busy={state.busy}
                onCreate={(input) => state.create(orgId, input)} /> : <p>{copy.notLicensed}</p>}
            {selected?.features?.['api.rest'] && <IntegrationApiClients key={`api-${orgId}`} orgId={orgId} features={selected.features} />}
          </Card.Body></Card></Col>
          <Col lg={8}>
            {state.loading && <Spinner animation="border" aria-label={copy.loading} />}
            <IntegrationList key={orgId} state={{...state, items: state.items.filter((item) => item.type !== 'email')}}
              members={team.record?.members || []} organizations={organizations} />
            <div className="d-flex gap-2 mt-3">
              <Button variant="outline-secondary" onClick={state.reload} disabled={state.loading}>{copy.refresh}</Button>
              <Button variant="outline-secondary" onClick={state.first} disabled={state.loading}>{copy.first}</Button>
              {state.nextCursor && <Button onClick={state.next} disabled={state.loading}>{copy.next}</Button>}
            </div>
          </Col>
        </Row>}
      </>}
      <Footer />
    </main>
  </>;
}
