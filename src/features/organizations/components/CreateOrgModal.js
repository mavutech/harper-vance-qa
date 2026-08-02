import React, {useEffect, useState} from 'react';
import {Alert, Button, Form, InputGroup, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {clearOrgError, createOrgThunk} from '../redux/orgActions';

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
 * Modal for creating a new organization. Super_admin only.
 *
 * The optional "Initial owner email" field auto-invites that person as
 * admin so the customer's designated lead can accept and take over. The
 * invite link is displayed after creation so the super_admin can copy
 * and send it.
 *
 * @param {{show: boolean, onHide: () => void, onCreated?: (orgId: string) => void}} props
 */
export default function CreateOrgModal({show, onHide, onCreated}) {
  const dispatch = useDispatch();
  const {loading} = useSelector((s) => s.organization);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [emailDomainsRaw, setEmailDomainsRaw] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [successOrgId, setSuccessOrgId] = useState(null);
  const [successInvite, setSuccessInvite] = useState(null);
  const [copyLabel, setCopyLabel] = useState('Copy');

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (!show) {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setEmailDomainsRaw('');
      setOwnerEmail('');
      setSubmitError(null);
      setSubmitting(false);
      setSuccessOrgId(null);
      setSuccessInvite(null);
      setCopyLabel('Copy');
    } else {
      // Clear any leftover org slice error from a previous background
      // fetch (e.g. a cold-start fetchOrgs race). The modal owns its
      // own submitError from now on.
      dispatch(clearOrgError());
    }
  }, [show, dispatch]);

  const inviteLink = successInvite
    ? `${window.location.origin}/pages/accept-invite?token=${encodeURIComponent(successInvite.rawToken)}`
    : null;

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyLabel('Copied');
      setTimeout(() => setCopyLabel('Copy'), 1500);
    } catch (_e) {
      setCopyLabel('Copy failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const emailDomains = emailDomainsRaw
          .split(',')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean);
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        emailDomains,
        plan: 'pilot',
      };
      if (ownerEmail.trim()) payload.ownerEmail = ownerEmail.trim().toLowerCase();

      const {orgId, initialInvite} = await dispatch(createOrgThunk(payload));

      if (initialInvite) {
        setSuccessOrgId(orgId);
        setSuccessInvite(initialInvite);
      } else {
        if (onCreated) onCreated(orgId);
        onHide();
      }
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
  const showSuccess = Boolean(successOrgId);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {showSuccess ? 'Organization created' : 'Create organization'}
        </Modal.Title>
      </Modal.Header>

      {showSuccess ? (
        <>
          <Modal.Body>
            <Alert variant="success" className="mb-3">
              Organization created and invitation prepared for <strong>{successInvite.email}</strong>.
            </Alert>
            <p className="text-secondary mb-2">
              Copy the invite link below and send it to your customer. Once
              they click it (signed in with the same email), they will be
              added as an <strong>admin</strong>. The link expires in 7 days.
            </p>
            <Form.Group className="mt-3">
              <Form.Label>Invitation link</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  value={inviteLink}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <Button variant="outline-primary" onClick={handleCopy}>
                  {copyLabel}
                </Button>
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => {
                if (onCreated) onCreated(successOrgId);
                onHide();
              }}
            >
              Done
            </Button>
          </Modal.Footer>
        </>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {submitError && (
              <Alert variant="danger" className="mb-3">
                {submitError}
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
                Lowercase letters, digits, non-consecutive hyphens.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Initial owner email <span className="text-secondary fs-xs">(optional)</span>
              </Form.Label>
              <Form.Control
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@acme.com"
              />
              <Form.Text className="text-secondary">
                We&apos;ll create an admin invitation for this email so the
                customer&apos;s lead can accept and take over. You&apos;ll get a
                copyable link on the next screen.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-1">
              <Form.Label>
                Allowed email domains <span className="text-secondary fs-xs">(optional)</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={emailDomainsRaw}
                onChange={(e) => setEmailDomainsRaw(e.target.value)}
                placeholder="acme.com, acme.co"
              />
              <Form.Text className="text-secondary">
                Comma-separated. Used later for SSO domain matching.
              </Form.Text>
            </Form.Group>

            <p className="fs-xs text-secondary mt-3 mb-0">
              You will be the owner. Plan starts as <strong>pilot</strong>.
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
      )}
    </Modal>
  );
}
