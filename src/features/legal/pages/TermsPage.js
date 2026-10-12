import React from 'react';
import LegalDocumentPage from '../components/LegalDocumentPage';

/**
 * Renders the versioned Harper Vance Terms of Service draft.
 *
 * @returns {React.ReactElement} Terms of Service page
 */
export default function TermsPage() {
  return (
    <LegalDocumentPage
      documentKey="terms"
      seoKey="terms"
      analyticsEvent="terms_page_viewed"
    />
  );
}
