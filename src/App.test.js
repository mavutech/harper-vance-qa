import React from 'react';
import {render, screen} from '@testing-library/react';
import App from './App';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector({auth: {isLoggedIn: false}}),
}));
jest.mock('./routes/ProtectedRoutes', () => []);
jest.mock('./routes/PublicRoutes', () => []);
jest.mock('./redux/authentication/authActions', () => ({
  checkAuthStatus: () => ({type: 'CHECK_AUTH_STATUS'}),
}));
jest.mock('./features/landingPage/pages/LandingPage', () => () => (
  <div>Harper Vance public landing page</div>
));

describe('App', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    window.history.pushState({}, '', '/');
  });

  it('renders the public landing page and initializes authentication', async () => {
    render(<App />);

    expect(await screen.findByText('Harper Vance public landing page')).toBeInTheDocument();
    expect(mockDispatch).toHaveBeenCalledWith({type: 'CHECK_AUTH_STATUS'});
  });
});
