import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Col, Form, Row, Alert, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { signIn, clearErrors } from "../redux/authentication/authActions";
import { updatePageSEO } from "../config/seoConfig";
import bg1 from "../assets/img/bg1-signin.jpg";
import logo2 from "../assets/svg/logo2.svg";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isLoggedIn } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

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
      // Error is handled by Redux
      console.error('Sign in failed:', error);
    }
  };

  // Clear errors when component unmounts or when user starts typing
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearErrors());
      }
    };
  }, [dispatch, error]);

  // Redirect to the originally requested page (e.g. /accept-invite?token=…)
  // if one was preserved in location.state, otherwise land on Today's Targets.
  useEffect(() => {
    if (isLoggedIn) {
      const from = location.state && location.state.from;
      if (from && from.pathname) {
        navigate(`${from.pathname}${from.search || ''}${from.hash || ''}`, { replace: true });
      } else {
        navigate('/dashboard/sona-targets', { replace: true });
      }
    }
  }, [isLoggedIn, navigate, location.state]);

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
    updatePageSEO('login');
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
              <Card.Text>Welcome back! Please signin to continue.</Card.Text>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
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
                  <Form.Label className="d-flex justify-content-between">
                    Password <Link to="/pages/forgot">Forgot password?</Link>
                  </Form.Label>
                  <Form.Control
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
              </Form>
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
