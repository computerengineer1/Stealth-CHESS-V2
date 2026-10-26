package com.stealthchess.device;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import android.content.Context;
import android.provider.Settings;
import org.json.JSONArray;

public class StealthDevice extends CordovaPlugin {
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext cb) {
        if ("getHwid".equals(action)) {
            String id = Settings.Secure.getString(
                cordova.getActivity().getApplicationContext().getContentResolver(),
                Settings.Secure.ANDROID_ID);
            cb.success(id != null ? id : "");
            return true;
        }
        cb.error("unsupported");
        return false;
    }
}
