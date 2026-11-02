module.exports = {
  apps: [{
    name: 'teddyxmd-session',
    script: 'index.js',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 6898,
      DATABASE_URL: process.env.DATABASE_URL || '',
      SESSION_PREFIX: process.env.SESSION_PREFIX || 'TEDDY-XMD~'
    }
  }]
};
