import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import TermsPage from './TermsPage';
import PrivacyPage from './PrivacyPage';
import {LEGAL_CONFIG} from '../legalConfig';

jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../../../config/seoConfig', () => ({updatePageSEO: jest.fn()}));

/**
 * Renders a public legal page with routing support.
 *
 * @param {React.ReactElement} page - Legal page to render
 * @returns {import('@testing-library/react').RenderResult} Render helpers
 */
function renderLegalPage(page) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

describe('public legal pages', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  test('renders the approved versioned Terms and market-intelligence boundary', () => {
    renderLegalPage(<TermsPage />);

    expect(screen.getByRole('heading', {level: 1, name: 'Terms of Service'})).toBeInTheDocument();
    expect(screen.getByText(LEGAL_CONFIG.termsVersion)).toBeInTheDocument();
    expect(screen.getByText(/does not provide investment advice/i)).toBeInTheDocument();
    expect(screen.getByText(/approved for production customer acceptance/i)).toBeInTheDocument();
    expect(screen.getByText(LEGAL_CONFIG.effectiveDate)).toBeInTheDocument();
    expect(screen.getAllByRole('link', {name: 'legal@harpervanceqa.com'})[0]).toHaveAttribute(
      'href',
      'mailto:legal@harpervanceqa.com',
    );
    expect(window.scrollTo).toHaveBeenCalledWith({top: 0, left: 0, behavior: 'auto'});
  });

  test('renders the approved versioned Privacy Policy and actual service providers', () => {
    renderLegalPage(<PrivacyPage />);

    expect(screen.getByRole('heading', {level: 1, name: 'Privacy Policy'})).toBeInTheDocument();
    expect(screen.getByText(LEGAL_CONFIG.privacyVersion)).toBeInTheDocument();
    expect(screen.getByText(/Google Cloud and Firebase/i)).toBeInTheDocument();
    expect(screen.getByText(/Stripe processes payment/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', {name: 'privacy@harpervanceqa.com'})[0]).toHaveAttribute(
      'href',
      'mailto:privacy@harpervanceqa.com',
    );
  });
});
