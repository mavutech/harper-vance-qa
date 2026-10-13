import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useTodaysTargets} from '../hooks/useTodaysTargets';
import SonaTargets from './SonaTargets';

jest.mock('../../../layouts/Header', () => () => <div>Header</div>);
jest.mock('../../../layouts/Footer', () => () => <div>Footer</div>);
jest.mock('../../../config/seoConfig', () => ({updatePageSEO: jest.fn()}));
jest.mock('../hooks/useTodaysTargets', () => ({useTodaysTargets: jest.fn()}));
jest.mock('../hooks/useDayContextSummary', () => ({useDayContextSummary: jest.fn(() => null)}));
jest.mock('../components/OpenTargetsPanel', () => () => <div>Open targets panel</div>);
jest.mock('../components/TargetSessionKpis', () => () => <div>Session KPIs</div>);
jest.mock('../components/TargetLiveTable', () => () => <div>Target live table</div>);
jest.mock('../components/StaleLevelsPanel', () => () => <div>Stale levels</div>);

/**
 * Renders the targets page inside its router dependency.
 *
 * @return {void}
 */
const renderPage = () => render(<MemoryRouter><SonaTargets /></MemoryRouter>);

describe('SonaTargets page states', () => {
  const retryTargets = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTodaysTargets.mockReturnValue({
      targets: [],
      isSessionLive: false,
      loading: false,
      error: null,
      retryTargets,
    });
  });

  it('shows a bounded loading state while the first target request is pending', () => {
    useTodaysTargets.mockReturnValue({
      targets: [], isSessionLive: false, loading: true, error: null, retryTargets,
    });
    renderPage();

    expect(screen.getByText("Loading today's targets...")).toBeInTheDocument();
    expect(screen.queryByText('Session KPIs')).not.toBeInTheDocument();
  });

  it('shows a safe retry action instead of raw permission details', () => {
    useTodaysTargets.mockReturnValue({
      targets: [],
      isSessionLive: false,
      loading: false,
      error: "Today's targets could not be loaded. Please try again.",
      retryTargets,
    });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent("Today's targets could not be loaded");
    expect(screen.queryByText(/permission_denied/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(retryTargets).toHaveBeenCalledTimes(1);
  });

  it('distinguishes a successful empty session from a load failure', () => {
    renderPage();

    expect(screen.getByText(/No targets generated yet/i)).toBeInTheDocument();
    expect(screen.getByText('Session KPIs')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the live target panels when data is available', () => {
    useTodaysTargets.mockReturnValue({
      targets: [{id: 'target-1', entryPrice: '20100'}],
      isSessionLive: true,
      loading: false,
      error: null,
      retryTargets,
    });
    renderPage();

    expect(screen.getByText('Open targets panel')).toBeInTheDocument();
    expect(screen.getByText('Target live table')).toBeInTheDocument();
    expect(screen.getByText('Session KPIs')).toBeInTheDocument();
  });
});
