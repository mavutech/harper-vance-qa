import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button, Card, Container} from 'react-bootstrap';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import CreateOrgModal from '../features/organizations/components/CreateOrgModal';

/**
 * Landing shown when a route with `requireOrgMembership` is accessed by
 * a user who has no org context yet. Offers a direct "Create organization"
 * path so the user can bootstrap themselves without leaving the app.
 */
export default function NoOrg() {
  const [showCreate, setShowCreate] = useState(false);

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
                Create one to get started, or wait for an admin to invite you.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                  <i className="ri-add-line me-1"></i> Create organization
                </Button>
                <Link to="/pages/profile">
                  <Button variant="outline-secondary">Edit profile</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
      <Footer />

      <CreateOrgModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
      />
    </React.Fragment>
  );
}
