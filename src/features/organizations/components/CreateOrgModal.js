import React, {useEffect, useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {createOrgThunk} from '../redux/orgActions';

/**
 * Slugifies a name into a URL-safe org slug.
 *
 * @param {string} name
 * @returns {string}
 */
const slugify = (name) =>
  String(name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

/**
 * Modal for creating a new organization. Caller becomes the owner.
 *
 * @param {{show: boolean, onHide: () => void, onCreated?: (orgId: string) => void}} props
 */
export default function CreateOrgModal({show, onHide, onCreated}) {
  const dispatch = useDispatch();
  const {loading, error} = useSelector((s) => s.organization);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [emailDomainsRaw, setEmailDomainsRaw] = useState('');
  const [plan] = useState('pilot');
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate the slug from the name until the user edits it.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Reset form whenever the modal is closed.
  useEffect(() => {
    if (!show) {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setEmailDomainsRaw('');
      setSubmitError(null);
      setSubmitting(false);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const emailDomains = emailDomainsRaw
          .split(',')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean);
      const {orgId} = await dispatch(createOrgThunk({
        name: name.trim(),
        slug: slug.trim(),
        emailDomains,
        plan,
      }));
      if (onCreated) onCreated(orgId);
      onHide();
    } catch (err) {
      setSubmitError(
          (err && err.message) ||
          'Failed to create organization. Check that the backend is reachable.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loading;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create organization</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {(submitError || error) && (
            <Alert variant="danger" className="mb-3">
              {submitError || error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Organization name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              autoFocus
              placeholder="Acme Prop"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Slug</Form.Label>
            <Form.Control
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              minLength={2}
              maxLength={64}
              pattern="[a-z0-9]([-]?[a-z0-9])*"
              placeholder="acme-prop"
            />
            <Form.Text className="text-secondary">
              Lowercase letters, digits, non-consecutive hyphens. Auto-generated from the name.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-1">
            <Form.Label>Allowed email domains <span className="text-secondary fs-xs">(optional)</span></Form.Label>
            <Form.Control
              type="text"
              value={emailDomainsRaw}
              onChange={(e) => setEmailDomainsRaw(e.target.value)}
              placeholder="acme.example, acme.co"
            />
            <Form.Text className="text-secondary">
              Comma-separated. Used later for SSO domain matching.
            </Form.Text>
          </Form.Group>

          <p className="fs-xs text-secondary mt-3 mb-0">
            You will become the owner. Plan starts as <strong>pilot</strong>.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={busy || !name || !slug}>
            {busy ? 'Creating\u2026' : 'Create organization'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
