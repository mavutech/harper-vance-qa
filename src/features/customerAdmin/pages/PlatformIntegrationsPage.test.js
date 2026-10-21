import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import PlatformIntegrationsPage from './PlatformIntegrationsPage';
import {useCustomerOrganizations} from '../hooks/useCustomerOrganizations';
import {useIntegrations} from '../hooks/useIntegrations';

jest.mock('../hooks/useCustomerOrganizations', () => ({useCustomerOrganizations: jest.fn()}));
jest.mock('../hooks/useIntegrations', () => ({useIntegrations: jest.fn()}));
jest.mock('../../../layouts/Header', () => () => null);
jest.mock('../../../layouts/Footer', () => () => null);
jest.mock('../components/IntegrationApiClients', () => () => null);
jest.mock('../components/IntegrationHistory', () => () => null);

it('starts platform-wide and applies a responsible-user filter', () => {
  useCustomerOrganizations.mockReturnValue({organizations: [], selectedOrgId: null});
  useIntegrations.mockReturnValue({items: [], reload: jest.fn(), first: jest.fn()});
  render(<PlatformIntegrationsPage />);
  expect(screen.getByRole('heading', {name: 'Platform integrations'})).toBeInTheDocument();
  expect(useIntegrations).toHaveBeenCalledWith({}, true);
  fireEvent.change(screen.getByLabelText('Responsible user ID'), {target: {value: 'user-123'}});
  fireEvent.click(screen.getByRole('button', {name: 'Apply filters'}));
  expect(useIntegrations).toHaveBeenLastCalledWith({responsibleUserId: 'user-123'}, true);
  expect(screen.queryByRole('button', {name: 'Add paused integration'})).not.toBeInTheDocument();
});
