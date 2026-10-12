import React, {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import ProfileSectionNav from './ProfileSectionNav';

const tabs = [
  {key: 'identity', label: 'Identity'},
  {key: 'email', label: 'Email'},
  {key: 'password', label: 'Password'},
  {key: 'preferences', label: 'Preferences'},
  {key: 'security', label: 'Security'},
];

const ProfileNavHarness = () => {
  const [activeKey, setActiveKey] = useState('identity');
  return (
    <ProfileSectionNav
      tabs={tabs}
      activeKey={activeKey}
      onSelect={setActiveKey}
    />
  );
};

describe('ProfileSectionNav', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('keeps every profile section in one scrollable navigation row', () => {
    render(<ProfileNavHarness />);

    const nav = screen.getByLabelText('Profile sections');
    expect(nav).toHaveClass('profile-section-nav');
    expect(screen.getAllByRole('tab')).toHaveLength(tabs.length);
  });

  it('selects and reveals a profile section', () => {
    render(<ProfileNavHarness />);

    fireEvent.click(screen.getByRole('tab', {name: 'Security'}));

    expect(screen.getByRole('tab', {name: 'Security'})).toHaveClass('active');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
