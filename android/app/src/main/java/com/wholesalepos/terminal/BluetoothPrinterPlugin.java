package com.wholesalepos.terminal;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        )
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    private static final String TAG = "BluetoothPrinterPlugin";
    // Serial Port Profile (SPP) Standard UUID for ESC/POS Thermal Printers
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothAdapter getAdapter() {
        if (getContext() == null) return null;
        BluetoothManager bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager != null) {
            return bluetoothManager.getAdapter();
        }
        return BluetoothAdapter.getDefaultAdapter();
    }

    private boolean hasConnectPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        } else {
            return true; // Granted automatically in manifest for Android 11 and lower
        }
    }

    private boolean hasScanPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED;
        } else {
            return ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
    }

    @PluginMethod
    public void checkAndRequestPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        List<String> logs = new ArrayList<>();

        logs.add("[Android BT] Checking SDK level: API " + Build.VERSION.SDK_INT);

        boolean connectGranted = hasConnectPermission();
        boolean scanGranted = hasScanPermission();

        logs.add("[Android BT] BLUETOOTH_CONNECT permission: " + (connectGranted ? "GRANTED" : "NOT_GRANTED"));
        logs.add("[Android BT] BLUETOOTH_SCAN/LOCATION permission: " + (scanGranted ? "GRANTED" : "NOT_GRANTED"));

        if (!connectGranted || !scanGranted) {
            logs.add("[Android BT] Requesting missing Bluetooth permissions from system...");
            requestPermissionForAlias("bluetooth", call, "permissionCallback");
            return;
        }

        ret.put("granted", true);
        ret.put("logs", new JSArray(logs));
        call.resolve(ret);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        List<String> logs = new ArrayList<>();
        boolean granted = hasConnectPermission();
        logs.add("[Android BT] Permission request result: " + (granted ? "GRANTED BY USER" : "DENIED BY USER"));
        ret.put("granted", granted);
        ret.put("logs", new JSArray(logs));
        call.resolve(ret);
    }

    @PluginMethod
    public void getBluetoothStatus(PluginCall call) {
        JSObject ret = new JSObject();
        List<String> logs = new ArrayList<>();

        logs.add("[Android BT] Checking Bluetooth adapter state...");
        BluetoothAdapter adapter = getAdapter();

        if (adapter == null) {
            logs.add("[Android BT] ERROR: Bluetooth hardware adapter is null/unavailable.");
            ret.put("available", false);
            ret.put("enabled", false);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        boolean enabled = adapter.isEnabled();
        boolean connectPermission = hasConnectPermission();

        logs.add("[Android BT] Hardware Adapter: Present");
        logs.add("[Android BT] Adapter State: " + (enabled ? "ENABLED (ON)" : "DISABLED (OFF)"));
        logs.add("[Android BT] Permission Status: " + (connectPermission ? "GRANTED" : "NEEDS_PERMISSION"));

        ret.put("available", true);
        ret.put("enabled", enabled);
        ret.put("permissionGranted", connectPermission);
        ret.put("logs", new JSArray(logs));
        call.resolve(ret);
    }

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        JSObject ret = new JSObject();
        JSArray devicesArray = new JSArray();
        List<String> logs = new ArrayList<>();

        logs.add("[Android BT] Enumerating bonded/paired Bluetooth devices...");

        if (!hasConnectPermission()) {
            logs.add("[Android BT] WARNING: Missing BLUETOOTH_CONNECT permission.");
            ret.put("success", false);
            ret.put("error", "Missing BLUETOOTH_CONNECT permission on Android 12+.");
            ret.put("devices", devicesArray);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        BluetoothAdapter adapter = getAdapter();
        if (adapter == null) {
            logs.add("[Android BT] ERROR: Bluetooth adapter is null.");
            ret.put("success", false);
            ret.put("error", "Bluetooth hardware adapter is not available.");
            ret.put("devices", devicesArray);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        if (!adapter.isEnabled()) {
            logs.add("[Android BT] WARNING: Bluetooth adapter is currently turned off.");
            ret.put("success", false);
            ret.put("error", "Bluetooth is disabled in Android settings.");
            ret.put("devices", devicesArray);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        try {
            Set<BluetoothDevice> pairedDevices = adapter.getBondedDevices();
            int count = (pairedDevices != null) ? pairedDevices.size() : 0;
            logs.add("[Android BT] Found " + count + " paired Bluetooth device(s).");

            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    String name = device.getName();
                    if (name == null || name.trim().isEmpty()) {
                        name = "Paired Device (" + device.getAddress() + ")";
                    }
                    JSObject devObj = new JSObject();
                    devObj.put("id", device.getAddress());
                    devObj.put("name", name);
                    devObj.put("address", device.getAddress());
                    devObj.put("bonded", true);
                    devObj.put("type", device.getType());
                    devicesArray.put(devObj);

                    logs.add(" -> Found Paired Printer: " + name + " [" + device.getAddress() + "]");
                }
            }

            ret.put("success", true);
            ret.put("devices", devicesArray);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
        } catch (SecurityException se) {
            logs.add("[Android BT] SecurityException querying bonded devices: " + se.getMessage());
            ret.put("success", false);
            ret.put("error", "Bluetooth security exception: " + se.getMessage());
            ret.put("devices", devicesArray);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
        } catch (Exception e) {
            logs.add("[Android BT] Exception querying bonded devices: " + e.getMessage());
            ret.put("success", false);
            ret.put("error", "Failed querying paired devices: " + e.getMessage());
            ret.put("devices", devicesArray);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void printRawBytes(PluginCall call) {
        String address = call.getString("address");
        String base64Data = call.getString("bytesBase64");

        List<String> logs = new ArrayList<>();
        JSObject ret = new JSObject();

        logs.add("[Android BT] Initiating direct ESC/POS printer stream...");

        if (address == null || address.trim().isEmpty()) {
            logs.add("[Android BT] ERROR: Target device MAC address is empty.");
            ret.put("success", false);
            ret.put("error", "No Bluetooth printer address provided.");
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        if (base64Data == null || base64Data.trim().isEmpty()) {
            logs.add("[Android BT] ERROR: Print payload buffer is empty.");
            ret.put("success", false);
            ret.put("error", "Empty print payload buffer.");
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        byte[] payload;
        try {
            payload = Base64.decode(base64Data, Base64.DEFAULT);
            logs.add("[Android BT] Decoded " + payload.length + " bytes of ESC/POS commands.");
        } catch (Exception e) {
            logs.add("[Android BT] ERROR: Failed decoding base64 payload: " + e.getMessage());
            ret.put("success", false);
            ret.put("error", "Invalid base64 payload: " + e.getMessage());
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        if (!hasConnectPermission()) {
            logs.add("[Android BT] ERROR: Missing BLUETOOTH_CONNECT permission.");
            ret.put("success", false);
            ret.put("error", "Missing Bluetooth permission to connect.");
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        BluetoothAdapter adapter = getAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            logs.add("[Android BT] ERROR: Bluetooth adapter disabled or unavailable.");
            ret.put("success", false);
            ret.put("error", "Bluetooth adapter is turned off or unavailable.");
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        // Cancel discovery prior to socket connection for maximum stability
        try {
            if (adapter.isDiscovering()) {
                adapter.cancelDiscovery();
                logs.add("[Android BT] Cancelled active discovery scan for connection speed.");
            }
        } catch (Exception ignored) {}

        BluetoothDevice device;
        try {
            device = adapter.getRemoteDevice(address);
            String devName = device.getName() != null ? device.getName() : "ESC/POS Printer";
            logs.add("[Android BT] Selected Device: " + devName + " (" + address + ")");
        } catch (Exception e) {
            logs.add("[Android BT] ERROR: Invalid MAC address: " + address);
            ret.put("success", false);
            ret.put("error", "Invalid Bluetooth MAC address: " + address);
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
            return;
        }

        BluetoothSocket socket = null;
        OutputStream outStream = null;

        try {
            logs.add("[Android BT] Creating RFCOMM Socket with SPP UUID (00001101-0000-1000-8000-00805F9B34FB)...");
            socket = device.createRfcommSocketToServiceRecord(SPP_UUID);

            logs.add("[Android BT] Connecting socket to " + address + "...");
            try {
                socket.connect();
                logs.add("[Android BT] Socket connected successfully!");
            } catch (Exception e) {
                logs.add("[Android BT] Standard SPP connect attempt failed (" + e.getMessage() + "), trying fallback RFCOMM socket reflection...");
                try {
                    Method m = device.getClass().getMethod("createRfcommSocket", new Class[] { int.class });
                    socket = (BluetoothSocket) m.invoke(device, 1);
                    socket.connect();
                    logs.add("[Android BT] Fallback RFCOMM socket connected successfully!");
                } catch (Exception ex) {
                    throw new Exception("Socket connection failed: " + e.getMessage() + " | Fallback failed: " + ex.getMessage());
                }
            }

            outStream = socket.getOutputStream();
            logs.add("[Android BT] Sending " + payload.length + " bytes of ESC/POS payload...");

            // Send in 512-byte packets
            int chunkSize = 512;
            for (int offset = 0; offset < payload.length; offset += chunkSize) {
                int len = Math.min(chunkSize, payload.length - offset);
                outStream.write(payload, offset, len);
                outStream.flush();
            }

            logs.add("[Android BT] Transmission complete. Flushing hardware buffer...");
            Thread.sleep(350);

            ret.put("success", true);
            ret.put("message", "Thermal receipt printed successfully!");
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Bluetooth print error:", e);
            logs.add("[Android BT] ERROR during socket connection or transmission: " + e.getMessage());
            ret.put("success", false);
            ret.put("error", "Print failed: " + e.getMessage());
            ret.put("logs", new JSArray(logs));
            call.resolve(ret);
        } finally {
            if (outStream != null) {
                try { outStream.close(); } catch (Exception ignored) {}
            }
            if (socket != null) {
                try {
                    socket.close();
                    logs.add("[Android BT] Closed Bluetooth socket cleanly.");
                } catch (Exception ignored) {}
            }
        }
    }
}
