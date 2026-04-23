module.exports = {
  apps: [
    {
      name: 'ems-server',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
