import type { Directive } from "vue";

export const rotate: Directive = {
  mounted(el, binding) {
    // Try a default of 1 second if no binding value:
    const duration = binding.value || 1;

    let isRotating = false;
    let isInfinite = false;
    let stopRequested = false;

    // We'll store a promise + resolver for anyone waiting for
    // the rotation to finish (e.g. `await el.stopRotation()`).
    let resolveStop: (() => void) | null = null;
    let stopPromise: Promise<void> | null = null;

    // ----- Event handlers -----
    const finishRotation = () => {
      isRotating = false;
      stopRequested = false;
      el.style.animation = ""; // Clear the animation

      if (resolveStop) {
        resolveStop();
        resolveStop = null;
      }
    };

    const handleAnimationEnd = (evt: AnimationEvent) => {
      // If it's an infinite spin, we ignore `animationend`
      // because infinite animations don’t truly end on their own.
      if (!isRotating || isInfinite) return;

      // Single rotation finished
      finishRotation();
    };

    const handleAnimationIteration = () => {
      if (!isRotating || !isInfinite) return;

      // If user requested to stop, we stop after the current iteration
      if (stopRequested) {
        finishRotation();
      }
    };

    el._handleAnimationEnd = handleAnimationEnd;
    el._handleAnimationIteration = handleAnimationIteration;

    el.addEventListener("animationend", handleAnimationEnd);
    el.addEventListener("animationiteration", handleAnimationIteration);

    // ----- Exposed methods on the element -----

    /**
     * @param continuous - if true => infinite spin, else single spin
     * @returns A promise that resolves *when the rotation stops*.
     */
    el.startRotation = (continuous: boolean = true) => {
      if (isRotating) {
        return stopPromise ?? Promise.resolve();
      }

      isRotating = true;
      isInfinite = continuous;
      stopRequested = false;

      // Create a new promise each time we start a rotation
      stopPromise = new Promise<void>((resolve) => {
        resolveStop = resolve;
      });

      // Apply the animation
      // Make sure @keyframes spin is available globally
      // or via :deep() in a SFC
      if (continuous) {
        el.style.animation = `spin ${duration}s linear infinite`;
      } else {
        el.style.animation = `spin ${duration}s linear`;
      }

      return stopPromise;
    };

    /**
     * Requests an existing rotation to stop once the current iteration is done.
     *
     * - If single rotation, it will stop on `animationend`.
     * - If infinite rotation, it will stop after the next `animationiteration`.
     * @returns A promise that resolves when rotation is fully stopped.
     */
    el.stopRotation = (force: boolean = false) => {
      if (!isRotating) {
        return stopPromise ?? Promise.resolve();
      }

      if (force) {
        finishRotation();
        return Promise.resolve();
      }

      stopRequested = true;
      return stopPromise;
    };

    /**
     * Returns a promise that resolves when the current rotation finishes.
     * If there's no rotation, it resolves immediately.
     */
    el.rotationStopped = () => {
      return stopPromise ?? Promise.resolve();
    };
  },

  unmounted(el) {
    // Clean up
    el.removeEventListener("animationend", el._handleAnimationEnd);
    el.removeEventListener("animationiteration", el._handleAnimationIteration);
    el.stopRotation?.(); // forcibly end if it’s still rotating

    delete el._handleAnimationEnd;
    delete el._handleAnimationIteration;
    delete el.startRotation;
    delete el.stopRotation;
    delete el.rotationStopped;
  },
};
