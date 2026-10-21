import React from 'react';
import {render, screen, fireEvent, waitFor, act} from '@testing-library/react';
import IntegrationEditor from '../components/IntegrationEditor';
import {useIntegrations} from '../hooks/useIntegrations';
jest.mock('../hooks/useIntegrations');
const item = {id: 'dest', orgId: 'org', label: 'Research', editVersion: 3,
  destinationHost: 'hooks.example.com', reportTypes: ['daily']};
beforeEach(() => useIntegrations.mockReturnValue({allowance: {reportTypes: ['daily', 'weekly']}, loading: false}));

it('shows a masked address and submits a rename without replacing the URL or reports', async () => {
  const onSave = jest.fn().mockResolvedValue({});
  const onClose = jest.fn();
  render(<IntegrationEditor item={item} onSave={onSave} onClose={onClose} />);
  expect(screen.getByText('https://hooks.example.com/••••')).toBeInTheDocument();
  expect(screen.getByLabelText('Replacement webhook URL')).toHaveValue('');
  expect(screen.getByRole('button', {name: 'Save changes'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Integration name'), {target: {value: 'Renamed'}});
  await act(async () => fireEvent.click(screen.getByRole('button', {name: 'Save changes'})));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(onSave).toHaveBeenCalledWith(item, {expectedVersion: 3, label: 'Renamed'});
});

it('warns about retesting when replacing the endpoint or reports, blocks empty reports', async () => {
  const onSave = jest.fn().mockResolvedValue({});
  render(<IntegrationEditor item={item} onSave={onSave} onClose={jest.fn()} />);
  fireEvent.click(screen.getByLabelText('Daily report'));
  expect(screen.getByRole('button', {name: 'Save changes'})).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Weekly statistics'));
  fireEvent.change(screen.getByLabelText('Replacement webhook URL'), {target: {value: 'https://new.example.com/private'}});
  expect(screen.getByText(/clear its previous test approval/)).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole('button', {name: 'Save changes'})));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(item, {
    expectedVersion: 3, url: 'https://new.example.com/private', reportTypes: ['weekly'],
  }));
});

it('keeps the editor open and reports stale edits without exposing raw errors', async () => {
  const onClose = jest.fn();
  render(<IntegrationEditor item={item} onSave={jest.fn().mockRejectedValue({code: 'EDIT_CONFLICT', message: 'private-token'})} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText('Integration name'), {target: {value: 'New name'}});
  await act(async () => fireEvent.click(screen.getByRole('button', {name: 'Save changes'})));
  await screen.findByText(/edited elsewhere/);
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.queryByText('private-token')).not.toBeInTheDocument();
});
