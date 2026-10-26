/**
 * Returns the ApexCharts tooltip theme that matches the app's active skin, so
 * chart tooltips don't render with light styling (white box / white text) when
 * the dark skin is active. Reads the `data-skin` attribute App.js sets on the
 * <html> element, falling back to the persisted skin-mode preference.
 *
 * @returns {'dark'|'light'} Theme to pass to ApexCharts `tooltip.theme`
 */
export const chartTooltipTheme = () => {
  if (typeof document !== 'undefined') {
    const skin = document.documentElement.getAttribute('data-skin');
    if (skin) return skin === 'dark' ? 'dark' : 'light';
  }
  try {
    return localStorage.getItem('skin-mode') ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

/**
 * Axis / legend label color that stays legible on both skins. The default
 * `#6e7985` used across the daily charts disappears against the dark skin's
 * near-black card background; this returns a lighter grey in dark mode.
 *
 * @returns {string} Hex color for chart label text
 */
export const chartLabelColor = () => (chartTooltipTheme() === 'dark' ? '#a8b0c4' : '#6e7985');

