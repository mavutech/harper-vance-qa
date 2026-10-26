import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays a safe analytics-page error with an optional recovery action.
 *
 * @param {Object} props - Component props
 * @param {string} props.message - Customer-safe error copy
 * @param {Function} [props.onRetry] - Starts a fresh data request
 * @returns {JSX.Element} Accessible analytics error notice
 */
const AnalyticsErrorNotice = ({ message, onRetry }) => (
  <div className="card card-one mb-4" role="alert">
    <div className="card-body text-secondary fs-sm">
      <i className="ri-information-line me-2" aria-hidden="true"></i>
      <span>{message}</span>
      {onRetry && (
        <div className="mt-3">
          <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  </div>
);

AnalyticsErrorNotice.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};

export default AnalyticsErrorNotice;
