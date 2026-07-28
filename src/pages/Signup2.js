import React from "react";
import { Button, Card, Col, Form, Row, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Field, reduxForm } from "redux-form";
import { signUp, clearErrors } from "../redux/authentication/authActions";

import bg1 from "../assets/img/bg1.jpg";

// Form validation
const validate = (values) => {
  const errors = {};
  
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }
  
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  if (!values.firstName) {
    errors.firstName = 'First name is required';
  }
  
  if (!values.lastName) {
    errors.lastName = 'Last name is required';
  }
  
  if (!values.companyName) {
    errors.companyName = 'Company name is required';
  }
  
  return errors;
};

// Custom field component
const renderField = ({ input, label, type, placeholder, meta: { touched, error } }) => (
  <div className="mb-3">
    <Form.Label>{label}</Form.Label>
    <Form.Control
      {...input}
      type={type}
      placeholder={placeholder}
      isInvalid={touched && error}
    />
    {touched && error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
  </div>
);

function Signup2({ handleSubmit, submitting, pristine }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);

  React.useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(clearErrors());
  }, [dispatch]);

  const onSubmit = async (values) => {
    try {
      await dispatch(signUp({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName
      }));
      
      // Navigate to dashboard on successful signup
      navigate('/dashboard/finance');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  return (
    <div className="page-sign d-block py-0">
      <Row className="g-0">
        <Col md="7" lg="5" xl="4" className="col-wrapper">
          <Card className="card-sign">
            <Card.Header>
              <Link to="/" className="header-logo mb-5">
                Harper Vance
                <small>Quantative Analysis</small>
              </Link>
              <Card.Title>Sign Up</Card.Title>
              <Card.Text>It's free to signup and only takes a minute.</Card.Text>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Field
                  name="firstName"
                  type="text"
                  component={renderField}
                  label="First Name"
                  placeholder="Enter your first name"
                />
                
                <Field
                  name="lastName"
                  type="text"
                  component={renderField}
                  label="Last Name"
                  placeholder="Enter your last name"
                />
                
                <Field
                  name="companyName"
                  type="text"
                  component={renderField}
                  label="Company Name"
                  placeholder="Enter your company name"
                />
                
                <Field
                  name="email"
                  type="email"
                  component={renderField}
                  label="Email Address"
                  placeholder="Enter your email address"
                />
                
                <Field
                  name="password"
                  type="password"
                  component={renderField}
                  label="Password"
                  placeholder="Enter your password"
                />
                
                <div className="mb-4">
                  <small>
                    By clicking <strong>Create Account</strong> below, you agree to our terms of service and privacy statement.
                  </small>
                </div>
                
                <Button 
                  variant="primary" 
                  className="btn-sign" 
                  type="submit"
                  disabled={loading || submitting || pristine}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form>

              <div className="divider"><span>or sign up using</span></div>

              <Row className="gx-2">
                <Col>
                  <Button variant="" className="btn-facebook" disabled>
                    <i className="ri-facebook-fill"></i> Facebook
                  </Button>
                </Col>
                <Col>
                  <Button variant="" className="btn-google" disabled>
                    <i className="ri-google-fill"></i> Google
                  </Button>
                </Col>
              </Row>
            </Card.Body>
            <Card.Footer>
              Already have an account? <Link to="/login">Sign In</Link>
            </Card.Footer>
          </Card>
        </Col>
        <Col className="d-none d-lg-block">
          <img src={bg1} className="auth-img" alt="" />
        </Col>
      </Row>
    </div>
  );
}

// Wrap with reduxForm
export default reduxForm({
  form: 'signup', // a unique identifier for this form
  validate
})(Signup2);
