import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {useDispatch, useSelector} from 'react-redux';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import {logoutUser} from '../../../redux/authentication/authActions';
import MfaSetupPage from './MfaSetupPage';

jest.mock('react-redux', () => ({useDispatch: jest.fn(), useSelector: jest.fn()}));
jest.mock('../../../redux/authentication/authActions', () => ({logoutUser: jest.fn()}));
jest.mock('../components/MfaEnrollmentCard', () => function MockMfaEnrollmentCard({onEnrollmentComplete}) {
  return <button type="button" onClick={onEnrollmentComplete}>Complete enrollment</button>;
});

const renderPage = (authState) => {
  useSelector.mockImplementation((selector) => selector({auth: authState}));
  render(
    <MemoryRouter initialEntries={['/mfa/setup']}>
      <Routes>
        <Route path="/mfa/setup" element={<MfaSetupPage />} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/dashboard/sona-targets" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('MfaSetupPage', () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(dispatch);
    logoutUser.mockImplementation((config) => ({type: 'LOGOUT', config}));
  });

  it('offers required enrollment to a signed-in user without a factor', () => {
    renderPage({initialized: true, isLoggedIn: true, user: {mfaEnrolled: false, mfaAuthenticated: false}});
    expect(screen.getByText('Finish this one-time setup before continuing to the application.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Complete enrollment'}));
    expect(logoutUser).toHaveBeenCalledWith(expect.objectContaining({onComplete: expect.any(Function)}));
    expect(dispatch).toHaveBeenCalled();
  });

  it('asks an enrolled user to sign in again when this session lacks MFA', () => {
    renderPage({initialized: true, isLoggedIn: true, user: {mfaEnrolled: true, mfaAuthenticated: false}});
    fireEvent.click(screen.getByRole('button', {name: 'Sign in again'}));
    expect(dispatch).toHaveBeenCalled();
  });

  it('sends a fully authenticated user to the dashboard', () => {
    renderPage({initialized: true, isLoggedIn: true, user: {mfaEnrolled: true, mfaAuthenticated: true}});
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
