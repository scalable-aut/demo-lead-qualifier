import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // Replace with your actual project ref from:
  // Trigger.dev dashboard → Project Settings → Project ref
  // Format: proj_xxxxxxxxxxxxxxxx
  project: "proj_asxjldhzkbdbnpkpwvpd",
  dirs: ["./tasks"],
  maxDuration: 60,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
});
