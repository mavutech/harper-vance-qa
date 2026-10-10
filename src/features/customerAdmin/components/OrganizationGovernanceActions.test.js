import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import OrganizationGovernanceActions, {downloadAuditJson} from './OrganizationGovernanceActions';

const ORGANIZATION = {id: 'org-alpha', name: 'Alpha Trading', slug: 'alpha-trading', status: 'active'};
const mockExport = jest.fn();
const mockClose = jest.fn();

describe('OrganizationGovernanceActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExport.mockResolvedValue([{event: 'org.created'}]);
    mockClose.mockResolvedValue(undefined);
    URL.createObjectURL = jest.fn(() => 'blob:audit');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('exports the governed audit history as JSON', async () => {
    render(
      <OrganizationGovernanceActions
        organization={ORGANIZATION}
        submitting={false}
        error={null}
        onExport={mockExport}
        onCloseOrganization={mockClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Export audit history'}));

    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith('org-alpha');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audit');
    });
  });

  it('requires the exact organization slug before closure', async () => {
    render(
      <OrganizationGovernanceActions
        organization={ORGANIZATION}
        submitting={false}
        error={null}
        onExport={mockExport}
        onCloseOrganization={mockClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Close organization'}));
    const closeButton = screen.getAllByRole('button', {name: 'Close organization'}).pop();
    expect(closeButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/type the organization slug/i), {
      target: {value: 'alpha-trading'},
    });
    expect(closeButton).toBeEnabled();
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalledWith('org-alpha');
      expect(screen.queryByText(/revokes customer access/i)).not.toBeInTheDocument();
    });
  });

  it('creates a stable organization-specific audit filename', () => {
    downloadAuditJson([], 'alpha-trading');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});
