/** @fileoverview Render error boundary for integration management pages. */
import React from 'react';
import {Alert} from 'react-bootstrap';
import copy from '../locales/integrations.en';

/** Contains unexpected integration rendering errors without exposing internals. */
export default class IntegrationBoundary extends React.Component {
  state = {failed: false};
  /** @returns {Object} Fallback state after a child render failure. */
  static getDerivedStateFromError() { return {failed: true}; }
  /** @returns {JSX.Element} Safe fallback or scoped page content. */
  render() {
    return this.state.failed ? <Alert variant="danger" className="m-4">{copy.error}</Alert> : this.props.children;
  }
}
