import {act, renderHook, waitFor} from '@testing-library/react';
import {useIntegrations} from './useIntegrations';
import {useIntegrationHistory} from './useIntegrationHistory';
import * as api from '../services/integrationService';
jest.mock('../services/integrationService');
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));

beforeEach(() => {
  jest.clearAllMocks();
  api.listIntegrations.mockResolvedValue({items: [], nextCursor: null});
});
it('loads only the selected organization and handles safe creation errors', async () => {
  const {result} = renderHook(() => useIntegrations({orgId: 'orgA'}, true));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(api.listIntegrations).toHaveBeenCalledWith({orgId: 'orgA'});
  api.createIntegration.mockRejectedValue({code: 'STORAGE_UNAVAILABLE', message: 'private'});
  await act(async () => { await result.current.create('orgA', {}).catch(() => {}); });
  expect(result.current.error).toContain('not available');
  expect(result.current.error).not.toContain('private');
});
it('does not request platform-wide data when customer scope is unavailable', () => {
  renderHook(() => useIntegrations({}, false));
  expect(api.listIntegrations).not.toHaveBeenCalled();
});
it('saves versioned details through the authenticated service and reloads the list', async () => {
  const {result} = renderHook(() => useIntegrations({orgId: 'orgA'}, true));
  await waitFor(() => expect(result.current.loading).toBe(false));
  api.editIntegration.mockResolvedValue({status: 'paused'});
  await act(async () => result.current.edit({orgId: 'orgA', id: 'destA'}, {expectedVersion: 2, label: 'Renamed'}));
  expect(api.editIntegration).toHaveBeenCalledWith('orgA', 'destA', {expectedVersion: 2, label: 'Renamed'});
  expect(api.listIntegrations).toHaveBeenCalledTimes(2);
});
it('uses the history service and reports retry results without provider errors', async () => {
  api.integrationHistory.mockResolvedValue({items: [], nextCursor: null});
  api.retryIntegration.mockResolvedValue({outcome: 'accepted'});
  const {result} = renderHook(() => useIntegrationHistory({orgId: 'orgA', id: 'destA'}));
  await waitFor(() => expect(result.current.page).not.toBeNull());
  await act(async () => { await result.current.retry('jobA'); });
  expect(api.retryIntegration).toHaveBeenCalledWith('orgA', 'destA', 'jobA');
  expect(result.current.notice).toBe('Accepted by destination');
});
