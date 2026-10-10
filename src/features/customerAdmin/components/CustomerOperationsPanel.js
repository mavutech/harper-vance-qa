/**
 * @fileoverview Customer integration and support administration panel.
 */

import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Col, Form, Row, Spinner, Table} from 'react-bootstrap';
import copy from '../locales/en.json';
import {useCustomerOperations} from '../hooks/useCustomerOperations';
import {humanizeIdentifier} from '../utils/customerAdminConstants';

/**
 * Renders entitled delivery, API-client, and support operations.
 *
 * @param {Object} props - Component properties
 * @param {string} props.orgId - Selected organization ID
 * @param {Object} props.features - Entitlement feature map
 * @param {boolean} props.active - Whether the subscription is active
 * @return {JSX.Element} Customer operations panel
 */
export default function CustomerOperationsPanel({orgId, features, active}) {
  const [destination, setDestination] = useState({type: 'email', label: '', value: ''});
  const [apiLabel, setApiLabel] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const {
    destinations,
    apiClients,
    supportCases,
    loading,
    submitting,
    error,
    apiSecret,
    capabilities,
    addDestination,
    disableDestination,
    addApiClient,
    removeApiClient,
  } = useCustomerOperations(orgId, features, active);

  const deliveryTypes = useMemo(() => [
    ...(features['delivery.email'] ? ['email'] : []),
    ...(features['delivery.teamNotifications'] ? ['slack', 'teams'] : []),
    ...(features['delivery.webhooks'] ? ['webhook'] : []),
  ], [features]);

  useEffect(() => {
    if (deliveryTypes.length > 0 && !deliveryTypes.includes(destination.type)) {
      setDestination({type: deliveryTypes[0], label: '', value: ''});
    }
  }, [deliveryTypes, destination.type]);

  /**
   * Creates a delivery destination from the entitlement-aware form.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const handleDestinationSubmit = async (event) => {
    event.preventDefault();
    const input = {
      type: destination.type,
      label: destination.label.trim(),
      ...(destination.type === 'email' ? {address: destination.value.trim().toLowerCase()} : {
        secretReference: destination.value.trim(),
      }),
    };
    try {
      await addDestination(input);
      setDestination({type: deliveryTypes[0] || 'email', label: '', value: ''});
    } catch (_error) {
      // Hook exposes the safe error state.
    }
  };

  /**
   * Creates an API client and clears its label after success.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const handleApiSubmit = async (event) => {
    event.preventDefault();
    try {
      await addApiClient({label: apiLabel.trim(), expiresAt: null});
      setApiLabel('');
      setSecretCopied(false);
    } catch (_error) {
      // Hook exposes the safe error state.
    }
  };

  /**
   * Copies the one-time API credential.
   *
   * @return {Promise<void>}
   */
  const copyApiSecret = async () => {
    await navigator.clipboard.writeText(apiSecret);
    setSecretCopied(true);
  };

  /**
   * Disables a destination while retaining safe hook error handling.
   *
   * @param {string} destinationId - Destination ID
   * @return {Promise<void>}
   */
  const handleDisableDestination = async (destinationId) => {
    try {
      await disableDestination(destinationId);
    } catch (_error) {
      // Hook exposes the safe error state.
    }
  };

  /**
   * Revokes an API client while retaining safe hook error handling.
   *
   * @param {string} apiClientId - API client ID
   * @return {Promise<void>}
   */
  const handleRevokeApiClient = async (apiClientId) => {
    try {
      await removeApiClient(apiClientId);
    } catch (_error) {
      // Hook exposes the safe error state.
    }
  };

  if (!active) return <Alert variant="secondary" className="mb-0">{copy.operations.inactive}</Alert>;
  if (loading) return <div className="d-flex gap-2 align-items-center"><Spinner animation="border" size="sm" />{copy.operations.loading}</div>;

  return (
    <div>
      <h6 className="mb-3">{copy.operations.title}</h6>
      {error && <Alert variant="danger">{copy.operations.error}</Alert>}
      <Row className="g-4">
        <Col xs="12" xl="6">
          <h6>{copy.operations.deliveryTitle}</h6>
          {!capabilities.delivery ? <p className="text-secondary fs-sm">{copy.operations.deliveryUnavailable}</p> : (
            <React.Fragment>
              <Form className="row g-2 mb-3" onSubmit={handleDestinationSubmit}>
                <Form.Group className="col-sm-3" controlId="destination-type">
                  <Form.Label className="fs-sm">{copy.operations.type}</Form.Label>
                  <Form.Select
                    value={destination.type}
                    onChange={(event) => setDestination((current) => ({...current, type: event.target.value, value: ''}))}
                  >
                    {deliveryTypes.map((type) => <option key={type} value={type}>{humanizeIdentifier(type)}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="col-sm-4" controlId="destination-label">
                  <Form.Label className="fs-sm">{copy.operations.label}</Form.Label>
                  <Form.Control value={destination.label} onChange={(event) => setDestination((current) => ({...current, label: event.target.value}))} required />
                </Form.Group>
                <Form.Group className="col-sm-5" controlId="destination-value">
                  <Form.Label className="fs-sm">
                    {destination.type === 'email' ? copy.operations.address : copy.operations.secretReference}
                  </Form.Label>
                  <Form.Control
                    type={destination.type === 'email' ? 'email' : 'text'}
                    value={destination.value}
                    onChange={(event) => setDestination((current) => ({...current, value: event.target.value}))}
                    required
                  />
                </Form.Group>
                {destination.type !== 'email' && <Form.Text>{copy.operations.secretHint}</Form.Text>}
                <div><Button type="submit" size="sm" disabled={submitting}>{copy.operations.addDestination}</Button></div>
              </Form>
              <div className="table-responsive">
                <Table size="sm" className="align-middle">
                  <tbody>
                    {destinations.length === 0 && <tr><td className="text-secondary">{copy.operations.noDestinations}</td></tr>}
                    {destinations.map((item) => (
                      <tr key={item.id}>
                        <td>{item.label}<div className="text-secondary fs-xs">{humanizeIdentifier(item.type)}</div></td>
                        <td>{humanizeIdentifier(item.status)}</td>
                        <td className="text-end">
                          {item.status === 'active' && <Button size="sm" variant="outline-secondary" onClick={() => handleDisableDestination(item.id)} disabled={submitting}>{copy.operations.disable}</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </React.Fragment>
          )}
        </Col>
        <Col xs="12" xl="6">
          <h6>{copy.operations.apiTitle}</h6>
          {!capabilities.api ? <p className="text-secondary fs-sm">{copy.operations.apiUnavailable}</p> : (
            <React.Fragment>
              {apiSecret && (
                <Alert variant="warning">
                  <p className="mb-2">{copy.operations.apiSecret}</p>
                  <div className="input-group">
                    <Form.Control value={apiSecret} readOnly aria-label="One-time API secret" />
                    <Button variant="outline-dark" onClick={copyApiSecret}>{secretCopied ? 'Copied' : copy.operations.copySecret}</Button>
                  </div>
                </Alert>
              )}
              <Form className="d-flex gap-2 mb-3" onSubmit={handleApiSubmit}>
                <Form.Control aria-label="API client label" value={apiLabel} onChange={(event) => setApiLabel(event.target.value)} placeholder={copy.operations.label} required />
                <Button type="submit" disabled={submitting}>{copy.operations.createApi}</Button>
              </Form>
              <div className="table-responsive">
                <Table size="sm" className="align-middle">
                  <tbody>
                    {apiClients.length === 0 && <tr><td className="text-secondary">{copy.operations.noApiClients}</td></tr>}
                    {apiClients.map((item) => (
                      <tr key={item.id}>
                        <td>{item.label}<div className="text-secondary fs-xs">{item.credentialPrefix}</div></td>
                        <td>{humanizeIdentifier(item.status)}</td>
                        <td className="text-end">
                          {item.status === 'active' && <Button size="sm" variant="outline-danger" onClick={() => handleRevokeApiClient(item.id)} disabled={submitting}>{copy.operations.revokeApi}</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </React.Fragment>
          )}
        </Col>
        <Col xs="12">
          <h6>{copy.operations.supportTitle}</h6>
          {supportCases.length === 0 ? <p className="text-secondary fs-sm mb-0">{copy.operations.noCases}</p> : (
            <div className="table-responsive">
              <Table size="sm" className="align-middle mb-0">
                <tbody>{supportCases.map((item) => (
                  <tr key={item.id}><td>{item.subject}</td><td>{humanizeIdentifier(item.priority)}</td><td>{humanizeIdentifier(item.status)}</td></tr>
                ))}</tbody>
              </Table>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
