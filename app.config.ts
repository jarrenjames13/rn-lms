import type { ExpoConfig } from "expo/config";

const isPreview = process.env.APP_VARIANT === "preview";
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";

const config: ExpoConfig = {
  name: isPreview ? "Aurora LMS Preview" : "Aurora LMS",
  slug: "rn-lms",
  version: "1.0.0",
  runtimeVersion: { policy: "appVersion" },
  updates: {
    url: "https://u.expo.dev/4a820703-32cc-44ca-bad1-14fca2d51919",
  },
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: isPreview ? "rnlms-preview" : "rnlms",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    buildNumber: "1",
    bundleIdentifier: isPreview
      ? "com.auroralms.app.preview"
      : "com.auroralms.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
    predictiveBackGestureEnabled: false,
    package: isPreview ? "com.auroralms.app.preview" : "com.auroralms.app",
    googleServicesFile,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    "expo-font",
    "expo-web-browser",
    "expo-image",
    "expo-updates",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#6D4C9B",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appVariant: isPreview ? "preview" : "production",
    router: {},
    eas: { projectId: "4a820703-32cc-44ca-bad1-14fca2d51919" },
  },
  owner: "tormented.13",
};

export default config;
