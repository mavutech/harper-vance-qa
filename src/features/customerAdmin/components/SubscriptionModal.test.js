import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import SubscriptionModal from './SubscriptionModal';

describe('SubscriptionModal', () => {
  it('defaults Entity Core to one included product seat', () => {
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

    expect(screen.getByLabelText('Seat limit')).toHaveValue(1);
    expect(screen.getByLabelText('Seat limit')).toHaveAttribute('min', '1');
    expect(screen.getByText('Included product seats for this license: 1.')).toBeInTheDocument();
  });

  it('updates the included seat minimum when the license changes', () => {
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

    fireEvent.change(screen.getByLabelText('License'), {
      target: {value: 'desk_intelligence'},
    });

    expect(screen.getByLabelText('Seat limit')).toHaveValue(5);
    expect(screen.getByLabelText('Seat limit')).toHaveAttribute('min', '5');
    expect(screen.getByText('Included product seats for this license: 5.')).toBeInTheDocument();
  });

  it('allows non-commercial accounts to use one operational seat', () => {
    render(
        <SubscriptionModal
          show
          onHide={jest.fn()}
          onSave={jest.fn()}
          subscription={{licenseCode: 'desk_intelligence', seatLimit: 5, billingMode: 'commercial'}}
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
