# Static assets

Source artwork for the APEX CONTROL wordmark.

- `logo.svg` — the abstract "A" mark (also used as the browser favicon via
  `public/favicon.svg`). The React component `src/components/ui/Logo.tsx`
  renders the same geometry inline so it can follow the active accent colour.

All other visuals in the dashboard (hero banner, album artwork, gauges) are
generated at runtime with CSS/SVG — no third-party image assets are bundled.
