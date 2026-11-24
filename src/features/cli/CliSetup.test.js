import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useAccess} from '../access';
import client from '../../api/client';
import CliSetup from './CliSetup';
import copy from './copy.json';

jest.mock('../access', () => ({useAccess: jest.fn()}));
jest.mock('../../api/client', () => ({get: jest.fn()}));
jest.mock('../../layouts/Header', () => () => null);
jest.mock('../../layouts/Footer', () => () => null);

test('an unavailable access service shows a retry error instead of claiming the customer needs an upgrade', () => {
  useAccess.mockReturnValue({access:null, organization:null, loading:false, error:new Error('Unavailable'), refreshAccess:jest.fn()});
  render(<MemoryRouter><CliSetup/></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent(copy.error);
  expect(screen.queryByRole('heading', {name:copy.restricted})).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {name:copy.download})).not.toBeInTheDocument();
  expect(client.get).not.toHaveBeenCalled();
});


test('an expired release session is a retry error rather than an upgrade offer', async () => {
  const organization = {orgId:'desk', name:'Demo', entitlementVersionId:'v1', features:{'cli.access':true}};
  useAccess.mockReturnValue({access:{organizations:[organization]}, organization, loading:false, error:null, refreshAccess:jest.fn()});
  client.get.mockRejectedValueOnce({status:401});
  render(<MemoryRouter><CliSetup/></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent(copy.error);
  expect(screen.queryByRole('heading', {name:copy.restricted})).not.toBeInTheDocument();
});
