import targetStatsReducer from './targetStatsReducer';
import * as types from '../targetStatsTypes';

describe('targetStatsReducer weekly request handling', () => {
  it('ignores an older weekly response after a newer week is requested', () => {
    const week29Request = targetStatsReducer(undefined, {
      type: types.TARGET_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-29' },
    });
    const week30Request = targetStatsReducer(week29Request, {
      type: types.TARGET_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-30' },
    });
    const staleResponse = targetStatsReducer(week30Request, {
      type: types.TARGET_WEEKLY_FETCH_SUCCESS,
      payload: { weekNumberRaw: 29 },
      meta: { requestKey: '2026-29' },
    });
    const currentResponse = targetStatsReducer(staleResponse, {
      type: types.TARGET_WEEKLY_FETCH_SUCCESS,
      payload: { weekNumberRaw: 30 },
      meta: { requestKey: '2026-30' },
    });

    expect(staleResponse).toBe(week30Request);
    expect(currentResponse.weekly).toMatchObject({
      data: { weekNumberRaw: 30 },
      loading: false,
      requestKey: '2026-30',
    });
  });

  it('clears previous weekly data while the next week loads', () => {
    const populated = targetStatsReducer(undefined, {
      type: types.TARGET_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-29' },
    });
    const resolved = targetStatsReducer(populated, {
      type: types.TARGET_WEEKLY_FETCH_SUCCESS,
      payload: { weekNumberRaw: 29 },
      meta: { requestKey: '2026-29' },
    });
    const nextRequest = targetStatsReducer(resolved, {
      type: types.TARGET_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-30' },
    });

    expect(nextRequest.weekly.data).toBeNull();
    expect(nextRequest.weekly.loading).toBe(true);
  });
});