import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Badge, Button, Card, Container, Form, InputGroup, Spinner, Table} from 'react-bootstrap';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import * as userApi from '../features/users/services/userApi';

/**
 * Platform-admin user list. Guarded by requireRole: ['super_admin'] at the
 * router layer. Also degrades gracefully if reached without that claim.
 */
export default function PlatformUsers() {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async (cursor = null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const params = {limit: 25};
      if (cursor) params.cursor = cursor;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.disabled = statusFilter === 'disabled';
      const {items: page, nextCursor: cur} = await userApi.listAllUsers(params);
      setItems((prev) => (append ? [...prev, ...page] : page));
      setNextCursor(cur || null);
    } catch (err) {
      setError((err && err.message) || 'Failed to load users.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    load(null, false);
  }, [load]);

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch (_e) {
      return '—';
    }
  };

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((u) =>
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.uid || '').toLowerCase().includes(term)
    );
  }, [items, search]);

  const roleBadge = (role) => {
    const bg = role === 'super_admin' ? 'primary' : role === 'admin' ? 'info' : 'secondary';
    return <Badge bg={bg} className="text-uppercase">{role || 'user'}</Badge>;
  };

  return (
    <React.Fragment>
      <HeaderMobile />
      <Header />
      <div className="main main-app p-4 p-lg-5">
        <Container fluid>
          <div className="d-md-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="main-title mb-1">All users</h2>
              <p className="text-secondary mb-0">Platform administration</p>
            </div>
            <div className="d-flex gap-2 mt-3 mt-md-0">
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear filters
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
                {visibleItems.length} user{visibleItems.length === 1 ? '' : 's'}
                {(roleFilter || statusFilter) && (
                  <small className="text-secondary ms-2">filtered</small>
                )}
              </Card.Title>
              <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
                <Form.Select
                  style={{minWidth: 140}}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="Filter by role"
                >
                  <option value="">All roles</option>
                  <option value="super_admin">Super admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </Form.Select>
                <Form.Select
                  style={{minWidth: 140}}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </Form.Select>
                <InputGroup style={{minWidth: 240}}>
                  <InputGroup.Text>
                    <i className="ri-search-line"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Filter loaded users"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <Button variant="outline-secondary" onClick={() => setSearch('')}>
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </div>
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
                        <th>User</th>
                        <th>Role</th>
                        <th>Verified</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.map((u) => (
                        <tr key={u.uid}>
                          <td>
                            <div className="fw-medium">{u.displayName || '—'}</div>
                            <div className="text-secondary small">{u.email || u.uid}</div>
                          </td>
                          <td>{roleBadge(u.role)}</td>
                          <td>
                            <Badge bg={u.emailVerified ? 'success' : 'warning'}>
                              {u.emailVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={u.disabled ? 'danger' : 'success'}>
                              {u.disabled ? 'Disabled' : 'Active'}
                            </Badge>
                          </td>
                          <td>{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                      {visibleItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-secondary py-4">
                            {search || roleFilter || statusFilter
                              ? 'No users match the current filters.'
                              : 'No users found.'}
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
    </React.Fragment>
  );
}
