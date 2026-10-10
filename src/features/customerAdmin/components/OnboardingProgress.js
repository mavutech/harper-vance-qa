/**
 * @fileoverview Role-appropriate customer onboarding progress.
 */

import React from 'react';
import {Alert, Badge} from 'react-bootstrap';
import copy from '../locales/en.json';

/**
 * Resolves localized onboarding text from a stable backend code.
 *
 * @param {string} code - Stable step or action code
 * @param {Object} translations - Localized code map
 * @return {string} User-facing text
 */
const textFor = (code, translations) => translations[code] || code;

/**
 * Displays onboarding completion, steps, and the next role-safe action.
 *
 * @param {Object} props - Component properties
 * @param {Object|null} props.onboarding - Derived onboarding status
 * @return {JSX.Element} Onboarding progress
 */
export default function OnboardingProgress({onboarding}) {
  if (!onboarding) {
    return <Alert variant="secondary" className="mb-0">{copy.onboarding.progressUnavailable}</Alert>;
  }

  const ready = onboarding.status === 'ready';
  const progress = onboarding.progress || {completed: 0, total: 5, percent: 0};
  const steps = Array.isArray(onboarding.steps) ? onboarding.steps : [];

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h6 className="mb-1">{copy.onboarding.title}</h6>
          <p className="text-secondary fs-sm mb-0">{copy.onboarding.subtitle}</p>
        </div>
        <Badge bg={ready ? 'success' : 'warning'} text={ready ? undefined : 'dark'}>
          {ready ? copy.onboarding.ready : copy.onboarding.inProgress}
        </Badge>
      </div>

      <div
        className="progress mb-2"
        role="progressbar"
        aria-label={copy.onboarding.progressLabel}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress.percent}
      >
        <div className="progress-bar" style={{width: `${progress.percent}%`}}></div>
      </div>
      <p className="text-secondary fs-sm mb-3">
        {copy.onboarding.progressSummary
            .replace('{completed}', String(progress.completed))
            .replace('{total}', String(progress.total))}
      </p>

      <div className="d-flex flex-column gap-2 mb-3">
        {steps.map((step) => (
          <div className="d-flex align-items-center justify-content-between gap-2" key={step.code}>
            <div className="d-flex align-items-center gap-2">
              <i
                className={step.complete ?
                  'ri-checkbox-circle-fill text-success' : 'ri-time-line text-secondary'}
                aria-hidden="true"
              ></i>
              <span className={step.complete ? '' : 'text-secondary'}>
                {textFor(step.code, copy.onboarding.steps)}
              </span>
            </div>
            {step.invited && <Badge bg="light" text="dark">{copy.onboarding.invited}</Badge>}
          </div>
        ))}
      </div>

      {!ready && (
        <Alert variant="light" className="border mb-0">
          <strong>{copy.onboarding.nextAction}</strong>{' '}
          {textFor(onboarding.nextAction, copy.onboarding.actions)}
        </Alert>
      )}
    </div>
  );
}
