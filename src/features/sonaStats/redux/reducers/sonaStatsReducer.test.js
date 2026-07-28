import sonaStatsReducer from './sonaStatsReducer';
import * as types from '../sonaStatsTypes';

describe('sonaStatsReducer weekly request handling', () => {
  it('ignores an older weekly response after a newer week is requested', () => {
    const week29Request = sonaStatsReducer(undefined, {
      type: types.SONA_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-29' },
    });
    const week30Request = sonaStatsReducer(week29Request, {
      type: types.SONA_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-30' },
    });
    const staleResponse = sonaStatsReducer(week30Request, {
      type: types.SONA_WEEKLY_FETCH_SUCCESS,
      payload: { weekNumberRaw: 29 },
      meta: { requestKey: '2026-29' },
    });
    const currentResponse = sonaStatsReducer(staleResponse, {
      type: types.SONA_WEEKLY_FETCH_SUCCESS,
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
    const populated = sonaStatsReducer(undefined, {
      type: types.SONA_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-29' },
    });
    const resolved = sonaStatsReducer(populated, {
      type: types.SONA_WEEKLY_FETCH_SUCCESS,
      payload: { weekNumberRaw: 29 },
      meta: { requestKey: '2026-29' },
    });
    const nextRequest = sonaStatsReducer(resolved, {
      type: types.SONA_WEEKLY_FETCH_REQUEST,
      meta: { requestKey: '2026-30' },
    });

    expect(nextRequest.weekly.data).toBeNull();
    expect(nextRequest.weekly.loading).toBe(true);
  });
});