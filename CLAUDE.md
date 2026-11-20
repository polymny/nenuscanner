# NenuScanner

Photo scanning rig driven by a Raspberry Pi 5: a camera (gphoto2), 12 GPIO PWM LEDs, a serial turntable and an HDMI
live preview (MediaMTX). A scenario (poses × LEDs × shutter speeds) is run on an artifact ("objet") to produce an
acquisition; calibrations are acquisitions without artifact. The UI is in French, code and comments in English.

## Layout

- `server/`: Flask + flask-smorest + SQLAlchemy (SQLite), Poetry. `app/{controllers,dtos,models,services}`.
  Served by waitress (`server/__main__.py`, port from `FLASK_RUN_PORT`, default 8000). API docs at `/swagger-ui`.
  - `server/config.py` is gitignored: copy `config.local.py` (dummy camera, no GPIO) for dev. **The Pi has its own
    `config.py`, which differs from `config.darkroom.py`: never overwrite it.**
  - No DB migrations: `poetry run db_init` only runs `create_all`. A new column on an existing table needs a manual
    `ALTER TABLE` on the Pi's `server/data/db.sqlite`.
  - Hardware modules (`leds.py`, `turntable.py`) open GPIO/serial at import: never import the app in a second process
    on the Pi while the service runs.
  - The catch-all route in `server/__init__.py` serves files from `frontend/dist` (favicons, manifest copied from
    `frontend/public`) and falls back to `index.html` for client-side routes.
  - Archive download: `services/acquisition_download_service.py`, format by Corentin (flat `acquisition_XXXXX/`
    folders + normalized `descriptor.yaml`). Splitting archives per artifact is an open question with the client.
- `frontend/`: React + Vite + TanStack Router (file-based, `routeTree.gen.ts` is generated) + TanStack Query,
  shadcn/ui, vine schemas. `src/api/{queries,mutations}`, `src/lib/environment.ts` (API and MediaMTX URLs: localhost in
  dev, `window.location` in prod since Flask serves the frontend).
  - Shared pieces: `components/selectable-card.tsx` (card shell used by acquisition and artifact cards),
    `hooks/use-selection.ts` + `components/acquisition/selection-header.tsx` (multi-selection, select all, sticky
    action bar, Escape, leave-page guard via `useBlocker`), `lib/mediamtx.ts` (player URL that reloads after a stream
    restart).
  - No tooltip component: icon buttons use `title` + `aria-label`.
- `mediamtx.yml` / `mediamtx.sh` / `mediamtx.service`: HDMI capture card (V4L2, MJPEG) → ffmpeg x264 → RTSP → WebRTC
  player on port 8889 (path `cam`). `nenuscanner.service` and `mediamtx.service` are **user** systemd units
  (symlinked from `~/.config/systemd/user` to the repo), linger enabled; mediamtx is `PartOf` nenuscanner, so
  restarting nenuscanner restarts it too.

## Checks

```bash
cd frontend && npx tsc --noEmit -p . && npm run check-lint && npm run check-format
cd server && ruff check . && ruff format --check .
```

The local Poetry env may lack backend deps (e.g. `yaml`), so importing the full app locally can fail: test isolated
logic with a minimal Flask app, or test on the Pi.

## The Pi

- SSH: `ssh pi@nenuscanner.fr` (key auth, passwordless sudo). Checkout in `~/nenuscanner`, served on port 80
  (`http://nenuscanner.fr`), data in `server/data` (~300 GB of images, never copy it).
- **Node trap**: node/npm come from nvm, which is only loaded in the interactive part of `~/.bashrc`. A
  non-interactive `ssh pi@nenuscanner.fr 'cmd'` does not see `node` (`bash -lc` does not help either). Prefix with
  `. ~/.nvm/nvm.sh &&`. A colleague once hand-edited `frontend/dist` because of this: always rebuild instead.
- Turntable (`server/turntable.py`, `/dev/ttyAMA0`, 9600 bauds): Arduino firmware, text commands with the integer
  value glued to the name (`TURN30`, `FAN100`), answers end with `\r\n`. Probed on 2026-11-20: `CONN`→`OK`,
  `MOV?`→`MOV0/1`, `SPEED?`→`SPEED5` (rpm), `FAN?`→`FAN10`, `TEMP?`→`TEMP21`; `FAN0`..`FAN100` (else
  `ERR_MIN`/`ERR_MAX`); `TURN` while the driver is off → `ERR_ENA`. Avoid toggles (`FANX`, old `E`): their state cannot
  be read back. `turn()` powers driver and fan (100 %) on, waits for `MOV0`, then powers both off, because they vibrate
  during shots. The service holds the serial port: stop it before probing the plate by hand.
- Services: `systemctl --user {status,restart} nenuscanner|mediamtx`, logs with `journalctl --user -u <unit>`.
  The backend also restarts MediaMTX via `POST /camera/restart-stream`.
- Clock: no RTC battery and the network blocks NTP (UDP 123). `htpdate` syncs over HTTP (servers in
  `/etc/default/htpdate`: archive.raspberrypi.com, deb.debian.org, www.ntp.org, no Google), started after
  network-online and dnsmasq (`/etc/systemd/system/htpdate.service.d/wait-network.conf`). A wrong clock breaks HTTPS,
  hence `git pull`.
- Power: `vcgencmd pmic_read_adc` gives per-rail I and V (sum I×V ≈ board power, USB devices excluded). Benchmark of
  MediaMTX variants: Trilium note "Mesure conso MediaMTX" (Nenufar > Choses à faire).

## Deploy

Commit and push from the local repo, then on the Pi:

```bash
ssh pi@nenuscanner.fr 'cd ~/nenuscanner && git pull --ff-only && cd frontend && . ~/.nvm/nvm.sh && npm run build'
```

- Frontend-only change: no restart needed (Flask serves `dist` from disk).
- Backend change: also `systemctl --user restart nenuscanner` (cuts the live stream for a few seconds; ask first if
  someone may be using the rig).
- `git pull` refuses if a pulled file is modified on the Pi: compare with `git hash-object`, then `git restore` it.

## Developing against the Pi

The real data only lives on the Pi, so the local frontend talks to the Pi's API through an SSH tunnel:

```bash
ssh -N -L 5000:localhost:80 -L 8889:localhost:8889 pi@nenuscanner.fr
cd frontend && npm run dev   # http://localhost:3000
```

In dev, `environment.ts` targets `127.0.0.1:5000` (API) and `127.0.0.1:8889` (MediaMTX); the API has CORS enabled.
**Everything hits real data**: downloads can be tens of GB, deletions are real.

Backend changes cannot be tested locally with real data: temporarily copy the changed files into the Pi's checkout
(`scp`), restart the service, test, then `git restore` them before the real `git pull`.

Vite HMR sometimes keeps a stale module after several edits to the same file: if behaviour does not match the code,
restart the dev server and reload the page.
