import React from "react"
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Dropdown from 'react-bootstrap/Dropdown';
import moment from 'moment';
import { logoutUser } from "../redux/authentication/authActions";
import { useDisplayName } from "../features/auth";
import {
  markAllNotificationsRead,
  clearNotifications,
  setNotificationSoundEnabled,
} from "../redux/notifications/notificationActions";
import OrgSwitcher from "../features/organizations/components/OrgSwitcher";

// Hoisted so its component identity is stable across re-renders. Defining
// this inside Header() would create a new component type on every render,
// which forces react-bootstrap's Dropdown to unmount the toggle DOM node
// and Popper to reposition the menu against a detached reference (the
// menu jumps to the top-left of the viewport).
const NotificationToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href="#notifications"
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="dropdown-link"
  >
    {children}
  </a>
));

export default function Header({ onSkin }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useSelector(state => state.auth);
  const { items, unreadCount, soundEnabled } =
      useSelector(state => state.notifications);
  const { displayName } = useDisplayName();

  const initial = ((isLoggedIn && user
    ? (user.displayName || user.name || user.email)
    : 'G') || 'U').charAt(0).toUpperCase();

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
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

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logoutUser());
    navigate('/login');
  };

  const toggleSidebar = (e) => {
    e.preventDefault();
    let isOffset = document.body.classList.contains("sidebar-offset");
    if (isOffset) {
      document.body.classList.toggle("sidebar-show");
    } else {
      if (window.matchMedia("(max-width: 991px)").matches) {
        document.body.classList.toggle("sidebar-show");
      } else {
        document.body.classList.toggle("sidebar-hide");
      }
    }
  }

  function NotificationList() {
    if (!items.length) {
      return (
        <ul className="list-group">
          <li className="list-group-item text-secondary fs-sm" style={{ padding: '12px 14px' }}>
            No notifications yet today.
          </li>
        </ul>
      );
    }
    const notiList = items.map((item) => {
      const bullish = item.direction === 'Bullish';
      const isHit = item.kind === 'hit';
      const color = bullish ? '#198754' : '#dc3545';
      // Hit -> bullseye. New target -> directional arrow.
      const iconClass = isHit
        ? 'ri-focus-3-line'
        : bullish
          ? 'ri-arrow-up-line'
          : 'ri-arrow-down-line';
      const tag = isHit ? 'Hit · ' : '';
      return (
        <li
          className={`list-group-item ${item.read ? '' : 'fw-medium'}`}
          key={item.id}
          onClick={() => navigate('/dashboard/sona-targets')}
          style={{ cursor: 'pointer' }}
        >
          <div
            className="avatar"
            style={{
              backgroundColor: color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            <i className={iconClass}></i>
          </div>
          <div className="list-group-body">
            <p>
              <strong>{tag}{item.title}</strong>
              {item.body ? <> — {item.body}</> : null}
            </p>
            <span>{moment(item.ts).format('h:mm a')}</span>
          </div>
        </li>
      );
    });

    return (
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        <ul className="list-group">
          {notiList}
        </ul>
      </div>
    );
  }

  const handleToggleSound = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setNotificationSoundEnabled(!soundEnabled));
  };

  const handleClearAll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(clearNotifications());
  };

  const handleNotificationsToggle = (isOpen) => {
    if (isOpen && unreadCount > 0) dispatch(markAllNotificationsRead());
  };

  return (
    <div className="header-main px-3 px-lg-4">
      <Link onClick={toggleSidebar} className="menu-link me-3 me-lg-4"><i className="ri-menu-2-fill"></i></Link>

      <OrgSwitcher />

      <Dropdown
        className="dropdown-notification ms-auto"
        align="end"
        onToggle={handleNotificationsToggle}
      >
        <Dropdown.Toggle as={NotificationToggle}>
          {unreadCount > 0 && <small>{unreadCount > 9 ? '9+' : unreadCount}</small>}
          <i className={`ri-notification-3-line ${unreadCount > 0 ? 'notification-pulse' : ''}`}></i>
        </Dropdown.Toggle>
        <Dropdown.Menu className="mt-10-f me--10-f">
          <div className="dropdown-menu-header d-flex align-items-center justify-content-between">
            <h6 className="dropdown-menu-title mb-0">Notifications</h6>
            <div className="d-flex align-items-center gap-2 fs-xs">
              <button
                type="button"
                onClick={handleToggleSound}
                title={soundEnabled ? 'Mute alert sound' : 'Enable alert sound'}
                className="btn btn-link p-0 text-secondary"
                style={{ lineHeight: 1 }}
              >
                <i className={soundEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line'}></i>
              </button>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="btn btn-link p-0 text-secondary"
                  style={{ lineHeight: 1 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {NotificationList()}
          <div className="dropdown-menu-footer">
            <Link to="/dashboard/sona-targets">Open today's targets</Link>
          </div>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown className="dropdown-profile ms-3 ms-xl-4" align="end">
        <Dropdown.Toggle as={CustomToggle}>
          <div className="avatar online">
            {user && user.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              <span className="avatar-initial">{initial}</span>
            )}
          </div>
        </Dropdown.Toggle>
        <Dropdown.Menu className="mt-10-f">
          <div className="dropdown-menu-body">
            <div className="avatar avatar-xl online mb-3">
              {user && user.photoURL ? (
                <img src={user.photoURL} alt="" />
              ) : (
                <span className="avatar-initial">{initial}</span>
              )}
            </div>
            <h5 className="mb-1 text-dark fw-semibold">
              {displayName}
            </h5>
            <p className="fs-sm text-secondary">
              {isLoggedIn && user ? user.email : 'Not logged in'}
            </p>

            <nav className="nav">
              <Link to="/pages/profile"><i className="ri-edit-2-line"></i> Edit Profile</Link>
            </nav>
            <hr />
            <nav className="nav">
              <Link to="" onClick={handleLogout}><i className="ri-logout-box-r-line"></i> Log Out</Link>
            </nav>
          </div>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  )
}
