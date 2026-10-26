import * as types from '../targetStatsTypes';

const INITIAL_STATE = {
  rolling: {data: null, sessions: null, loading: false, error: null, requestKey: null},
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
  monthly: { data: null, loading: false, error: null, requestKey: null, month: null },
  weeklyTrend: {
    data: [],
    loading: false,
    error: null,
    requestKey: null,
  },
};

/**
 * Manages all target target stats state across daily, range, and weekly fetch cycles.
 * Each slice (daily, range, weekly) independently tracks loading, error, and data.
 *
 * @param {Object} state - Current target stats state
 * @param {{ type: string, payload: * }} action - Dispatched action
 * @returns {Object} Next state
 */
const targetStatsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {

    case types.TARGET_ROLLING_REQUEST:
      return {...state, rolling: {data: null, sessions: action.meta.sessions, loading: true,
        error: null, requestKey: action.meta.requestKey}};
    case types.TARGET_ROLLING_SUCCESS:
      if (action.meta.requestKey !== state.rolling.requestKey) return state;
      return {...state, rolling: {...state.rolling, data: action.payload, loading: false}};
    case types.TARGET_ROLLING_FAILURE:
      if (action.meta.requestKey !== state.rolling.requestKey) return state;
      return {...state, rolling: {...state.rolling, error: action.payload, loading: false}};

    // ── Daily ──────────────────────────────────────────────────────────────────
    case types.TARGET_DAILY_FETCH_REQUEST:
      return {
        ...state,
        daily: { ...state.daily, loading: true, error: null, selectedDate: action.payload },
      };

    case types.TARGET_DAILY_FETCH_SUCCESS:
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

    case types.TARGET_DAILY_FETCH_FAILURE:
      return {
        ...state,
        daily: { ...state.daily, loading: false, error: action.payload },
      };

    // ── Range (rolling / historical) ───────────────────────────────────────────
    case types.TARGET_RANGE_FETCH_REQUEST:
      return {
        ...state,
        range: { ...state.range, data: [], loading: true, error: null, requestKey: action.meta?.requestKey },
      };

    case types.TARGET_RANGE_FETCH_SUCCESS:
      if (action.meta?.requestKey !== state.range.requestKey) return state;
      return {
        ...state,
        range: { ...state.range, loading: false, data: action.payload },
      };

    case types.TARGET_RANGE_FETCH_FAILURE:
      if (action.meta?.requestKey !== state.range.requestKey) return state;
      return {
        ...state,
        range: { ...state.range, loading: false, error: action.payload },
      };

    // ── Weekly ─────────────────────────────────────────────────────────────────
    case types.TARGET_WEEKLY_FETCH_REQUEST:
      return {
        ...state,
        weekly: { ...state.weekly, data: null, loading: true, error: null, requestKey: action.meta?.requestKey },
      };

    case types.TARGET_WEEKLY_FETCH_SUCCESS:
      if (action.meta?.requestKey !== state.weekly.requestKey) return state;
      return {
        ...state,
        weekly: { ...state.weekly, loading: false, data: action.payload },
      };

    case types.TARGET_WEEKLY_FETCH_FAILURE:
      if (action.meta?.requestKey !== state.weekly.requestKey) return state;
      return {
        ...state,
        weekly: { ...state.weekly, loading: false, error: action.payload },
      };

    // ── Weekly Trend ───────────────────────────────────────────────────────────
    case types.TARGET_WEEKLY_TREND_REQUEST:
      return {
        ...state,
        weeklyTrend: { ...state.weeklyTrend, data: [], loading: true, error: null, requestKey: action.meta?.requestKey },
      };

    case types.TARGET_WEEKLY_TREND_SUCCESS:
      if (action.meta?.requestKey !== state.weeklyTrend.requestKey) return state;
      return {
        ...state,
        weeklyTrend: { ...state.weeklyTrend, loading: false, data: action.payload },
      };

    case types.TARGET_WEEKLY_TREND_FAILURE:
      if (action.meta?.requestKey !== state.weeklyTrend.requestKey) return state;
      return {
        ...state,
        weeklyTrend: { ...state.weeklyTrend, loading: false, error: action.payload },
      };

    case types.TARGET_MONTHLY_FETCH_REQUEST:
      return { ...state, monthly: { data: null, loading: true, error: null,
        requestKey: action.meta.requestKey, month: action.meta.month } };
    case types.TARGET_MONTHLY_FETCH_SUCCESS:
      if (action.meta.requestKey !== state.monthly.requestKey) return state;
      return { ...state, monthly: { ...state.monthly, loading: false, data: action.payload } };
    case types.TARGET_MONTHLY_FETCH_FAILURE:
      if (action.meta.requestKey !== state.monthly.requestKey) return state;
      return { ...state, monthly: { ...state.monthly, loading: false, error: action.payload } };

    default:
      return state;
  }
};

export default targetStatsReducer;
