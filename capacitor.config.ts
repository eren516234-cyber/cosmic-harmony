import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cosmicharmony.app",
  appName: "Cosmic Harmony",
  webDir: "dist-cap",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
  },
};

export default config;