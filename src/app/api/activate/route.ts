import { NextResponse } from "next/server";

// A simulated persistent in-memory database of license activations
// In a production serverless environment, you'd bind this to Vercel KV, Supabase, or another lightweight store.
// We use a global variable to persist state during the local development server session.
const globalKeys = global as typeof globalThis & {
  activationsDb?: Record<string, string[]>; // licenseKey -> array of deviceIds
};

if (!globalKeys.activationsDb) {
  globalKeys.activationsDb = {
    // Some pre-seeded keys for testing
    "IMC-FREE-TEST-KEY": [],
    "IMC-PRO-LIFETIME-1": [],
    "IMC-PRO-LIFETIME-2": [],
  };
}

const activationsDb = globalKeys.activationsDb;
const JWT_SECRET = process.env.ACTIVATION_SECRET || "its-my-cutlist-super-secret-key-2026-spring";

// Helper to sign token using Web Crypto API (HMAC-SHA256)
async function generateSignature(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, data);
  
  // Convert signature to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  // Return base64 encoded payload + signature
  const base64Payload = btoa(JSON.stringify(payload));
  return `${base64Payload}.${hashHex}`;
}

export async function POST(req: Request) {
  try {
    const { licenseKey, deviceId } = await req.json();

    if (!licenseKey || typeof licenseKey !== "string") {
      return NextResponse.json(
        { error: "License key is required." },
        { status: 400 }
      );
    }

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        { error: "Device ID is required." },
        { status: 400 }
      );
    }

    const key = licenseKey.trim().toUpperCase();

    // Accept IMC- keys for validation
    if (!key.startsWith("IMC-")) {
      return NextResponse.json(
        { error: "Invalid license key format. Keys must start with 'IMC-'" },
        { status: 400 }
      );
    }

    // Initialize key record if not exists (allows dynamic testing of new keys starting with IMC-)
    if (!activationsDb[key]) {
      activationsDb[key] = [];
    }

    const devices = activationsDb[key];
    const deviceIndex = devices.indexOf(deviceId);

    // If device is already registered for this key, or if we have room under the 5-device limit
    if (deviceIndex !== -1 || devices.length < 5) {
      if (deviceIndex === -1) {
        devices.push(deviceId);
      }

      const payload = {
        licenseKey: key,
        deviceId,
        activated: true,
        deviceCount: devices.length,
        timestamp: Date.now(),
      };

      const token = await generateSignature(payload, JWT_SECRET);

      return NextResponse.json({
        success: true,
        message: "License activated successfully.",
        token,
        deviceCount: devices.length,
      });
    } else {
      return NextResponse.json(
        { 
          error: "License limit exceeded. This license key has already been activated on 5 devices.",
          deviceCount: devices.length 
        },
        { status: 403 }
      );
    }
  } catch (error: any) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { error: "Internal server error during activation." },
      { status: 500 }
    );
  }
}
