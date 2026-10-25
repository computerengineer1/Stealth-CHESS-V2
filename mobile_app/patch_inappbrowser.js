const fs = require('fs');
const path = require('path');

// 1. iOS Stealth Patch
const iosSrcDir = path.join(__dirname, 'ios_stealth_patch');
const iosTargets = [
    path.join(__dirname, 'node_modules', 'cordova-plugin-inappbrowser', 'src', 'ios'),
    path.join(__dirname, 'ios', 'capacitor-cordova-ios-plugins', 'sources', 'CordovaPluginInappbrowser')
];
const iosFiles = ['CDVWKInAppBrowser.m', 'CDVWKInAppBrowser.h'];

console.log("Stealth Assist iOS Patching started...");
iosFiles.forEach(file => {
    const srcFile = path.join(iosSrcDir, file);
    if (!fs.existsSync(srcFile)) {
        console.error(`[-] iOS Source file not found: ${srcFile}`);
        return;
    }
    iosTargets.forEach(targetDir => {
        if (!fs.existsSync(targetDir)) return;
        const destFile = path.join(targetDir, file);
        try {
            fs.copyFileSync(srcFile, destFile);
            console.log(`[+] Successfully patched iOS: ${destFile}`);
        } catch (err) {
            console.error(`[-] Failed to copy to ${destFile}:`, err.message);
        }
    });
});

// 2. Android Stealth CSP & Evaluation Patch
const androidSrcDir = path.join(__dirname, 'android_stealth_patch');
const androidTargets = [
    path.join(__dirname, 'node_modules', 'cordova-plugin-inappbrowser', 'src', 'android'),
    path.join(__dirname, 'android', 'capacitor-cordova-android-plugins', 'src', 'main', 'java', 'org', 'apache', 'cordova', 'inappbrowser')
];
const androidFiles = ['InAppBrowser.java'];

console.log("Stealth Assist Android Patching started...");
androidFiles.forEach(file => {
    const srcFile = path.join(androidSrcDir, file);
    if (!fs.existsSync(srcFile)) {
        console.error(`[-] Android Source file not found: ${srcFile}`);
        return;
    }
    androidTargets.forEach(targetDir => {
        if (!fs.existsSync(targetDir)) return;
        const destFile = path.join(targetDir, file);
        try {
            fs.copyFileSync(srcFile, destFile);
            console.log(`[+] Successfully patched Android: ${destFile}`);
        } catch (err) {
            console.error(`[-] Failed to copy to ${destFile}:`, err.message);
        }
    });
});

console.log("Stealth Assist All Platforms Patching completed.");

