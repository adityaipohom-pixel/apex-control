# Reference server (optional)

A minimal Flask implementation of the API contract the dashboard expects.
Only needed if you want the PC side running right away — the frontend works
without it (demo mode).

```bash
pip install -r requirements.txt
python apex_server.py            # listens on 0.0.0.0:8080
```

Then open **Settings → PC connection** in the dashboard and set the address to
`http://<this-pc-ip>:8080`, or create `.env.local` in the project root:

```env
VITE_API_URL=http://192.168.1.8:8080
VITE_DEMO_MODE=false
```

## Notes

- `psutil` is optional: without it the server still answers every endpoint with
  placeholder telemetry.
- `mss` enables `POST /api/system/screenshot`.
- Windows only: `Lock PC`, `Sleep`, `Restart`, `Shutdown` use `rundll32` /
  `shutdown` with fixed argument lists (no shell strings).
- Apps are launched from the `APP_REGISTRY` whitelist only. Edit that table to
  match your install paths — the frontend never stores executable paths.
- Set `APEX_TOKEN` to require an `X-APEX-Token` header, then add that header in
  `src/services/api.ts`.
- CORS is enabled for any origin because the dashboard is served from another
  device on the LAN; restrict `Access-Control-Allow-Origin` if you prefer.
