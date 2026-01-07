module.exports = {
  apps: [
    {
      name: 'ai-app',
      cwd: './apps/ai',
      script: 'poetry',
      args: 'run uvicorn api.server:app --env-file .env --port 8001',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PYTHONPATH: '.'
      },
      env_production: {
        NODE_ENV: 'production',
        PYTHONPATH: '.'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'mcp-server',
      cwd: './apps/mcp',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      watch: ['dist'],
      ignore_watch: ['node_modules', 'logs'],
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'backend',
      cwd: './apps/backend',
      script: 'dist/main.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      watch: ['dist'],
      ignore_watch: ['node_modules', 'logs'],
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};