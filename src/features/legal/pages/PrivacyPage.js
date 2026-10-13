import React from 'react';
import LegalDocumentPage from '../components/LegalDocumentPage';

/**
 * Renders the versioned Harper Vance Privacy Policy.
 *
 * @returns {React.ReactElement} Privacy Policy page
 */
export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      documentKey="privacy"
      seoKey="privacy"
      analyticsEvent="privacy_page_viewed"
    />
  );
}
