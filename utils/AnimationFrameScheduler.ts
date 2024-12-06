type Task = () => Promise<void>;

export class AnimationFrameScheduler {
  private isRunning: boolean = false;
  private task: Task;

  // Optional minimum delay between task executions in milliseconds
  private minDelay: number | null = null;
  private stopFlag: boolean = false;

  /**
   * Constructs a new scheduler for a task.
   * @param task The task function, which must return a Promise.
   * @param maxFps Maximum frames per second. If null, the task will execute on every animation frame.
   */
  constructor(task: Task, maxFps?: number) {
    this.task = task;
    if (!this.task) {
      throw new Error("Task is not set.");
    }

    if (maxFps !== undefined) this.minDelay = 1000 / maxFps; // Minimum delay in milliseconds
  }

  /**
   * Starts the scheduler. Tasks will execute periodically until the scheduler is stopped.
   */
  async start(): Promise<void> {
    console.log("Starting scheduler");
    this.stopFlag = false;
    this.runTask();
  }

  private async runTask(): Promise<void> {
    if (this.stopFlag) return;

    // if the task is already running, only queue it for execution in the next frame
    if (this.isRunning) {
      requestAnimationFrame(() => this.runTask());
      return;
    }

    let startTime;
    if (this.minDelay !== null) startTime = performance.now();

    this.isRunning = true;

    try {
      await this.task(); // Execute the user-provided task
    } catch (err) {
      console.error("Task encountered an error:", err);
    }

    this.isRunning = false;

    if (this.minDelay === null) {
      requestAnimationFrame(() => this.runTask());
    } else {
      const elapsedTime = performance.now() - startTime!;
      const delay = Math.max(0, this.minDelay - elapsedTime);

      setTimeout(() => requestAnimationFrame(() => this.runTask()), delay);
    }
  }

  /**
   * Stops the scheduler. The task will not execute until start() is called again.
   */
  stop(): void {
    console.log("stopping scheduler");
    this.stopFlag = true;
  }
}
