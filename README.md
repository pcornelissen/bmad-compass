# BMAD Compass

Local web dashboard that visualizes the progress of a BMAD-Method project alongside Claude Code.

## Usage

```bash
cd /path/to/your/bmad-project
npx bmad-compass
```

Flags:
- `--dir <path>`: project directory (default: cwd)
- `--port <n>`: fixed port (default: OS-assigned)
- `--no-open`: don't auto-open browser

## Features

- Visualizes the 4 BMAD phases and ~16 workflows as a swimlane map
- Detects existing artifacts under `_bmad-output/` automatically
- Recommends the next BMAD command to run, with copy button
- Renders markdown previews of artifacts
- Live updates via file watcher (no reload needed)

## Architecture

- Single Node process (Express + ws + chokidar) serves a built React SPA
- No LLM calls, no cloud, no account
- Read-only: never modifies your BMAD project files
