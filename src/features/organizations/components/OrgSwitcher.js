/**
 * @fileoverview Organization switcher — appears in the header when the
 * signed-in user belongs to one or more orgs.
 *
 * Reads from state.organization; dispatches switchOrg() on selection.
 * Renders nothing while no orgs are loaded (avoids a flash of empty
 * dropdown on cold start).
 */

import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import {useDispatch, useSelector} from 'react-redux';
import {switchOrg} from '../redux/orgActions';
import {useCurrentOrg} from '../hooks/useCurrentOrg';

// Hoisted for stable component identity — same reason as
// NotificationToggle in Header.js (prevents Popper from losing its
// reference on re-render).
const SwitcherToggle = React.forwardRef(({children, onClick}, ref) => (
  <Link
    to=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="dropdown-link"
  >
    {children}
  </Link>
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
    <Dropdown className="dropdown-profile ms-3" align="end">
      <Dropdown.Toggle as={SwitcherToggle} id="org-switcher-toggle">
        <span className="d-flex align-items-center gap-2">
          <i className="ri-building-2-line"></i>
          <span className="d-none d-md-inline fw-medium">
            {currentOrg ? currentOrg.name : (hasNoOrgs ? 'No organization' : 'Select organization')}
          </span>
        </span>
      </Dropdown.Toggle>
      <Dropdown.Menu className="mt-10-f">
        <div className="dropdown-menu-header">
          <h6 className="dropdown-menu-title mb-0">Organizations</h6>
        </div>
        <div style={{maxHeight: 260, overflowY: 'auto'}}>
          {hasNoOrgs ? (
            <div className="p-3 text-secondary fs-sm">
              You don&apos;t belong to any organization yet.
            </div>
          ) : (
            <ul className="list-group">
              {orgList.map((o) => {
                const active = currentOrg && o.id === currentOrg.id;
                return (
                  <li
                    key={o.id}
                  className={`list-group-item ${active ? 'fw-medium' : ''}`}
                  onClick={() => handleSwitch(o.id)}
                  style={{cursor: 'pointer'}}
                >
                  <div className="list-group-body">
                    <p className="mb-0">
                      {o.name}
                      {active && (
                        <>
                          {' '}
                          <small className="text-secondary">· {currentOrgRole}</small>
                        </>
                      )}
                    </p>
                    <span className="fs-xs text-secondary">{o.plan}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          )}
        </div>
        <div className="dropdown-menu-footer d-flex gap-3">
          {hasNoOrgs ? (
            <span className="text-secondary fs-xs">Ask an admin for an invite.</span>
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
  );
};

export default OrgSwitcher;
