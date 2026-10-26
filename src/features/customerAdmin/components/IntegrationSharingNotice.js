/** @fileoverview Shared licensed-use warning matching the existing dashboard alert style. */
import React from 'react';
import {Alert} from 'react-bootstrap';
import {ROUTES} from '../../../config/routes';
import copy from '../locales/integrations.en';

/** @returns {JSX.Element} Licensed audience warning and applicable terms. */
export default function IntegrationSharingNotice() {
  return <Alert variant="warning" className="mb-0">
    <Alert.Heading as="h6">{copy.sharingTitle}</Alert.Heading>
    <p>{copy.sharingWarning}</p>
    <a href={ROUTES.terms} target="_blank" rel="noopener noreferrer">{copy.sharingTerms}</a>
  </Alert>;
}
