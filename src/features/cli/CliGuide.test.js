import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import CliGuide, {GuideBody} from './CliGuide';
import pages from './docs.generated.json';

beforeEach(() => {window.scrollTo = jest.fn();});
test('a direct guide link renders the maintained parameter reference and navigation', () => {
  render(<MemoryRouter initialEntries={['/docs/cli/commands']}><Routes><Route path="/docs/cli/:slug" element={<CliGuide/>}/></Routes></MemoryRouter>);
  expect(screen.getByRole('heading', {level: 1, name: /command/i})).toBeInTheDocument();
  expect(screen.getByRole('link', {name: /open cli setup/i})).toHaveAttribute('href', '/dashboard/cli');
  expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  expect(pages.find(p=>p.slug==='getting-started').markdown).toContain('Desk Intelligence');
});
test('maintained Markdown renders as escaped content and rejects unsafe link schemes', () => {
  const {container} = render(<GuideBody markdown={'<script>alert(1)</script>\n[unsafe](javascript:alert)\n[Guide](commands.md)'}/>);
  expect(container.querySelector('script')).toBeNull();
  expect(screen.getByRole('link', {name:'unsafe'})).toHaveAttribute('href','/docs/cli');
  expect(screen.getByRole('link', {name:'Guide'})).toHaveAttribute('href','/docs/cli/commands');
});
