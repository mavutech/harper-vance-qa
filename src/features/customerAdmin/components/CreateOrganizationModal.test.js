import React from 'react';
import {render, screen} from '@testing-library/react';
import CreateOrganizationModal from './CreateOrganizationModal';

describe('CreateOrganizationModal', () => {
  it('gives the dialog an accessible name', () => {
    render(
        <CreateOrganizationModal
          show
          onHide={jest.fn()}
          onCreate={jest.fn()}
          submitting={false}
          error={null}
        />,
    );

    expect(screen.getByRole('dialog', {name: 'Add customer organization'})).toBeInTheDocument();
    expect(screen.getByLabelText('Organization name')).toBeVisible();
  });
});
