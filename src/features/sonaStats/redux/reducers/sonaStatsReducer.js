import * as types from '../sonaStatsTypes';

const INITIAL_STATE = {
  daily: {
    data: null,
    computedStats: null,
    selectedDate: null,
    loading: false,
    error: null,
  },
  range: {
    data: [],
    loading: false,
    error: null,
    requestKey: null,
  },
  weekly: {
    data: null,
    loading: false,
    error: null,
    requestKey: null,
  },
  weeklyTrend: {
    data: [],
    loading: false,
    error: null,
    requestKey: null,
  },
};

/**
 * Manages all SONA target stats state across daily, range, and weekly fetch cycles.
 * Each slice (daily, range, weekly) independently tracks loading, error, and data.
 *
 * @param {Object} state - Current SONA stats state
 * @param {{ type: string, payload: * }} action - Dispatched action
 * @returns {Object} Next state
 */
const sonaStatsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {

    // ── Daily ──────────────────────────────────────────────────────────────────
    case types.SONA_DAILY_FETCH_REQUEST:
      return {
        ...state,
        daily: { ...state.daily, loading: true, error: null, selectedDate: action.payload },
      };

    case types.SONA_DAILY_FETCH_SUCCESS:
      return {
        ...state,
        daily: {
          ...state.daily,
          loading: false,
          data: action.payload.rawPayload,
          computedStats: action.payload.computedStats,
          selectedDate: action.payload.date,
        },
      };

    case types.SONA_DAILY_FETCH_FAILURE:
      return {
        ...state,
        daily: { ...state.daily, loading: false, error: action.payload },
      };

    // ── Range (rolling / historical) ───────────────────────────────────────────
    case types.SONA_RANGE_FETCH_REQUEST:
      return {
        ...state,
        range: { ...state.range, data: [], loading: true, error: null, requestKey: action.meta?.requestKey },
      };

    case types.SONA_RANGE_FETCH_SUCCESS:
      if (action.meta?.requestKey !== state.range.requestKey) return state;
      return {
        ...state,
        range: { ...state.range, loading: false, data: action.payload },
      };

    case types.SONA_RANGE_FETCH_FAILURE:
      if (action.meta?.requestKey !== state.range.requestKey) return state;
      return {
        ...state,
        range: { ...state.range, loading: false, error: action.payload },
      };

    // ── Weekly ─────────────────────────────────────────────────────────────────
    case types.SONA_WEEKLY_FETCH_REQUEST:
      return {
        ...state,
        weekly: { ...state.weekly, data: null, loading: true, error: null, requestKey: action.meta?.requestKey },
      };

    case types.SONA_WEEKLY_FETCH_SUCCESS:
      if (action.meta?.requestKey !== state.weekly.requestKey) return state;
      return {
        ...state,
        weekly: { ...state.weekly, loading: false, data: action.payload },
      };

    case types.SONA_WEEKLY_FETCH_FAILURE:
      if (action.meta?.requestKey !== state.weekly.requestKey) return state;
      return {
        ...state,
        weekly: { ...state.weekly, loading: false, error: action.payload },
      };

    // ── Weekly Trend ───────────────────────────────────────────────────────────
    case types.SONA_WEEKLY_TREND_REQUEST:
      return {
        ...state,
        weeklyTrend: { ...state.weeklyTrend, data: [], loading: true, error: null, requestKey: action.meta?.requestKey },
      };

    case types.SONA_WEEKLY_TREND_SUCCESS:
      if (action.meta?.requestKey !== state.weeklyTrend.requestKey) return state;
      return {
        ...state,
        weeklyTrend: { ...state.weeklyTrend, loading: false, data: action.payload },
      };

    case types.SONA_WEEKLY_TREND_FAILURE:
      if (action.meta?.requestKey !== state.weeklyTrend.requestKey) return state;
      return {
        ...state,
        weeklyTrend: { ...state.weeklyTrend, loading: false, error: action.payload },
      };

    default:
      return state;
  }
};

export default sonaStatsReducer;
