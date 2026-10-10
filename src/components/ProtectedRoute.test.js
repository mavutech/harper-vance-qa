import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {useAccess} from '../features/access';
import ProtectedRoute from './ProtectedRoute';

jest.mock('react-redux', () => ({useSelector: jest.fn()}));
jest.mock('../features/access', () => ({useAccess: jest.fn()}));

/**
 * Renders a protected route using the supplied platform role.
 *
 * @param {string} platformRole - Canonical platform role
 * @return {void}
 */
const renderProtectedRoute = (platformRole) => {
  useSelector.mockImplementation((selector) => selector({
    auth: {isLoggedIn: true, user: {platformRole}},
  }));
  render(
    <MemoryRouter initialEntries={['/admin/organizations']}>
      <Routes>
        <Route
          path="/admin/organizations"
          element={(
            <ProtectedRoute requireRole="super_admin">
              <div>Customer administration</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/pages/error-505" element={<div>Forbidden</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('ProtectedRoute platform roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAccess.mockReturnValue({
      loading: false,
      error: null,
      hasFeature: () => true,
    });
  });

  it('allows the canonical super_admin platform role', () => {
    renderProtectedRoute('super_admin');
    expect(screen.getByText('Customer administration')).toBeInTheDocument();
  });

  it('rejects a standard user from a super-admin route', () => {
    renderProtectedRoute('user');
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('redirects a customer from a product feature that is not licensed', () => {
    useSelector.mockImplementation((selector) => selector({
      auth: {isLoggedIn: true, user: {platformRole: 'user'}},
    }));
    useAccess.mockReturnValue({
      loading: false,
      error: null,
      hasFeature: () => false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/sona-history']}>
        <Routes>
          <Route
            path="/dashboard/sona-history"
            element={(
              <ProtectedRoute requireFeature="dashboard.history">
                <div>History</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/access-unavailable" element={<div>Access unavailable</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Access unavailable')).toBeInTheDocument();
  });
});
