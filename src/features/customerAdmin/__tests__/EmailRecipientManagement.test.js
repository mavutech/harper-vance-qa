import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import EmailRecipientManagement from '../components/EmailRecipientManagement';
import {listEmailRecipients, addEmailRecipient, assignEmailRecipient} from '../services/integrationService';
jest.mock('../services/integrationService');
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
const recipient = {id: 'email1', orgId: 'org', responsibleUserId: 'one', responsibleUserName: 'Member One',
  maskedAddress: 'o***@example.com', status: 'paused', assigned: true, editVersion: 1, verified: true, schemaVersion: 2};
const record = {items: [recipient], allowance: {used: 1, limit: 1, exceptions: 0, complete: true}};
beforeEach(() => { jest.clearAllMocks(); listEmailRecipients.mockResolvedValue(record); });
it('shows capacity and personal opt-out separately, and frees assignment without changing preference', async () => {
  render(<MemoryRouter><EmailRecipientManagement orgId="org" members={[{uid: 'two', displayName: 'Member Two'}]} /></MemoryRouter>);
  expect(await screen.findByText('1 of 1 daily report recipient slots assigned')).toBeInTheDocument();
  expect(screen.getByText('Opted out')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Add recipient'})).toBeDisabled();
  assignEmailRecipient.mockResolvedValue({...recipient, assigned: false});
  listEmailRecipients.mockResolvedValue({items: [{...recipient, assigned: false}],
    allowance: {...record.allowance, used: 0}});
  fireEvent.click(screen.getByRole('button', {name: 'Unassign recipient'}));
  await screen.findByText('0 of 1 daily report recipient slots assigned');
  expect(assignEmailRecipient).toHaveBeenCalledWith(recipient, false);
  expect(screen.getByText('Opted out')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Licensed team member'), {target: {value: 'two'}});
  addEmailRecipient.mockResolvedValue([]);
  fireEvent.click(screen.getByRole('button', {name: 'Add recipient'}));
  await waitFor(() => expect(addEmailRecipient).toHaveBeenCalledWith('org', 'two'));
  await waitFor(() => expect(screen.getByLabelText('Licensed team member')).toHaveValue(''));
});
it('keeps an assignment visible after a failed save and displays overage and migration exceptions', async () => {
  listEmailRecipients.mockResolvedValue({...record, items: [{...recipient, legacyEmailApproved: true}],
    allowance: {...record.allowance, exceptions: 1, overLimit: true}});
  render(<MemoryRouter><EmailRecipientManagement orgId="org" /></MemoryRouter>);
  await screen.findByText('Approved existing recipient exception');
  expect(screen.getByText(/Ordinary email delivery is held/)).toBeInTheDocument();
  assignEmailRecipient.mockRejectedValue({code: 'EDIT_CONFLICT'});
  fireEvent.click(screen.getByRole('button', {name: 'Unassign recipient'}));
  await screen.findByText('These settings were edited elsewhere. Refresh before saving again.');
  expect(screen.getByText('Assigned')).toBeInTheDocument();
});
