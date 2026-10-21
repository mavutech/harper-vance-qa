import React from 'react';
import {render, screen, fireEvent, waitFor, act} from '@testing-library/react';
import IntegrationForm from './IntegrationForm';
import IntegrationList from './IntegrationList';

jest.mock('./IntegrationHistory', () => () => <div>History dialog</div>);

it('shows server allowance, hides unlicensed reports and blocks creation at capacity', () => {
  render(<IntegrationForm members={[]} onCreate={jest.fn()} allowance={{
    used: 5, limit: 5, complete: true, reportTypes: ['weekly'],
  }} />);
  expect(screen.getByText('5 of 5 webhook destinations used')).toBeInTheDocument();
  expect(screen.queryByLabelText('Daily report')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Weekly statistics')).toBeChecked();
  expect(screen.getByRole('button', {name: 'Add paused integration'})).toBeDisabled();
});

it('explains payload mapping, authentication and dashboard links in the styled setup guide', () => {
  render(<IntegrationForm members={[]} onCreate={jest.fn()} allowance={{
    used: 0, limit: 5, complete: true, reportTypes: ['weekly'],
  }} />);
  fireEvent.click(screen.getByRole('button', {name: 'How to connect your automation service'}));
  expect(screen.getByText(/Map dashboardUrl/)).toBeInTheDocument();
  expect(screen.getByText(/Signed payloads and custom header credentials are not supported/)).toBeInTheDocument();
  expect(screen.getByRole('link', {name: 'Read the applicable service terms'})).toHaveAttribute('href', '/terms');
});

it('submits weekly by default, limits owners to managers, and clears the endpoint', async () => {
  const create = jest.fn().mockResolvedValue({});
  render(<IntegrationForm allowance={{used: 0, limit: 5, complete: true, reportTypes: ['daily', 'weekly']}} members={[
    {uid: 'owner', displayName: 'Owner', orgRole: 'owner'},
    {uid: 'member', displayName: 'Member', orgRole: 'member'},
  ]} busy={false} onCreate={create} />);
  expect(screen.queryByRole('option', {name: 'Member'})).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Integration name'), {target: {value: 'Research'}});
  fireEvent.change(screen.getByLabelText('HTTPS webhook address'), {target: {value: 'https://example.com/private'}});
  fireEvent.change(screen.getByLabelText('Responsible user'), {target: {value: 'owner'}});
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Add paused integration'})); });
  await waitFor(() => expect(create).toHaveBeenCalledWith({
    label: 'Research', url: 'https://example.com/private', responsibleUserId: 'owner', reportTypes: ['weekly'],
  }));
  expect(screen.getByLabelText('HTTPS webhook address')).toHaveValue('');
});

it('requires confirmation before sending a sample and shows no full endpoint', async () => {
  const test = jest.fn().mockResolvedValue({outcome: 'accepted'});
  const item = {id: 'dest', orgId: 'org', label: 'Research', status: 'paused',
    schemaVersion: 2, destinationHost: 'hook.us2.make.com', reportTypes: ['weekly'], responsibleUserId: 'owner'};
  render(<IntegrationList state={{items: [item], test, change: jest.fn()}} />);
  fireEvent.click(screen.getByRole('button', {name: 'Send sample test'}));
  expect(test).not.toHaveBeenCalled();
  expect(screen.getByText(/clearly labeled sample data/)).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Confirm'})); });
  await waitFor(() => expect(test).toHaveBeenCalledWith(item));
});

it('does not offer management actions for example legacy records', () => {
  render(<IntegrationList state={{items: [{id: 'legacy', orgId: 'org', label: 'Example',
    status: 'active', schemaVersion: 1, reportTypes: []}]}} />);
  expect(screen.queryByRole('button', {name: 'Activate'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Send sample test'})).not.toBeInTheDocument();
});

it('requires an accepted sample and an unchecked licensed-use acknowledgment before activation', async () => {
  const change = jest.fn().mockResolvedValue({});
  const item = {id: 'dest', orgId: 'org', label: 'Research', status: 'paused',
    schemaVersion: 2, reportTypes: ['weekly'], lastTestOutcome: null};
  const {rerender} = render(<IntegrationList state={{items: [item], change}} />);
  expect(screen.getByRole('button', {name: 'Activate'})).toBeDisabled();
  rerender(<IntegrationList state={{items: [{...item, lastTestOutcome: 'accepted'}], change}} />);
  fireEvent.click(screen.getByRole('button', {name: 'Activate'}));
  const checkbox = screen.getByRole('checkbox');
  expect(checkbox).not.toBeChecked();
  expect(screen.getByRole('button', {name: 'Confirm'})).toBeDisabled();
  fireEvent.click(checkbox);
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Confirm'})); });
  expect(change).toHaveBeenCalledWith(expect.objectContaining({id: 'dest'}), {
    status: 'active', sharingWarningVersion: 'licensed-use-v1',
  });
});
