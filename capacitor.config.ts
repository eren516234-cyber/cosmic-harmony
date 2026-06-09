import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cosmicharmony.app",
  appName: "Cosmic Harmony",
  webDir: "dist-cap",
  server: {
    androidScheme: "https",
  },
};

export default config;