import { fireEvent, render, screen } from '@testing-library/react';
import AnalyticsErrorNotice from './AnalyticsErrorNotice';

describe('AnalyticsErrorNotice', () => {
  it('shows safe copy and invokes the recovery action', () => {
    const onRetry = jest.fn();
    render(<AnalyticsErrorNotice message="Results could not be loaded." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Results could not be loaded.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
