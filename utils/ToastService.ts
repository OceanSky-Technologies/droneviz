import type { ToastServiceMethods } from "primevue/toastservice";

export enum ToastSeverity {
  Success = "success",
  Info = "info",
  Warn = "warn",
  Error = "error",
  Secondary = "secondary",
  Contrast = "contrast",
}

/**
 * Show a toast message.
 * @param {string} detail The detail of the toast.
 * @param {string} severity The severity of the toast.
 */
export function showToast(detail?: string, severity?: ToastSeverity) {
  const nuxtApp = useNuxtApp();
  const toastService = nuxtApp.$toastService as ToastServiceMethods;

  if (severity === ToastSeverity.Success) {
    console.log(`Success: ${detail}`);
  } else if (severity === ToastSeverity.Info) {
    console.log(`Info: ${detail}`);
  } else if (severity === ToastSeverity.Warn) {
    console.warn(`Warning: ${detail}`);
  } else if (severity === ToastSeverity.Error) {
    console.error(`Error: ${detail}`);
  } else if (severity === ToastSeverity.Secondary) {
    console.log(`Secondary: ${detail}`);
  } else if (severity === ToastSeverity.Contrast) {
    console.log(`Contrast: ${detail}`);
  } else {
    console.error(`Unknown severity ${severity}: ${detail}`);
  }

  if (toastService && typeof toastService.add === "function") {
    toastService.add({
      severity: severity,
      detail: detail,
      life: 5000,
    });
  } else {
    console.error("ToastService not available!");
  }
}
