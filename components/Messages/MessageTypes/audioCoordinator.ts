// Simple in-memory coordinator to ensure only one audio plays at a time
// Not persisted; resets on reload. Works across all MessageAudio instances in memory.

const registry = new Map<symbol, () => Promise<void> | void>();

export function registerAudioInstance(id: symbol, pauseFn: () => Promise<void> | void) {
  registry.set(id, pauseFn);
}

export function unregisterAudioInstance(id: symbol) {
  registry.delete(id);
}

export async function ensureExclusivePlayback(requesterId: symbol) {
  const tasks: Array<Promise<void> | void> = [];
  for (const [id, pause] of registry.entries()) {
    if (id !== requesterId) {
      try {
        tasks.push(pause());
      } catch {
        // ignore individual errors
      }
    }
  }
  await Promise.all(tasks.map((t) => (t instanceof Promise ? t : Promise.resolve())));
} 