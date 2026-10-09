import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Row, Alert, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { signIn, completeMfaSignIn, clearErrors } from "../redux/authentication/authActions";
import { updatePageSEO } from "../config/seoConfig";
import { trackEvent } from "../utils/analytics";
import bg1 from "../assets/img/bg1-signin.jpg";
import logo2 from "../assets/svg/logo2.svg";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isLoggedIn } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [mfaCode, setMfaCode] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(signIn(formData));
      // Navigation will be handled by useEffect when isLoggedIn changes
    } catch (error) {
      if (error && error.mfaChallenge) {
        setMfaChallenge(error.mfaChallenge);
        setFormData(prev => ({...prev, password: ""}));
        trackEvent('login_mfa_challenge_presented');
      }
    }
  };

  /**
   * Completes a pending authenticator challenge.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission event.
   * @returns {Promise<void>}
   */
  const handleMfaSubmit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(completeMfaSignIn(mfaChallenge, mfaCode));
      setMfaChallenge(null);
      setMfaCode("");
      trackEvent('login_mfa_challenge_completed');
    } catch (_error) {
      trackEvent('login_mfa_challenge_failed');
    }
  };

  /**
   * Returns the form to email-and-password sign-in and clears the challenge.
   *
   * @returns {void}
   */
  const cancelMfaChallenge = () => {
    setMfaChallenge(null);
    setMfaCode("");
    dispatch(clearErrors());
  };

  // Clear errors when component unmounts or when user starts typing
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearErrors());
      }
    };
  }, [dispatch, error]);

  // Redirect to Today's Targets once auth state flips to logged-in.
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard/sona-targets');
    }
  }, [isLoggedIn, navigate]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearErrors());
      }, 5000); // Clear error after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Set page SEO using centralized config
  useEffect(() => {
    updatePageSEO('signin');
  }, []);

  // Force the light skin while the login page is mounted, then restore
  // the user's preference (persisted in localStorage) on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-skin');
    html.removeAttribute('data-skin');
    return () => {
      const persisted = localStorage.getItem('skin-mode');
      if (persisted === 'dark') {
        html.setAttribute('data-skin', 'dark');
      } else if (prev) {
        html.setAttribute('data-skin', prev);
      }
    };
  }, []);

  return (
    <div className="page-sign d-block py-0">
      <Row className="g-0">
        <Col md="7" lg="5" xl="4" className="col-wrapper">
          <Card className="card-sign">
            <Card.Header>
              <Link to="/" className="header-logo mb-5">
                <img src={logo2} alt="Logo" style={{height: '40px'}} />
              </Link>
              <Card.Title>Sign In</Card.Title>
              <Card.Text>
                {mfaChallenge ? 'Enter the code from your authenticator app.' : 'Welcome back. Sign in to continue.'}
              </Card.Text>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {!mfaChallenge ? <Form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Form.Label htmlFor="login-email">Email address</Form.Label>
                  <Form.Control
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <Form.Label htmlFor="login-password" className="d-flex justify-content-between">
                    Password <Link to="/pages/forgot">Forgot password?</Link>
                  </Form.Label>
                  <Form.Control
                    id="login-password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="btn-sign"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Form> : <Form onSubmit={handleMfaSubmit}>
                <div className="mb-4">
                  <Form.Label htmlFor="login-mfa-code">Six-digit authenticator code</Form.Label>
                  <Form.Control
                    id="login-mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <Button type="submit" className="btn-sign" disabled={loading || mfaCode.length !== 6}>
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Verifying...
                      </>
                    ) : 'Verify and sign in'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={cancelMfaChallenge} disabled={loading}>
                    Back to sign in
                  </Button>
                </div>
              </Form>}
            </Card.Body>
            {/*<Card.Footer>*/}
            {/*  Don't have an account? <Link to="/pages/signup2">Create an Account</Link>*/}
            {/*</Card.Footer>*/}
          </Card>
        </Col>
        <Col className="d-none d-lg-block">
          <img src={bg1} className="auth-img" alt="" />
        </Col>
      </Row>
    </div>
  )
}
