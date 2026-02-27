import { describe, it, expect, vi } from 'vitest';
import { ProgressTracker } from './ProgressTracker';

describe('ProgressTracker', () => {
  it('starts at 0 progress', () => {
    const tracker = new ProgressTracker();
    expect(tracker.progress).toBe(0);
  });

  it('updates progress via update()', () => {
    const tracker = new ProgressTracker();
    tracker.update(50, 100);
    expect(tracker.progress).toBe(50);
  });

  it('calculates percentage correctly', () => {
    const tracker = new ProgressTracker();
    tracker.update(25, 100);
    expect(tracker.percentage).toBe(25);
  });

  it('notifies listener on update', () => {
    const listener = vi.fn();
    const tracker = new ProgressTracker();
    tracker.onProgress(listener);
    tracker.update(30, 100);
    expect(listener).toHaveBeenCalledWith({ loaded: 30, total: 100, percentage: 30 });
  });

  it('complete() sets progress to 100%', () => {
    const tracker = new ProgressTracker();
    tracker.complete();
    expect(tracker.percentage).toBe(100);
  });

  it('reset() sets progress to 0', () => {
    const tracker = new ProgressTracker();
    tracker.update(50, 100);
    tracker.reset();
    expect(tracker.progress).toBe(0);
    expect(tracker.percentage).toBe(0);
  });

  it('status property reflects current state', () => {
    const tracker = new ProgressTracker();
    expect(tracker.status).toBe('idle');
    tracker.update(1, 100);
    expect(tracker.status).toBe('loading');
    tracker.complete();
    expect(tracker.status).toBe('complete');
  });
});
