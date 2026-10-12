import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import AccessUnavailable from './AccessUnavailable';
import {useAccess} from '../features/access';

jest.mock('../layouts/Header', () => () => <header data-testid="header" />);
jest.mock('../layouts/Footer', () => () => <footer data-testid="footer" />);
jest.mock('../features/access', () => ({
  useAccess: jest.fn(),
}));

/**
 * Renders the access status page with routing support.
 *
 * @returns {import('@testing-library/react').RenderResult} Render helpers.
 */
function renderAccessUnavailable() {
  return render(
    <MemoryRouter>
      <AccessUnavailable />
    </MemoryRouter>,
  );
}

describe('AccessUnavailable', () => {
  beforeEach(() => {
    useAccess.mockReturnValue({error: null, refreshAccess: jest.fn()});
  });

  test('provides the approved support destination and availability', () => {
    renderAccessUnavailable();

    expect(screen.getByRole('link', {name: 'Contact support'})).toHaveAttribute(
      'href',
      'mailto:tkmavu@gmail.com',
    );
    expect(screen.getByText(/Monday through Friday, 9:00 AM to 5:00 PM Eastern/i))
      .toBeInTheDocument();
    expect(screen.getByText(/critical access and data incidents are monitored at all times/i))
      .toBeInTheDocument();
  });
});
