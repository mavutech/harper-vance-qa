/**
 * @fileoverview Two-step verification enrollment controls for Profile.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Button, Col, Form, Row, Spinner} from 'react-bootstrap';

import {trackEvent} from '../../../utils/analytics';
import {
  beginTotpEnrollment,
  completeTotpEnrollment,
  getMfaStatus,
} from '../services/mfaService';

const EMPTY_ENROLLMENT = Object.freeze({secret: null, secretKey: '', authenticatorUri: ''});

/**
 * Renders the TOTP enrollment workflow without persisting the shared secret.
 *
 * @returns {React.ReactElement}
 */
export default function MfaEnrollmentCard() {
  const [enabled, setEnabled] = useState(false);
  const [enrollment, setEnrollment] = useState(EMPTY_ENROLLMENT);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({tone: '', text: ''});

  useEffect(() => {
    try {
      setEnabled(getMfaStatus().enabled);
    } catch (_error) {
      setMessage({tone: 'danger', text: 'Sign in again to manage two-step verification.'});
    }
  }, []);

  /**
   * Requests a temporary TOTP secret from Firebase.
   *
   * @returns {Promise<void>}
   */
  const onBeginEnrollment = async () => {
    setBusy(true);
    setMessage({tone: '', text: ''});
    try {
      const nextEnrollment = await beginTotpEnrollment();
      setEnrollment(nextEnrollment);
      trackEvent('profile_mfa_enrollment_started');
    } catch (error) {
      setMessage({tone: 'danger', text: error.message});
      trackEvent('profile_mfa_enrollment_failed', {stage: 'start'});
    } finally {
      setBusy(false);
    }
  };

  /**
   * Verifies the authenticator code and completes enrollment.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission event.
   * @returns {Promise<void>}
   */
  const onCompleteEnrollment = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage({tone: '', text: ''});
    try {
      await completeTotpEnrollment(enrollment.secret, code);
      setEnabled(true);
      setEnrollment(EMPTY_ENROLLMENT);
      setCode('');
      setMessage({
        tone: 'success',
        text: 'Two-step verification is enabled. Your account is ready for elevated owner access.',
      });
      trackEvent('profile_mfa_enrollment_completed');
    } catch (error) {
      setMessage({tone: 'danger', text: error.message});
      trackEvent('profile_mfa_enrollment_failed', {stage: 'verify'});
    } finally {
      setBusy(false);
    }
  };

  /**
   * Clears the temporary TOTP secret and resets the form.
   *
   * @returns {void}
   */
  const onCancelEnrollment = () => {
    setEnrollment(EMPTY_ENROLLMENT);
    setCode('');
    setMessage({tone: '', text: ''});
  };

  /**
   * Keeps only numeric characters from the verification-code input.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   * @returns {void}
   */
  const onCodeChange = (event) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
  };

  return (
    <div className="setting-item">
      <Row className="g-2 align-items-start">
        <Col md="5">
          <h6>Two-step verification</h6>
          <p>
            Protect sensitive owner and administrator actions with a code from an authenticator app.
          </p>
        </Col>
        <Col md>
          {enabled ? (
            <Alert variant="success" className="mb-0">
              <strong>Enabled</strong>
              <div className="small mt-1">Your authenticator is protecting this account.</div>
            </Alert>
          ) : !enrollment.secret ? (
            <Button variant="primary" onClick={onBeginEnrollment} disabled={busy}>
              {busy ? <Spinner size="sm" animation="border" /> : 'Set up authenticator'}
            </Button>
          ) : (
            <Form onSubmit={onCompleteEnrollment}>
              <p className="mb-2">
                Open your authenticator app with the button below. If it does not open, add the setup key manually.
              </p>
              <div className="d-flex gap-2 flex-wrap mb-3">
                <Button as="a" href={enrollment.authenticatorUri} variant="outline-primary">
                  Open authenticator app
                </Button>
                <Button type="button" variant="outline-secondary" onClick={onCancelEnrollment} disabled={busy}>
                  Cancel
                </Button>
              </div>
              <Form.Group className="mb-3" controlId="mfa-setup-key">
                <Form.Label>Manual setup key</Form.Label>
                <Form.Control
                  type="text"
                  value={enrollment.secretKey}
                  readOnly
                  autoComplete="off"
                  aria-describedby="mfa-key-help"
                />
                <Form.Text id="mfa-key-help">
                  Keep this key private. It is cleared from this page when setup is complete or canceled.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3" controlId="mfa-code">
                <Form.Label>Six-digit code</Form.Label>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={onCodeChange}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" disabled={busy || code.length !== 6}>
                {busy ? <Spinner size="sm" animation="border" /> : 'Verify and enable'}
              </Button>
            </Form>
          )}

          {message.text ? (
            <Alert variant={message.tone} className="mt-3 mb-0" dismissible onClose={() => setMessage({tone: '', text: ''})}>
              {message.text}
            </Alert>
          ) : null}
        </Col>
      </Row>
    </div>
  );
}
