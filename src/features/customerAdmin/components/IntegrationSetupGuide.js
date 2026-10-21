/** @fileoverview In-context automation setup guidance using existing Bootstrap components. */
import React from 'react';
import {Accordion} from 'react-bootstrap';
import copy from '../locales/integrations.en.json';

/** @returns {JSX.Element} Accessible setup guide shared by customer and platform administrators. */
export default function IntegrationSetupGuide() {
  return <Accordion className="mb-3">
    <Accordion.Item eventKey="setup">
      <Accordion.Header>{copy.guide.title}</Accordion.Header>
      <Accordion.Body>
        <ol>{copy.guide.steps.map((step) => <li key={step} className="mb-2">{step}</li>)}</ol>
        <p>{copy.guide.format}</p>
        <p>{copy.guide.authentication}</p>
        <p>{copy.guide.dashboard}</p>
        <p className="mb-0">{copy.acceptanceNote}</p>
      </Accordion.Body>
    </Accordion.Item>
  </Accordion>;
}
