import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Login from './Login';
import { signIn } from '../redux/authentication/authActions';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../redux/authentication/authActions', () => ({
  signIn: jest.fn(),
  completeMfaSignIn: jest.fn(),
  clearErrors: jest.fn(() => ({ type: 'CLEAR_ERRORS' })),
}));

jest.mock('../utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('../config/seoConfig', () => ({
  updatePageSEO: jest.fn(),
}));

describe('Login MFA challenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockImplementation((selector) => selector({
      auth: { loading: false, error: null, isLoggedIn: false },
    }));
  });

  it('shows a visible secondary action for returning to sign in', async () => {
    const challenge = { resolver: {}, factor: {} };
    const signInAction = { type: 'SIGN_IN' };
    const dispatch = jest.fn().mockRejectedValueOnce({ mfaChallenge: challenge });
    useDispatch.mockReturnValue(dispatch);
    signIn.mockReturnValue(signInAction);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'owner@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/six-digit authenticator code/i)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: 'Back to sign in' });
    expect(backButton).toBeVisible();
    expect(backButton).toHaveClass('btn-secondary');
  });
});
