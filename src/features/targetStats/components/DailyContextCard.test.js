import { render, screen, fireEvent } from '@testing-library/react';
import DailyContextCard from './DailyContextCard';

describe('DailyContextCard — render guards', () => {
  it('renders nothing for null', () => {
    const { container } = render(<DailyContextCard dayContext={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for undefined', () => {
    const { container } = render(<DailyContextCard dayContext={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for weekend', () => {
    const { container } = render(
      <DailyContextCard dayContext={{ classification: 'weekend' }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for a regular day with no event tags', () => {
    const { container } = render(
      <DailyContextCard
        dayContext={{ classification: 'regular', eventTags: [], severity: 'none' }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when classification is missing', () => {
    const { container } = render(
      <DailyContextCard dayContext={{ eventTags: ['cpi'] }} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('DailyContextCard — summary and variant', () => {
  it('shows holiday_closed as secondary variant with name in summary', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'holiday_closed',
          eventTags: [],
          severity: 'none',
          session: null,
          note: 'Good Friday',
        }}
      />,
    );
    const card = screen.getByTestId('day-context-card');
    expect(card).toHaveAttribute('data-variant', 'secondary');
    expect(screen.getByText(/Session context:/)).toHaveTextContent('Holiday Closed');
  });

  it('shows holiday_early_close as warning variant', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'holiday_early_close',
          eventTags: [],
          severity: 'low',
          session: { open: '09:30', close: '13:00' },
          note: 'Memorial Day',
        }}
      />,
    );
    expect(screen.getByTestId('day-context-card'))
      .toHaveAttribute('data-variant', 'warning');
    expect(screen.getByText(/Session context:/)).toHaveTextContent('Early Close');
    expect(screen.getByText(/Session context:/)).toHaveTextContent('low severity');
  });

  it('shows macro_event with medium severity as danger variant', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'macro_event',
          eventTags: ['cpi'],
          severity: 'medium',
        }}
      />,
    );
    expect(screen.getByTestId('day-context-card'))
      .toHaveAttribute('data-variant', 'danger');
    expect(screen.getByText(/Session context:/)).toHaveTextContent('CPI');
  });

  it('shows expiry with low severity as info variant (not promoted)', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'expiry',
          eventTags: ['futures_roll'],
          severity: 'low',
        }}
      />,
    );
    expect(screen.getByTestId('day-context-card'))
      .toHaveAttribute('data-variant', 'info');
  });
});

describe('DailyContextCard — collapse toggle', () => {
  const earlyClose = {
    classification: 'holiday_early_close',
    eventTags: [],
    severity: 'low',
    session: { open: '09:30', close: '13:00' },
    note: 'Memorial Day',
  };

  it('starts collapsed (aria-expanded=false)', () => {
    render(<DailyContextCard dayContext={earlyClose} />);
    expect(screen.getByTestId('day-context-card-toggle'))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('expands to aria-expanded=true on click', () => {
    render(<DailyContextCard dayContext={earlyClose} />);
    const toggle = screen.getByTestId('day-context-card-toggle');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles back to collapsed on second click', () => {
    render(<DailyContextCard dayContext={earlyClose} />);
    const toggle = screen.getByTestId('day-context-card-toggle');
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('DailyContextCard — body copy', () => {
  it('explains holiday_closed and surfaces the note', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'holiday_closed',
          eventTags: [],
          severity: 'none',
          session: null,
          note: 'Good Friday',
        }}
      />,
    );
    const body = screen.getByTestId('day-context-card-body');
    expect(body).toHaveTextContent(/No regular trading session/i);
    expect(body).toHaveTextContent(/Good Friday/);
  });

  it('reports session hours and delta on early close', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'holiday_early_close',
          eventTags: [],
          severity: 'low',
          session: { open: '09:30', close: '13:00' },
          note: 'Memorial Day',
        }}
      />,
    );
    const body = screen.getByTestId('day-context-card-body');
    expect(body).toHaveTextContent('09:30 – 13:00 ET');
    expect(body).toHaveTextContent(/3\.5 hours/);
    expect(body).toHaveTextContent(/standard 6\.5-hour regular session/i);
    expect(body).toHaveTextContent(/not directly comparable with full-session results/i);
  });

  it('lists event tags and a caution line on macro_event ≥ medium severity', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'macro_event',
          eventTags: ['fomc_rate_decision'],
          severity: 'high',
          note: 'FOMC meeting',
        }}
      />,
    );
    const body = screen.getByTestId('day-context-card-body');
    expect(body).toHaveTextContent(/FOMC Rate Decision/);
    expect(body).toHaveTextContent(/Scheduled events may affect volatility/i);
  });

  it('omits the caution line on expiry with low severity', () => {
    render(
      <DailyContextCard
        dayContext={{
          classification: 'expiry',
          eventTags: ['futures_roll'],
          severity: 'low',
          note: 'Index futures roll',
        }}
      />,
    );
    const body = screen.getByTestId('day-context-card-body');
    expect(body).toHaveTextContent(/Futures Roll/);
    expect(body).not.toHaveTextContent(/Scheduled events may affect volatility/i);
  });
});
