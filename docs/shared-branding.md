# Shared branding

The authoritative guide and editable definition live in the backend repository:

- `docs/branding/rebranding-guide.md`
- `functions/brand/brand.json`

This checkout consumes generated, fingerprinted artifacts in `src/config/` and
`public/brand/`. Never manually edit generated artifacts. Export from the backend
with `node functions/scripts/exportBrand.js /absolute/path/to/this/checkout`.
Then run `node scripts/prepareBrand.js` and `npm run check:brand` here.

Localized UI copy references `{brand.fullName}` or `{brand.shortName}`. New
components import `BRAND` or resolved language resources, never a literal company
name. Current product URLs are `/dashboard/targets`, `/dashboard/daily`,
`/dashboard/weekly` and `/dashboard/history`. Old SONA paths remain guarded aliases.

Stats modules and their non-persisted Redux state now use neutral `targetStats`
names. Historical telemetry events and approved legal-document bodies remain
unchanged. Legal entity identity is separate from presentation branding.

Before release, verify the export against the backend source, run tests/build and
review narrow-screen and alternative-name previews. Deploy this dashboard before
the matching backend so new emailed report links resolve. Commit both repositories
as a coordinated release. Production publishing requires separate approval.
