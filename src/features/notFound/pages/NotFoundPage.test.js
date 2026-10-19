import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {updatePageSEO} from '../../../config/seoConfig';
import {trackEvent} from '../../../utils/analytics';
import NotFoundPage from './NotFoundPage';

jest.mock('../../../config/seoConfig', () => ({updatePageSEO: jest.fn()}));
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
  });

  it('renders one branded recovery action without unrelated conversion links', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);

    expect(screen.getByRole('img', {name: 'Harper Vance'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {level: 1, name: 'This page isn’t available'}))
        .toBeInTheDocument();
    expect(screen.getByText('The page may have moved, or the address may be incorrect.'))
        .toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Return Home'})).toHaveAttribute('href', '/');
    expect(screen.queryByText(/request access/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/client login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Error 404')).not.toBeInTheDocument();
  });

  it('sets not-found metadata and records privacy-safe recovery events', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);

    expect(updatePageSEO).toHaveBeenCalledWith('notFound');
    expect(trackEvent).toHaveBeenCalledWith('not_found_page_viewed');
    expect(window.scrollTo).toHaveBeenCalledWith({top: 0, left: 0, behavior: 'auto'});

    fireEvent.click(screen.getByRole('link', {name: 'Return Home'}));
    expect(trackEvent).toHaveBeenCalledWith('not_found_return_home_selected');
  });
});
