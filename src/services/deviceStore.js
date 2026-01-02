import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "aquavolt_device_v1";

function keyFor(uid) {
  return `${KEY_PREFIX}:${uid || "anonymous"}`;
}

export async function getSavedDevice(uid) {
  try {
    const raw = await AsyncStorage.getItem(keyFor(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveDevice(uid, deviceObj) {
  try {
    await AsyncStorage.setItem(keyFor(uid), JSON.stringify(deviceObj));
    return true;
  } catch {
    return false;
  }
}

// ✅ merge updates into saved device
export async function updateDevice(uid, patch) {
  try {
    const current = (await getSavedDevice(uid)) || {};
    const merged = deepMerge(current, patch);
    await AsyncStorage.setItem(keyFor(uid), JSON.stringify(merged));
    return merged;
  } catch {
    return null;
  }
}

// ✅ helper: switch mode and keep fields consistent
export async function setConnectionType(uid, connectionType) {
  const base = (await getSavedDevice(uid)) || {};
  const next = {
    ...base,
    connectionType, // "wifi" | "bluetooth"
    status: "Online",
    updatedAt: Date.now(),
  };

  // keep some defaults if missing (so UI doesn't break)
  if (!next.name) next.name = "AquaVolt Monitor";
  if (!next.id) next.id = "AquaVolt-ESP32-A1";
  if (!next.model) next.model = "ESP32-WROOM-32";
  if (!next.firmware) next.firmware = "v2.4.1";

  if (connectionType === "wifi") {
    next.wifi = next.wifi || {
      ssid: "HomeNetwork_5G",
      band: "2.4 GHz",
      signalDbm: -45,
      strengthLabel: "Strong (-45 dBm)",
      ip: "192.168.1.142",
    };
  } else {
    next.bluetooth = next.bluetooth || {
      rssi: -52,
      statusLabel: "Connected",
      rangeMeters: 10,
    };
  }

  await saveDevice(uid, next);
  return next;
}

export async function clearDevice(uid) {
  try {
    await AsyncStorage.removeItem(keyFor(uid));
    return true;
  } catch {
    return false;
  }
}

/* ---------------- helpers ---------------- */

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// deep merge so nested wifi/bluetooth updates work
function deepMerge(target, source) {
  if (!isObject(target) || !isObject(source)) return source;
  const out = { ...target };
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];
    out[k] = isObject(tv) && isObject(sv) ? deepMerge(tv, sv) : sv;
  }
  return out;
}
