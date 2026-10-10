import React from 'react';
import {Navigate} from 'react-router-dom';
import publicRoutes from './PublicRoutes';

/**
 * Finds one configured public route by path.
 *
 * @param {string} path - Relative route path.
 * @returns {Object|undefined} Matching route configuration.
 */
const routeFor = (path) => publicRoutes.find((route) => route.path === path);

describe('public customer onboarding routes', () => {
  it('keeps the approved customer login and invitation routes available', () => {
    expect(routeFor('login')).toBeDefined();
    expect(routeFor('pages/accept-invite')).toBeDefined();
  });

  it.each(['pages/signup', 'pages/signup2'])(
    'redirects the legacy self-registration route %s to the public site',
    (path) => {
      const route = routeFor(path);

      expect(route.element.type).toBe(Navigate);
      expect(route.element.props).toMatchObject({to: '/', replace: true});
    },
  );

  it('redirects the legacy sign-in page to the canonical client login', () => {
    const route = routeFor('pages/signin');

    expect(route.element.type).toBe(Navigate);
    expect(route.element.props).toMatchObject({to: '/login', replace: true});
  });
});
