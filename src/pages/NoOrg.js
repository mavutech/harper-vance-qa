import React from 'react';
import {Link} from 'react-router-dom';
import {Button, Card, Container} from 'react-bootstrap';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';

/**
 * Placeholder page shown when a route with `requireOrgMembership` is
 * accessed by a user who has no org context yet (no claims, no
 * selection, or org just revoked).
 */
export default function NoOrg() {
  return (
    <React.Fragment>
      <HeaderMobile />
      <Header />
      <div className="main main-app p-4 p-lg-5">
        <Container>
          <Card className="mx-auto" style={{maxWidth: 640}}>
            <Card.Body className="text-center p-4 p-lg-5">
              <div className="mb-3" style={{fontSize: 48, color: '#6c757d'}}>
                <i className="ri-building-2-line"></i>
              </div>
              <h3 className="mb-2">No organization</h3>
              <p className="text-secondary mb-4">
                You are signed in but not yet a member of any organization.
                Ask an org admin to invite you, or contact support if you
                think this is a mistake.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Link to="/pages/profile">
                  <Button variant="outline-secondary">Edit profile</Button>
                </Link>
                <Link to="/">
                  <Button variant="primary">Back to home</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
      <Footer />
    </React.Fragment>
  );
}
