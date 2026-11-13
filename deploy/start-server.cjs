/* eslint-disable @typescript-eslint/no-require-imports -- PM2 CommonJS wrapper for the Next standalone server. */
// This file runs only on the EC2 host. The secret is loaded inside the child process,
// after PM2 captures its environment, and is never included in a PM2 dump.
const path = require("node:path");
try {
  process.loadEnvFile("/etc/yakmi/runtime.env");
  if (!process.env.MFDS_SERVICE_KEY?.trim()) throw new Error("missing configuration");
} catch {
  console.error("약MI: /etc/yakmi/runtime.env의 MFDS_SERVICE_KEY 설정을 확인해주세요.");
  process.exit(1);
}
require(path.join(__dirname, "server.js"));

