import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Row, Alert, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, clearErrors } from "../redux/authentication/authActions";
import { updatePageSEO } from "../config/seoConfig";
import bg1 from "../assets/img/bg1-signin.jpg";
import logo2 from "../assets/svg/logo2.svg";

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, forgotPasswordMessage } = useSelector(state => state.auth);

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    try {
      await dispatch(forgotPassword(email, {
        onSuccess: (message) => {
          console.log('Password reset email sent:', message);
          setIsSubmitted(true);
        },
        onError: (error) => {
          console.error('Password reset error:', error);
        }
      }));
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  };

  const handleBackToSignIn = () => {
    dispatch(clearErrors());
    navigate('/');
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setEmail("");
    dispatch(clearErrors());
  };

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearErrors());
      }
    };
  }, [dispatch, error]);

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
    updatePageSEO('forgotPassword');
  }, []);

  if (isSubmitted) {
    // Success screen with same layout structure
    return (
      <div className="page-sign d-block py-0">
        <Row className="g-0">
          <Col md="7" lg="5" xl="4" className="col-wrapper">
            <Card className="card-sign">
              <Card.Header>
                <Link to="/" className="header-logo mb-5">
                  <img src={logo2} alt="Logo" style={{height: '40px'}} />
                </Link>
                <Card.Title className="text-success">Email Sent!</Card.Title>
                <Card.Text>
                  {forgotPasswordMessage || 'Password reset email sent successfully'}
                </Card.Text>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-column gap-3">
                  <Button
                    onClick={handleBackToSignIn}
                    className="btn-sign"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col className="d-none d-lg-block">
            <img src={bg1} className="auth-img" alt="" />
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="page-sign d-block py-0">
      <Row className="g-0">
        <Col md="7" lg="5" xl="4" className="col-wrapper">
          <Card className="card-sign">
            <Card.Header>
              <Link to="/" className="header-logo mb-5">
                <img src={logo2} alt="Logo" style={{height: '40px'}} />
              </Link>
              <Card.Title>Reset your password</Card.Title>
              <Card.Text>Enter your email address and we will send you a link to reset your password.</Card.Text>
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
                    value={email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="btn-sign"
                  disabled={loading || !email.trim()}
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
                      Sending...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </Form>
            </Card.Body>
            <Card.Footer>
              <Link to="/">← Back to Sign In</Link>
            </Card.Footer>
          </Card>
        </Col>
        <Col className="d-none d-lg-block">
          <img src={bg1} className="auth-img" alt="" />
        </Col>
      </Row>
    </div>
  )
}
