import {act, renderHook, waitFor} from '@testing-library/react';
import apiClient from '../../../api/client';
import {useDayContextSummary} from './useDayContextSummary';

jest.mock('../../../api/client', () => ({get: jest.fn()}));

describe('useDayContextSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads current day context through the product API', async () => {
    apiClient.get.mockResolvedValue({
      eventTags: ['cpi'],
      buckets: {
        baseline: {_overall: {nTargets: 100, accuracy: 0.7}},
        cpi: {_overall: {nDays: 8, nTargets: 20, accuracy: 0.75}},
      },
    });

    const {result} = renderHook(() => useDayContextSummary());

    await waitFor(() => expect(result.current?.tags?.[0]?.tag).toBe('cpi'));
    expect(apiClient.get).toHaveBeenCalledWith('/api/product/day-context', {
      params: {date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)},
    });
  });

  it('returns no summary when the request fails', async () => {
    apiClient.get.mockRejectedValue(new Error('request failed'));

    const {result} = renderHook(() => useDayContextSummary());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBeNull();
  });
});
