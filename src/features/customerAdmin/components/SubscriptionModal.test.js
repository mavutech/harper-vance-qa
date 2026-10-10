import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import SubscriptionModal from './SubscriptionModal';

describe('SubscriptionModal', () => {
  it('defaults commercial contracts to the 25-seat minimum', () => {
    render(
        <SubscriptionModal
          show
          onHide={jest.fn()}
          onSave={jest.fn()}
          subscription={null}
          submitting={false}
          error={null}
        />,
    );

    expect(screen.getByLabelText('Seat limit')).toHaveValue(25);
    expect(screen.getByLabelText('Seat limit')).toHaveAttribute('min', '25');
    expect(screen.getByText('Commercial agreements start at 25 seats.')).toBeInTheDocument();
  });

  it('allows non-commercial accounts to use an operational seat limit below 25', () => {
    render(
        <SubscriptionModal
          show
          onHide={jest.fn()}
          onSave={jest.fn()}
          subscription={null}
          submitting={false}
          error={null}
        />,
    );

    fireEvent.change(screen.getByLabelText('Billing mode'), {
      target: {value: 'complimentary'},
    });

    expect(screen.getByLabelText('Seat limit')).toHaveAttribute('min', '1');
  });
});
