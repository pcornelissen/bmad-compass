import chokidar from 'chokidar';
import path from 'node:path';

export interface WatchOptions {
  debounceMs?: number;
  usePolling?: boolean;        // force fs polling instead of native events (more reliable in containers/CI)
}

export interface ProjectWatcher {
  close: () => Promise<void>;
}

export async function watchProject(
  projectRoot: string,
  onChange: (changePath: string) => void,
  opts: WatchOptions = {},
): Promise<ProjectWatcher> {
  const debounceMs = opts.debounceMs ?? 150;
  const targets = [
    path.join(projectRoot, '_bmad'),
    path.join(projectRoot, '_bmad-output'),
  ];

  const watcher = chokidar.watch(targets, {
    ignoreInitial: true,
    persistent: true,
    usePolling: opts.usePolling ?? false,
    interval: 100,
    awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 25 },
  });

  let timer: NodeJS.Timeout | null = null;
  let pendingPath = '';
  const trigger = (changePath: string) => {
    pendingPath = changePath;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onChange(pendingPath);
    }, debounceMs);
  };

  watcher.on('add', trigger);
  watcher.on('change', trigger);
  watcher.on('unlink', trigger);
  watcher.on('addDir', trigger);
  watcher.on('unlinkDir', trigger);

  await new Promise<void>((resolve) => {
    watcher.once('ready', () => resolve());
  });

  return {
    close: async () => {
      if (timer) clearTimeout(timer);
      await watcher.close();
    },
  };
}
