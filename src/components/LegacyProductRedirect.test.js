import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes, useLocation} from 'react-router-dom';
import LegacyProductRedirect from './LegacyProductRedirect';
import {PRODUCT_ROUTES} from '../config/productRoutes';

/** @returns {React.ReactElement} Observable destination including navigation state. */
function Destination() {
  const location = useLocation();
  return <div data-testid="destination">{JSON.stringify(location)}</div>;
}

test.each(['targets', 'daily', 'weekly', 'history'])(
  'preserves selection, anchor and state for the old %s bookmark', (key) => {
    render(<MemoryRouter initialEntries={[{
      pathname: `/dashboard/sona-${key}`, search: '?date=2026-10-26&week=44&year=2026',
      hash: '#target-log', state: {fromNotification: true},
    }]}><Routes>
      <Route path={`/dashboard/sona-${key}`} element={<LegacyProductRedirect to={PRODUCT_ROUTES[key]} />} />
      <Route path={PRODUCT_ROUTES[key]} element={<Destination />} />
    </Routes></MemoryRouter>);
    const location = JSON.parse(screen.getByTestId('destination').textContent);
    expect(location).toMatchObject({pathname: PRODUCT_ROUTES[key],
      search: '?date=2026-10-26&week=44&year=2026', hash: '#target-log', state: {fromNotification: true}});
  },
);
