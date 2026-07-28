import { SET_SHOW_TEMPLATE_MENUS } from './preferencesTypes';

export const setShowTemplateMenus = (value) => ({
  type: SET_SHOW_TEMPLATE_MENUS,
  payload: Boolean(value),
});
