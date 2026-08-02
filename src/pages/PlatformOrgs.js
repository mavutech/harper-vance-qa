import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Alert, Badge, Button, Card, Container, Form, InputGroup, Spinner, Table} from 'react-bootstrap';
import {useDispatch} from 'react-redux';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import CreateOrgModal from '../features/organizations/components/CreateOrgModal';
import * as organizationApi from '../features/organizations/services/organizationApi';
import {fetchOrgs} from '../features/organizations/redux/orgActions';

/**
 * Platform-admin org list. Guarded by requireRole: ['super_admin'] at the
 * router layer. Also degrades gracefully if reached without that claim.
 */
export default function PlatformOrgs() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Debounce the search input so we don't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (cursor = null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const params = {limit: 25};
      if (cursor) params.cursor = cursor;
      if (debouncedSearch) params.search = debouncedSearch;
      const {items: page, nextCursor: cur} = await organizationApi.listAllOrgs(params);
      setItems((prev) => (append ? [...prev, ...page] : page));
      setNextCursor(cur || null);
    } catch (err) {
      setError((err && err.message) || 'Failed to load organizations.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load(null, false);
  }, [load]);

  const handleCreated = () => {
    load(null, false);
    // Also refresh the switcher's org list in case super_admin was seated
    // (they aren't, currently, but future-proof).
    dispatch(fetchOrgs()).catch(() => {});
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch (_e) {
      return '—';
    }
  };

  const sortedItems = useMemo(() => items, [items]);

  return (
    <React.Fragment>
      <HeaderMobile />
      <Header />
      <div className="main main-app p-4 p-lg-5">
        <Container fluid>
          <div className="d-md-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="main-title mb-1">All organizations</h2>
              <p className="text-secondary mb-0">Platform administration</p>
            </div>
            <div className="d-flex gap-2 mt-3 mt-md-0">
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <i className="ri-add-line me-1"></i> Create organization
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Card>
            <Card.Header className="d-md-flex align-items-center justify-content-between gap-3">
              <Card.Title className="mb-0">
                {items.length} organization{items.length === 1 ? '' : 's'}
                {debouncedSearch && (
                  <small className="text-secondary ms-2">matching &ldquo;{debouncedSearch}&rdquo;</small>
                )}
              </Card.Title>
              <InputGroup style={{maxWidth: 320}} className="mt-2 mt-md-0">
                <InputGroup.Text>
                  <i className="ri-search-line"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name or slug"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')}>
                    Clear
                  </Button>
                )}
              </InputGroup>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <>
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Plan</th>
                        <th>Seat limit</th>
                        <th>Created</th>
                        <th style={{width: 1}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedItems.map((org) => (
                        <tr key={org.id}>
                          <td className="fw-medium">
                            <Link to={`/pages/orgs/${encodeURIComponent(org.id)}`}>
                              {org.name}
                            </Link>
                          </td>
                          <td className="font-monospace text-secondary">{org.slug}</td>
                          <td>
                            <Badge bg={org.plan === 'enterprise' ? 'primary' : org.plan === 'standard' ? 'info' : 'secondary'} className="text-uppercase">
                              {org.plan || 'pilot'}
                            </Badge>
                          </td>
                          <td>{org.seatLimit || 25}</td>
                          <td>{formatDate(org.createdAt)}</td>
                          <td>
                            <Link to={`/pages/orgs/${encodeURIComponent(org.id)}`}>
                              <Button size="sm" variant="outline-primary">Open</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {sortedItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-secondary py-4">
                            {debouncedSearch
                              ? 'No organizations match your search.'
                              : 'No organizations yet. Create the first one to get started.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                  {nextCursor && (
                    <div className="text-center mt-3">
                      <Button
                        variant="outline-secondary"
                        onClick={() => load(nextCursor, true)}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Loading\u2026' : 'Load more'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
      <Footer />

      <CreateOrgModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </React.Fragment>
  );
}
