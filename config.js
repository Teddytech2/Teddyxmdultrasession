require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 50900,
    // set DEBUG=true for full per-event pairing logs (default: quiet)
    DEBUG: /^(1|true|yes|on)$/i.test(String(process.env.DEBUG || '')),
    SESSION_PREFIX: process.env.SESSION_PREFIX || "TEDDY-XMD~",
    GC_JID: process.env.GC_JID || "FncVjQcrmRbL6gzONkzbBa",
    DATABASE_URL: process.env.DATABASE_URL || "mongodb+srv://mercymwangangi30_db_user:ypP8wsnSChA38CUk@cluster0.pvc7zqd.mongodb.net/?appName=Cluster0",
    BOT_REPO: process.env.BOT_REPO || "https://github.com/Teddyxmd/TEDDY-XMD",
    WA_CHANNEL: process.env.WA_CHANNEL || "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n",
    MSG_FOOTER: process.env.MSG_FOOTER || "> *TEDDY-XMD SESSIONS*",
    // Main June session server (dbapi) intake — when set, fresh sessions are
    // pushed there and the returned fleet-wide TEDDY-XMD~ handle is delivered
    // instead of a local one. Leave empty to use local database IDs only.
    INTAKE_URL: process.env.INTAKE_URL || "",
    INTAKE_KEY: process.env.INTAKE_KEY || process.env.JUNE_INTAKE_KEY || "",
};
