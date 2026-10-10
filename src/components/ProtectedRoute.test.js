import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {useSelector} from 'react-redux';
import ProtectedRoute from './ProtectedRoute';

jest.mock('react-redux', () => ({useSelector: jest.fn()}));

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
  beforeEach(() => jest.clearAllMocks());

  it('allows the canonical super_admin platform role', () => {
    renderProtectedRoute('super_admin');
    expect(screen.getByText('Customer administration')).toBeInTheDocument();
  });

  it('rejects a standard user from a super-admin route', () => {
    renderProtectedRoute('user');
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });
});
