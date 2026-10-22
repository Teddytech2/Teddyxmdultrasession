module.exports = {
  apps: [{
    name: "juness",
    script: "index.js",
    cwd: "/root/web/teddyxmd-session",
    env: {
      PORT: 6898,
      DATAASE_URL: "mongodb+srv://mercymwangangi30_db_user:ypP8wsnSChA38CUk@cluster0.pvc7zqd.mongodb.net/?appName=Cluster0"
    }
  }]
};
