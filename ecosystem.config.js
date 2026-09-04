module.exports = {
  apps: [
    {
      name: 'equibook-api',
      cwd: '/var/www/html/EquiBook/backend',
      script: '/var/www/html/EquiBook/backend/venv/bin/python',
      args: '-m uvicorn app.main:app --host 10.11.1.135 --port 8080 --proxy-headers',
      interpreter: 'none',
      exec_mode: 'fork', instances: 1, autorestart: true, watch: false,
      max_restarts: 10, min_uptime: '20s', max_memory_restart: '700M',
      env: { PYTHONUNBUFFERED: '1' }, time: true
    },
    {
      name: 'equibook-web',
      cwd: '/var/www/html/EquiBook/frontend',
      script: '/var/www/html/EquiBook/frontend/node_modules/next/dist/bin/next',
      args: 'start -p 6900',
      interpreter: 'node',
      exec_mode: 'fork', instances: 1, autorestart: true, watch: false,
      max_memory_restart: '900M',
      env: { NODE_ENV: 'production' }, time: true
    }
  ]
};
