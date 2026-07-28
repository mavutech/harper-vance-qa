import { SET_SHOW_TEMPLATE_MENUS } from './preferencesTypes';

const INITIAL_STATE = {
  // When false, Sidebar hides the demo/template menu groups
  // (Dashboard, Applications, Pages, UI Elements) and shows only SONA Analytics.
  showTemplateMenus: false,
};

const preferencesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SET_SHOW_TEMPLATE_MENUS:
      return { ...state, showTemplateMenus: action.payload };
    default:
      return state;
  }
};

export default preferencesReducer;
