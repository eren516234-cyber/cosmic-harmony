type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    App?: {
      addListener?: (
        eventName: string,
        listenerFunc: (event?: { canGoBack?: boolean }) => void,
      ) => { remove?: () => void } | Promise<{ remove?: () => void }>;
      exitApp?: () => void;
    };
    Haptics?: {
      impact?: (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void> | void;
    };
    Filesystem?: {
      writeFile?: (options: {
        path: string;
        data: string;
        directory: "DOCUMENTS" | "CACHE" | "DATA" | "EXTERNAL" | "EXTERNAL_STORAGE";
      }) => Promise<{ uri: string }>;
    };
    Share?: {
      share?: (options: { title?: string; text?: string; url?: string; dialogTitle?: string }) => Promise<void> | void;
    };
  };
};

declare global {
  interface Window {
    Capacitor?: CapacitorBridge;
  }
}

export function isNativeShell() {
  if (typeof window === "undefined") return false;
  return window.Capacitor?.isNativePlatform?.() === true;
}

export function configureNativeShell() {
  if (typeof document === "undefined") return;

  const native = isNativeShell();
  document.documentElement.dataset.nativeShell = native ? "on" : "off";
  document.body.classList.toggle("native-shell", native);

  if (!native) return;

  const setViewportHeight = () => {
    document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
  };
  setViewportHeight();
  window.addEventListener("resize", setViewportHeight);

  const app = window.Capacitor?.Plugins?.App;
  const listener = app?.addListener?.("backButton", (event) => {
    if (event?.canGoBack && window.history.length > 1) {
      window.history.back();
      return;
    }
    app.exitApp?.();
  });

  void Promise.resolve(listener).catch(() => undefined);
}

export function nativeImpact(style: "LIGHT" | "MEDIUM" | "HEAVY" = "LIGHT") {
  if (!isNativeShell()) return;
  void window.Capacitor?.Plugins?.Haptics?.impact?.({ style });
}

export async function writeNativeDownload(blob: Blob, filename: string, title: string) {
  if (!isNativeShell()) return false;

  const filesystem = window.Capacitor?.Plugins?.Filesystem;
  if (!filesystem?.writeFile) return false;

  const data = await blobToBase64(blob);
  const file = await filesystem.writeFile({
    path: filename,
    data,
    directory: "DOCUMENTS",
  });

  const share = window.Capacitor?.Plugins?.Share;
  if (share?.share && file.uri) {
    await share.share({
      title,
      text: title,
      url: file.uri,
      dialogTitle: "Save or share this song",
    });
  }

  return true;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.readAsDataURL(blob);
  });
}
