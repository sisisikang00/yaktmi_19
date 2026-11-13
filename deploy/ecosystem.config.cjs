// PM2 loads the key from the host environment; never place secrets in this tracked file.
module.exports = {
  apps: [{
    name: "yakmi",
    cwd: "/srv/yakmi/current",
    script: "start-server.cjs",
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "600M",
    node_args: "--max-old-space-size=512",
    env: { NODE_ENV: "production", PORT: "3000", HOSTNAME: "127.0.0.1" },
    autorestart: true,
    time: true,
    // Keep the runtime secret out of PM2's saved process environment/dump.
    filter_env: ["MFDS_SERVICE_KEY"],
  }],
};

