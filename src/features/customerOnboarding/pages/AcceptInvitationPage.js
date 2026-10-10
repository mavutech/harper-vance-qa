/**
 * @fileoverview Customer invitation validation, signup, and acceptance page.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Button, Card, Col, Form, Row, Spinner} from 'react-bootstrap';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import moment from 'moment';
import logo from '../../../assets/svg/logo2.svg';
import {auth} from '../../../firebase/config';
import {signIn} from '../../../redux/authentication/authActions';
import {trackEvent} from '../../../utils/analytics';
import copy from '../locales/en.json';
import {
  acceptInvitation,
  acceptInvitationWithSignup,
  previewInvitation,
} from '../services/invitationService';
import {invitationErrorMessage} from '../utils/invitationErrors';

/**
 * Customer invitation acceptance page for new and existing accounts.
 *
 * @return {JSX.Element} Invitation page
 */
export default function AcceptInvitationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {isLoggedIn, user} = useSelector((state) => state.auth);
  const token = searchParams.get('token') || '';
  const returnPath = `/pages/accept-invite?token=${encodeURIComponent(token)}`;
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(token ? '' : copy.missingToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) return undefined;
    previewInvitation(token)
        .then((result) => {
          if (active) {
            setInvitation(result);
            setError('');
            trackEvent('customer_invitation_viewed', {organization_role: result.orgRole});
          }
        })
        .catch((requestError) => {
          if (active) setError(invitationErrorMessage(requestError));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [token]);

  /**
   * Accepts the invitation for the currently authenticated customer.
   *
   * @return {Promise<void>}
   */
  const handleAccept = async () => {
    setSubmitting(true);
    setError('');
    try {
      await acceptInvitation(token);
      if (auth.currentUser) await auth.currentUser.getIdToken(true);
      trackEvent('customer_invitation_accepted', {account_type: 'existing'});
      navigate('/dashboard/sona-targets', {replace: true});
    } catch (requestError) {
      setError(invitationErrorMessage(requestError));
      trackEvent('customer_invitation_accept_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Creates an invited account, signs it in, and opens the dashboard.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const handleSignup = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await acceptInvitationWithSignup(token, password);
      await dispatch(signIn({email: invitation.invitedEmail, password}));
      trackEvent('customer_invitation_accepted', {account_type: 'new'});
      navigate('/dashboard/sona-targets', {replace: true});
    } catch (requestError) {
      setError(invitationErrorMessage(requestError));
      trackEvent('customer_invitation_accept_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
    } finally {
      setPassword('');
      setConfirmPassword('');
      setSubmitting(false);
    }
  };

  return (
    <div className="page-sign d-flex align-items-center justify-content-center min-vh-100 py-4 px-3">
      <Card className="card-sign w-100" style={{maxWidth: 560}}>
        <Card.Header>
          <Link to="/" className="header-logo mb-4"><img src={logo} alt="Harper Vance" style={{height: 40}} /></Link>
          <Card.Title>{copy.title}</Card.Title>
        </Card.Header>
        <Card.Body>
          {loading && (
            <div className="d-flex align-items-center gap-2 py-4" aria-live="polite">
              <Spinner animation="border" size="sm" />
              <span>{copy.loading}</span>
            </div>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && invitation && (
            <React.Fragment>
              <p className="text-secondary mb-1">{copy.invitedTo}</p>
              <h4 className="mb-3">{invitation.orgName}</h4>
              <Row className="g-3 mb-4">
                <Col xs="12" sm="7">
                  <div className="fs-xs text-uppercase text-secondary">{copy.invitedEmail}</div>
                  <div className="fw-medium">{invitation.invitedEmail}</div>
                </Col>
                <Col xs="6" sm="2">
                  <div className="fs-xs text-uppercase text-secondary">{copy.asRole}</div>
                  <div className="fw-medium text-capitalize">{invitation.orgRole}</div>
                </Col>
                <Col xs="6" sm="3">
                  <div className="fs-xs text-uppercase text-secondary">{copy.expires}</div>
                  <div className="fw-medium">{moment(invitation.expiresAt).format('MMM D, YYYY')}</div>
                </Col>
              </Row>

              {isLoggedIn ? (
                <div>
                  <p className="text-secondary fs-sm">{copy.signedInAs} <strong>{user && user.email}</strong></p>
                  <Button className="w-100" onClick={handleAccept} disabled={submitting}>
                    {submitting ? copy.accepting : copy.accept}
                  </Button>
                </div>
              ) : invitation.ssoRequired ? (
                <div>
                  <Alert variant="info">{copy.ssoRequired}</Alert>
                  <Button as={Link} to="/login" state={{from: returnPath}} className="w-100">{copy.signIn}</Button>
                  <p className="text-secondary fs-sm mt-3 mb-0">{copy.contactAdmin}</p>
                </div>
              ) : (
                <div>
                  <h6>{copy.createTitle}</h6>
                  <Form onSubmit={handleSignup}>
                    <Form.Group className="mb-3" controlId="invite-password">
                      <Form.Label>{copy.password}</Form.Label>
                      <Form.Control type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="invite-confirm-password">
                      <Form.Label>{copy.confirmPassword}</Form.Label>
                      <Form.Control type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" required />
                    </Form.Group>
                    <Button type="submit" className="w-100" disabled={submitting}>
                      {submitting ? copy.creating : copy.create}
                    </Button>
                  </Form>
                  <hr />
                  <p className="text-secondary fs-sm mb-2">{copy.existing}</p>
                  <Button as={Link} to="/login" state={{from: returnPath}} variant="outline-primary" className="w-100">
                    {copy.signIn}
                  </Button>
                </div>
              )}
            </React.Fragment>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
