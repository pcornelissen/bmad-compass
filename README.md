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

## Module Support

BMAD Compass automatically discovers all workflows from your installed BMAD modules by reading `_bmad/_config/manifest.yaml` and each module's `module-help.csv`. When the manifest is absent (e.g. for older projects) it falls back to a built-in workflow list.

For document-heavy workflows (PRD, Architecture, UX Spec) Compass also shows sub-step progress: real markdown sections are listed as done, and a small set of world-knowledge hints suggests sections you might still want to add.

## Architecture

- Single Node process (Express + ws + chokidar) serves a built React SPA
- No LLM calls, no cloud, no account
- Read-only: never modifies your BMAD project files
