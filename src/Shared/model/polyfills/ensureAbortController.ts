type AbortListener = (event?: { type: string }) => void;

class SimpleAbortSignal {
  aborted = false;
  reason: unknown = undefined;
  onabort: AbortListener | null = null;
  private listeners = new Set<AbortListener>();

  addEventListener(type: string, listener: AbortListener | null) {
    if (type !== 'abort' || !listener) {
      return;
    }

    this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: AbortListener | null) {
    if (type !== 'abort' || !listener) {
      return;
    }

    this.listeners.delete(listener);
  }

  dispatchEvent(event: { type: string }) {
    if (event.type !== 'abort') {
      return true;
    }

    for (const listener of this.listeners) {
      listener(event);
    }

    this.onabort?.(event);
    return true;
  }

  throwIfAborted() {
    if (this.aborted) {
      throw this.reason ?? new Error('The operation was aborted.');
    }
  }

  abort(reason?: unknown) {
    if (this.aborted) {
      return;
    }

    this.aborted = true;
    this.reason = reason;
    this.dispatchEvent({ type: 'abort' });
  }
}

class SimpleAbortController {
  signal = new SimpleAbortSignal();

  abort(reason?: unknown) {
    this.signal.abort(reason);
  }
}

export function ensureAbortController() {
  const nextGlobal = globalThis as any;

  if (!nextGlobal.AbortController) {
    nextGlobal.AbortController = SimpleAbortController;
  }

  if (!nextGlobal.AbortSignal) {
    nextGlobal.AbortSignal = SimpleAbortSignal;
  }
}
