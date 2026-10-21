import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import DailyEmailPreferences from '../components/DailyEmailPreferences';
import {initializeEmailPreferences, updateEmailPreference} from '../services/integrationService';
jest.mock('../services/integrationService');
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
const preference = {id: 'dest_email', orgId: 'org', type: 'email', status: 'active', editVersion: 0, maskedAddress: 'a***@example.com'};
beforeEach(() => {
  jest.clearAllMocks();
  initializeEmailPreferences.mockResolvedValue([preference]);
});
it('shows default opt-in, saves opt-out and opt-in, and keeps a failed update unchanged', async () => {
  render(<DailyEmailPreferences orgId="org" />);
  const checkbox = await screen.findByLabelText('Email me the daily report');
  expect(checkbox).toBeChecked();
  updateEmailPreference.mockResolvedValueOnce({...preference, status: 'paused', editVersion: 1});
  fireEvent.click(checkbox);
  await waitFor(() => expect(checkbox).not.toBeChecked());
  expect(updateEmailPreference).toHaveBeenCalledWith(preference, false);
  updateEmailPreference.mockRejectedValueOnce({code: 'EDIT_CONFLICT'});
  fireEvent.click(checkbox);
  await screen.findByRole('alert');
  expect(checkbox).not.toBeChecked();
  updateEmailPreference.mockResolvedValueOnce({...preference, editVersion: 2});
  fireEvent.click(checkbox);
  await waitFor(() => expect(checkbox).toBeChecked());
});
it('preserves an existing unchecked preference after loading', async () => {
  initializeEmailPreferences.mockResolvedValue([{...preference, status: 'paused'}]);
  render(<DailyEmailPreferences orgId="org" />);
  expect(await screen.findByLabelText('Email me the daily report')).not.toBeChecked();
});
