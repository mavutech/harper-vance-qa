import { chartTooltipTheme } from './chartTheme';

describe('chartTooltipTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-skin');
    localStorage.clear();
  });

  it('returns dark when data-skin="dark"', () => {
    document.documentElement.setAttribute('data-skin', 'dark');
    expect(chartTooltipTheme()).toBe('dark');
  });

  it('returns light when the data-skin attribute is not dark', () => {
    document.documentElement.setAttribute('data-skin', 'light');
    expect(chartTooltipTheme()).toBe('light');
  });

  it('falls back to the persisted skin-mode when no attribute is set', () => {
    localStorage.setItem('skin-mode', 'dark');
    expect(chartTooltipTheme()).toBe('dark');
  });

  it('defaults to light with no attribute and no stored preference', () => {
    expect(chartTooltipTheme()).toBe('light');
  });

  it('prefers the data-skin attribute over localStorage', () => {
    document.documentElement.setAttribute('data-skin', 'light');
    localStorage.setItem('skin-mode', 'dark');
    expect(chartTooltipTheme()).toBe('light');
  });
});
