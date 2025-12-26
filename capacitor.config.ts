import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.upkyp.app',
    appName: 'Upkyp',
    webDir: 'out', // ignored when using server.url
    server: {
        url: 'https://app.upkyp.com',
        cleartext: false
    }
};

export default config;
