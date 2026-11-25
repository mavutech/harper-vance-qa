import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import CliGuide, {GuideBody} from './CliGuide';
import pages from './docs.generated.json';

beforeEach(() => {window.scrollTo = jest.fn();});
test('public documentation lists the API catalog without client instructions or legacy branding', () => {
  render(<MemoryRouter initialEntries={['/docs/cli']}><Routes><Route path="/docs/cli" element={<CliGuide/>}/></Routes></MemoryRouter>);
  expect(screen.getByRole('heading', {level:1, name:'CLI & API access'})).toBeInTheDocument();
  expect(screen.getByRole('link', {name:/Open CLI setup/})).toHaveAttribute('href','/dashboard/cli');
  expect(screen.getAllByRole('table')).toHaveLength(2);
  const content=JSON.stringify(pages);
  expect(content).toContain('/api/cli/product/daily');
  expect(content).toContain('Desk Intelligence');
  expect(content).not.toMatch(/\bsona\b|sona[-_]|hv login|HV_API_KEY|signInWithPassword|mfaSignIn|npm install/i);
  expect(pages).toHaveLength(1);
});
test('maintained Markdown renders as escaped content and rejects unsafe link schemes', () => {
  const {container}=render(<GuideBody markdown={'<script>alert(1)</script>\n[unsafe](javascript:alert)'}/>);
  expect(container.querySelector('script')).toBeNull();
  expect(screen.getByRole('link',{name:'unsafe'})).toHaveAttribute('href','/docs/cli');
});
test('public catalog uses section navigation, a single title and phone-friendly parameter labels', () => {
  render(<MemoryRouter><CliGuide/></MemoryRouter>);
  expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);
  expect(screen.getByRole('navigation', {name: 'On this page'})).toBeInTheDocument();
  expect(screen.getByRole('link', {name: 'Reporting & live data'})).toHaveAttribute('href', '#reporting-and-live-data');
  expect(screen.getByRole('heading', {level: 2, name: 'Reporting and live data'})).toHaveAttribute('id', 'reporting-and-live-data');
  expect(document.querySelectorAll('td[data-label="Parameters"]')).toHaveLength(8);
});
