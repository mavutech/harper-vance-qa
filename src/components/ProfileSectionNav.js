import React, {useEffect, useRef} from 'react';
import {Nav} from 'react-bootstrap';

/**
 * Renders the profile section menu as a horizontally scrollable tab row.
 *
 * @param {object} props - Component properties
 * @param {Array<{key: string, label: string}>} props.tabs - Available sections
 * @param {string} props.activeKey - Currently selected section key
 * @param {(key: string) => void} props.onSelect - Section selection handler
 * @return {React.ReactElement} Scrollable profile navigation
 */
export default function ProfileSectionNav({tabs, activeKey, onSelect}) {
  const navRef = useRef(null);

  useEffect(() => {
    const activeLink = navRef.current?.querySelector('.nav-link.active');
    activeLink?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeKey]);

  return (
    <Nav
      ref={navRef}
      className="nav-line profile-section-nav mb-4"
      activeKey={activeKey}
      aria-label="Profile sections"
      role="tablist"
      onSelect={(key) => key && onSelect(key)}
    >
      {tabs.map((tab) => (
        <Nav.Link
          key={tab.key}
          eventKey={tab.key}
          role="tab"
          aria-selected={activeKey === tab.key}
        >
          {tab.label}
        </Nav.Link>
      ))}
    </Nav>
  );
}
