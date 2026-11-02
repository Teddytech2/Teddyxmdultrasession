
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 50900,

    // Debug configuration
    DEBUG: /^(1|true|yes|on)$/i.test(String(process.env.DEBUG || 'false')),

    // Session configuration
    SESSION_PREFIX: process.env.SESSION_PREFIX || 'TEDDY-XMD~',
    SESSION_ID_LENGTH: Number(process.env.SESSION_ID_LENGTH || 8),

    // WhatsApp group
    GC_JID: process.env.GC_JID || 'FncVjQcrmRbL6gzONkzbBa',

    // MongoDB — Heroku Config Vars only
    DATABASE_URL: process.env.DATABASE_URL,

    BOT_REPO: process.env.BOT_REPO || 'https://github.com/Teddyxmd/TEDDY-XMD',

    WA_CHANNEL: process.env.WA_CHANNEL || 'https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n',

    MSG_FOOTER: process.env.MSG_FOOTER || '> *TEDDY-XMD SESSIONS*',

    // External intake
    INTAKE_URL: process.env.INTAKE_URL || '',
    INTAKE_KEY: process.env.INTAKE_KEY || process.env.JUNE_INTAKE_KEY || '',
};
