/**
 * @fileoverview Customer organization creation dialog.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import copy from '../locales/en.json';
import {slugifyOrganizationName} from '../utils/customerAdminConstants';

const EMPTY_FORM = Object.freeze({name: '', slug: '', domains: ''});

/**
 * Creates an onboarding organization without changing subscription access.
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.show - Whether the dialog is visible
 * @param {Function} props.onHide - Dialog close callback
 * @param {Function} props.onCreate - Organization create callback
 * @param {boolean} props.submitting - Whether a request is active
 * @param {Error|null} props.error - Safe request error state
 * @return {JSX.Element} Organization creation modal
 */
export default function CreateOrganizationModal({show, onHide, onCreate, submitting, error}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!show) {
      setForm(EMPTY_FORM);
      setSlugEdited(false);
    }
  }, [show]);

  /**
   * Updates the organization name and its suggested slug.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Name field event
   * @return {void}
   */
  const handleNameChange = (event) => {
    const name = event.target.value;
    setForm((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : slugifyOrganizationName(name),
    }));
  };

  /**
   * Updates the explicitly edited organization slug.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Slug field event
   * @return {void}
   */
  const handleSlugChange = (event) => {
    setSlugEdited(true);
    setForm((current) => ({...current, slug: slugifyOrganizationName(event.target.value)}));
  };

  /**
   * Updates the comma-separated approved domain input.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Domain field event
   * @return {void}
   */
  const handleDomainsChange = (event) => {
    setForm((current) => ({...current, domains: event.target.value}));
  };

  /**
   * Submits a normalized onboarding organization payload.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    const emailDomains = form.domains
        .split(',')
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean);
    onCreate({
      name: form.name.trim(),
      slug: form.slug,
      emailDomains,
      plan: 'pilot',
    });
  };

  return (
    <Modal show={show} onHide={submitting ? undefined : onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>{copy.create.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-secondary fs-sm">{copy.create.guidance}</p>
          {error && <Alert variant="danger">{copy.create.error}</Alert>}
          <Form.Group className="mb-3" controlId="organization-name">
            <Form.Label>{copy.create.name}</Form.Label>
            <Form.Control value={form.name} onChange={handleNameChange} minLength={2} maxLength={120} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="organization-slug">
            <Form.Label>{copy.create.slug}</Form.Label>
            <Form.Control value={form.slug} onChange={handleSlugChange} minLength={2} maxLength={64} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
          </Form.Group>
          <Form.Group controlId="organization-domains">
            <Form.Label>{copy.create.domains}</Form.Label>
            <Form.Control value={form.domains} onChange={handleDomainsChange} placeholder="example.com, subsidiary.com" />
            <Form.Text>{copy.create.domainsHint}</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={onHide} disabled={submitting}>{copy.create.cancel}</Button>
          <Button type="submit" variant="primary" disabled={submitting || form.name.trim().length < 2 || form.slug.length < 2}>
            {submitting ? copy.create.submitting : copy.create.submit}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
