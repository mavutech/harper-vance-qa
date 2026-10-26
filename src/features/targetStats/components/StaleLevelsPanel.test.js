import { render, screen } from '@testing-library/react';
import StaleLevelsPanel from './StaleLevelsPanel';
import { useUnreachedTargetsWindow } from '../hooks/useUnreachedTargetsWindow';

jest.mock('../hooks/useUnreachedTargetsWindow');

const BULLISH = 7004928;
const BEARISH = 16711680;

const target = (overrides = {}) => ({
  alertId: 'a1',
  colorHighlight: BEARISH,
  targetPrice: '21500',
  originDate: '2026-07-20',
  ...overrides,
});

const mockHook = (value) => {
  useUnreachedTargetsWindow.mockReturnValue({
    targets: [],
    loading: false,
    error: null,
    ...value,
  });
};

describe('StaleLevelsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when disabled', () => {
    mockHook({});
    const { container } = render(<StaleLevelsPanel currentPrice={21500} enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders section header when enabled', () => {
    mockHook({});
    render(<StaleLevelsPanel currentPrice={21500} enabled />);
    expect(screen.getByText('Stale Levels In Range')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockHook({ loading: true });
    render(<StaleLevelsPanel currentPrice={21500} enabled />);
    expect(screen.getByText(/loading recent unresolved levels/i)).toBeInTheDocument();
  });

  test('shows error state', () => {
    mockHook({ error: 'Firebase permission denied.' });
    render(<StaleLevelsPanel currentPrice={21500} enabled />);
    expect(screen.getByText(/firebase permission denied/i)).toBeInTheDocument();
  });

  test('shows waiting state when currentPrice is null', () => {
    mockHook({ targets: [target()] });
    render(<StaleLevelsPanel currentPrice={null} enabled />);
    expect(screen.getByText(/waiting for live price data/i)).toBeInTheDocument();
  });

  test('shows empty state when no targets in range', () => {
    mockHook({
      targets: [target({ targetPrice: '30000' })], // way out of range
    });
    render(<StaleLevelsPanel currentPrice={21500} enabled />);
    expect(screen.getByText(/no unresolved targets/i)).toBeInTheDocument();
  });

  test('renders stale levels sorted by distance from price', () => {
    // Bear targets below price so directional gate passes
    // (bear expects price to fall to target; price must be >= target)
    mockHook({
      targets: [
        target({ alertId: 'far',  targetPrice: '21420', colorHighlight: BEARISH }),
        target({ alertId: 'near', targetPrice: '21480', colorHighlight: BEARISH }),
      ],
    });
    render(<StaleLevelsPanel currentPrice={21500} enabled />);

    expect(screen.getByText('21480.00')).toBeInTheDocument();
    expect(screen.getByText('21420.00')).toBeInTheDocument();

    // Near should appear before far in document order
    const nearEl = screen.getByText('21480.00');
    const farEl = screen.getByText('21420.00');
    // eslint-disable-next-line no-bitwise
    expect(nearEl.compareDocumentPosition(farEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('applies directional gate — bull target approaching upward is shown', () => {
    mockHook({
      targets: [
        target({ alertId: 'bull-above', targetPrice: '21550', colorHighlight: BULLISH }),
        target({ alertId: 'bull-below', targetPrice: '21450', colorHighlight: BULLISH }),
      ],
    });
    render(<StaleLevelsPanel currentPrice={21500} enabled />);
    expect(screen.getByText('21550.00')).toBeInTheDocument();
    expect(screen.queryByText('21450.00')).not.toBeInTheDocument();
  });

  test('renders count and current price header', () => {
    // Bear targets below price so directional gate passes
    mockHook({
      targets: [
        target({ alertId: 'a', targetPrice: '21490', colorHighlight: BEARISH }),
        target({ alertId: 'b', targetPrice: '21480', colorHighlight: BEARISH }),
      ],
    });
    const { container } = render(<StaleLevelsPanel currentPrice={21500} enabled />);
    // The header caption is a single .fs-xs.text-secondary.mb-2 sibling above
    // the list — match on its combined text content.
    const header = container.querySelector('.fs-xs.text-secondary.mb-2');
    expect(header).not.toBeNull();
    expect(header.textContent).toMatch(/Current: 21500\.00/);
    expect(header.textContent).toMatch(/2 levels within/);
  });
});
