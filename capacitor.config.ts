/// <reference types="@capacitor/local-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emework.learnenglish',
  appName: 'Learn English',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: "#0F5C5C"
    }
  }
};

export default config;
