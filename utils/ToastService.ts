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
 * @param {string} summary The summary of the toast.
 * @param {string} detail The detail of the toast.
 * @param {string} severity The severity of the toast.
 */
export function showToast(
  summary: string,
  detail: string,
  severity: ToastSeverity,
) {
  const nuxtApp = useNuxtApp();
  const toastService = nuxtApp.$toastService as ToastServiceMethods;

  if (severity === ToastSeverity.Success) {
    console.log(`Success: ${summary} - ${detail}`);
  } else if (severity === ToastSeverity.Info) {
    console.log(`Info: ${summary} - ${detail}`);
  } else if (severity === ToastSeverity.Warn) {
    console.warn(`Warning: ${summary} - ${detail}`);
  } else if (severity === ToastSeverity.Error) {
    console.error(`Error: ${summary} - ${detail}`);
  } else if (severity === ToastSeverity.Secondary) {
    console.log(`Secondary: ${summary} - ${detail}`);
  } else if (severity === ToastSeverity.Contrast) {
    console.log(`Contrast: ${summary} - ${detail}`);
  } else {
    console.error(`Unknown severity ${severity}: ${summary} - ${detail}`);
  }

  if (toastService && typeof toastService.add === "function") {
    toastService.add({
      severity: severity,
      summary: summary,
      detail: detail,
      life: 3000,
    });
  } else {
    console.error("ToastService not available!");
  }
}
