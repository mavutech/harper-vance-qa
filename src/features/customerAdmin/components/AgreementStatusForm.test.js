import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import AgreementStatusForm from './AgreementStatusForm';

describe('AgreementStatusForm', () => {
  it('records proof fields for an executed customer agreement', async () => {
    const onSave = jest.fn().mockResolvedValue({status: 'executed'});
    render(
        <AgreementStatusForm
          agreement={null}
          submitting={false}
          error={null}
          onSave={onSave}
        />,
    );

    fireEvent.change(screen.getByLabelText('Agreement status'), {target: {value: 'executed'}});
    fireEvent.change(screen.getByLabelText('Document version'), {target: {value: 'MSA-2026-01'}});
    fireEvent.change(screen.getByLabelText('External reference'), {target: {value: 'docusign-123'}});
    fireEvent.change(screen.getByLabelText('Effective date'), {target: {value: '2026-10-10'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save agreement'}));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      status: 'executed',
      documentVersion: 'MSA-2026-01',
      externalReference: 'docusign-123',
      effectiveAt: '2026-10-10',
    }));
  });
});
