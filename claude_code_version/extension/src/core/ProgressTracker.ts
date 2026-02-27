/** Progress update data. */
export interface ProgressUpdate {
  readonly loaded: number;
  readonly total: number;
  readonly percentage: number;
}

/** Callback for progress updates. */
export type ProgressListener = (update: ProgressUpdate) => void;

/** Possible states of the progress tracker. */
export type ProgressStatus = 'idle' | 'loading' | 'complete' | 'error';

/**
 * Tracks download/processing progress for model loading and crawling.
 * Can notify a listener on each update.
 */
export class ProgressTracker {
  private loaded = 0;
  private total = 0;
  private listener: ProgressListener | null = null;
  private currentStatus: ProgressStatus = 'idle';

  /** Current loaded amount. */
  public get progress(): number {
    return this.loaded;
  }

  /** Current percentage (0-100). */
  public get percentage(): number {
    if (this.total === 0) {
      return this.currentStatus === 'complete' ? 100 : 0;
    }
    return Math.round((this.loaded / this.total) * 100);
  }

  /** Current status. */
  public get status(): ProgressStatus {
    return this.currentStatus;
  }

  /** Register a listener for progress updates. */
  public onProgress(listener: ProgressListener): void {
    this.listener = listener;
  }

  /** Update progress with current loaded and total values. */
  public update(loaded: number, total: number): void {
    this.loaded = loaded;
    this.total = total;
    this.currentStatus = 'loading';
    this.notify();
  }

  /** Mark progress as complete. */
  public complete(): void {
    this.loaded = this.total || 1;
    this.total = this.total || 1;
    this.currentStatus = 'complete';
    this.notify();
  }

  /** Reset progress to initial state. */
  public reset(): void {
    this.loaded = 0;
    this.total = 0;
    this.currentStatus = 'idle';
  }

  /** Mark progress as errored. */
  public error(): void {
    this.currentStatus = 'error';
  }

  /** Notify the registered listener. */
  private notify(): void {
    this.listener?.({
      loaded: this.loaded,
      total: this.total,
      percentage: this.percentage,
    });
  }
}
