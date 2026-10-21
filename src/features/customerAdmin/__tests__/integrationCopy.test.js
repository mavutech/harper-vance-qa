import copy from '../locales/integrations.en.json';

it('keeps all integration guidance provider-neutral', () => {
  expect(JSON.stringify(copy)).not.toMatch(/make\.com|telegram|zapier|slack|discord|microsoft teams/i);
});

it('preserves licensed-use restrictions and distinguishes acceptance from final delivery', () => {
  expect(copy.sharingWarning).toContain("not authorized under your organization's license");
  expect(copy.acceptanceNote).toContain('does not confirm delivery to the final recipient');
  expect(copy.endpointHint).toContain('The full address will not be displayed after saving');
});
