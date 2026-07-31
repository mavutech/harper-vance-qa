/**
 * @fileoverview Organization switcher — appears in the header when the
 * signed-in user belongs to one or more orgs.
 *
 * Reads from state.organization; dispatches switchOrg() on selection.
 * Renders nothing while no orgs are loaded (avoids a flash of empty
 * dropdown on cold start).
 */

import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import {useDispatch, useSelector} from 'react-redux';
import {switchOrg} from '../redux/orgActions';
import {useCurrentOrg} from '../hooks/useCurrentOrg';
import CreateOrgModal from './CreateOrgModal';

// Hoisted for stable component identity — same reason as
// NotificationToggle in Header.js (prevents Popper from losing its
// reference on re-render).
const SwitcherToggle = React.forwardRef(({children, onClick}, ref) => (
  <a
    href="#org-switcher"
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="dropdown-link org-switcher-toggle"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 6,
      color: 'var(--bs-body-color, #4b5563)',
      textDecoration: 'none',
    }}
  >
    {children}
  </a>
));

/**
 * @returns {?JSX.Element}
 */
const OrgSwitcher = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orgs = useSelector((s) => s.organization && s.organization.orgs);
  const isLoggedIn = useSelector((s) => s.auth && s.auth.isLoggedIn);
  const {currentOrg, currentOrgRole, isAdmin} = useCurrentOrg();

  const [showCreate, setShowCreate] = useState(false);

  // Only hide when the user isn't signed in yet.
  if (!isLoggedIn) return null;

  const orgList = Object.values(orgs || {});
  const hasNoOrgs = orgList.length === 0;

  const handleSwitch = async (orgId) => {
    if (!orgId || (currentOrg && orgId === currentOrg.id)) return;
    try {
      await dispatch(switchOrg(orgId));
    } catch (err) {
      // Error surfaces via state.organization.error; nothing to do here.
    }
  };

  return (
    <>
      <Dropdown className="ms-3">
      <Dropdown.Toggle as={SwitcherToggle} id="org-switcher-toggle">
        <span className="d-flex align-items-center gap-2">
          <i className="ri-building-2-line" style={{fontSize: 16}}></i>
          <span className="d-none d-md-inline fs-sm">
            {currentOrg ? currentOrg.name : (hasNoOrgs ? 'No organization' : 'Select organization')}
          </span>
          <i className="ri-arrow-down-s-line" style={{fontSize: 14, opacity: 0.6}}></i>
        </span>
      </Dropdown.Toggle>
      <Dropdown.Menu className="mt-2" style={{minWidth: 260}}>
        <div className="px-3 py-2 border-bottom">
          <h6 className="mb-0 fs-sm text-secondary text-uppercase" style={{letterSpacing: 0.5}}>
            Organizations
          </h6>
        </div>
        <div style={{maxHeight: 260, overflowY: 'auto'}}>
          {hasNoOrgs ? (
            <div className="px-3 py-3 text-secondary fs-sm">
              You don&apos;t belong to any organization yet.
            </div>
          ) : (
            <ul className="list-unstyled mb-0">
              {orgList.map((o) => {
                const active = currentOrg && o.id === currentOrg.id;
                return (
                  <li
                    key={o.id}
                    className={`px-3 py-2 ${active ? 'fw-medium' : ''}`}
                    onClick={() => handleSwitch(o.id)}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>{o.name}</span>
                      {active && (
                        <small className="text-secondary text-uppercase" style={{fontSize: 10}}>
                          {currentOrgRole}
                        </small>
                      )}
                    </div>
                    <span className="fs-xs text-secondary">{o.plan}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="px-3 py-2 border-top d-flex gap-3 fs-sm align-items-center">
          {hasNoOrgs ? (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreate(true)}
              >
                <i className="ri-add-line me-1"></i> Create organization
              </button>
              <span className="text-secondary fs-xs ms-auto">or ask for an invite.</span>
            </>
          ) : (
            isAdmin && (
              <>
                <Link
                  to="/pages/org-members"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/pages/org-members');
                  }}
                >
                  Members
                </Link>
                <Link
                  to="/pages/org-settings"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/pages/org-settings');
                  }}
                >
                  Settings
                </Link>
              </>
            )
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>

    <CreateOrgModal
      show={showCreate}
      onHide={() => setShowCreate(false)}
    />
    </>
  );
};

export default OrgSwitcher;
