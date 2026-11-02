'use strict';

const crypto = require('crypto');

let storageBackend = null;
let mongoModel = null;
let pgPool = null;
let initPromise = null;

const SESSION_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateShortId() {
    const configured = Number.parseInt(process.env.SESSION_ID_LENGTH || '8', 10);
    const length = Number.isInteger(configured) ? configured : 8;
    if (length < 6 || length > 32) throw new Error('SESSION_ID_LENGTH must be between 6 and 32');
    let out = '';
    while (out.length < length) {
        const bytes = crypto.randomBytes(length * 2);
        for (const byte of bytes) {
            if (byte >= 248) continue;
            out += SESSION_ID_ALPHABET[byte % SESSION_ID_ALPHABET.length];
            if (out.length === length) break;
        }
    }
    return out;
}

function detectDbType(url) {
    if (!url) return null;
    if (/^mongodb(?:\+srv)?:\/\//i.test(url)) return 'mongodb';
    if (/^postgres(?:ql)?:\/\//i.test(url)) return 'postgresql';
    return null;
}

async function init(config) {
    if (storageBackend) return storageBackend;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        const dbType = detectDbType(config.DATABASE_URL);
        if (!dbType) {
            throw new Error('DATABASE_URL is missing or unsupported. Set a MongoDB or PostgreSQL connection string in Heroku Config Vars.');
        }

        if (dbType === 'mongodb') {
            const mongoose = require('mongoose');
            mongoose.set('bufferCommands', false);
            await mongoose.connect(config.DATABASE_URL, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                maxPoolSize: 10,
                minPoolSize: 1,
                retryWrites: true,
            });
            const schema = new mongoose.Schema({
                shortId: { type: String, required: true, unique: true, index: true },
                data: { type: String, required: true },
                createdAt: { type: Date, default: Date.now, index: true },
            }, { versionKey: false });
            mongoModel = mongoose.models.TeddySession || mongoose.model('TeddySession', schema);
            await mongoModel.init();
            storageBackend = 'mongodb';
        } else {
            const { Pool } = require('pg');
            pgPool = new Pool({
                connectionString: config.DATABASE_URL,
                ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 15000,
            });
            pgPool.on('error', err => console.error('[DB] PostgreSQL pool error:', err.message));
            await pgPool.query(`
                CREATE TABLE IF NOT EXISTS teddy_sessions (
                    short_id VARCHAR(32) PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);
            storageBackend = 'postgresql';
        }
        console.log(`[DB] Session storage ready (${storageBackend})`);
        return storageBackend;
    })().catch(async err => {
        initPromise = null;
        storageBackend = null;
        try { const mongoose = require('mongoose'); if (mongoose.connection.readyState) await mongoose.disconnect(); } catch (_) {}
        throw err;
    });

    return initPromise;
}

function isConfigured() { return storageBackend !== null; }

async function saveSession(fullSessionString) {
    if (!isConfigured()) throw new Error('Session database is not ready');
    if (typeof fullSessionString !== 'string' || !fullSessionString.trim()) throw new Error('Session data is empty');

    // Retry only on ID collisions. This also handles concurrent pairings safely.
    for (let attempt = 0; attempt < 8; attempt++) {
        const shortId = generateShortId();
        try {
            if (storageBackend === 'mongodb') {
                await mongoModel.create({ shortId, data: fullSessionString });
            } else {
                await pgPool.query('INSERT INTO teddy_sessions (short_id, data) VALUES ($1, $2)', [shortId, fullSessionString]);
            }
            return shortId;
        } catch (err) {
            const duplicate = err && (err.code === 11000 || err.code === '23505');
            if (!duplicate || attempt === 7) throw err;
        }
    }
    throw new Error('Unable to allocate a unique session ID');
}

function normalizeId(value) {
    let raw = String(value || '').trim();
    const tilde = raw.lastIndexOf('~');
    if (tilde >= 0) raw = raw.slice(tilde + 1);
    if (!/^[a-zA-Z0-9]{6,32}$/.test(raw)) return null;
    return raw;
}

async function getSession(id) {
    if (!isConfigured()) throw new Error('Session database is not ready');
    const safeId = normalizeId(id);
    if (!safeId) return null;
    if (storageBackend === 'mongodb') {
        const doc = await mongoModel.findOne({ shortId: safeId }).select({ data: 1, _id: 0 }).lean();
        return doc ? doc.data : null;
    }
    const result = await pgPool.query('SELECT data FROM teddy_sessions WHERE short_id = $1 LIMIT 1', [safeId]);
    return result.rows[0] ? result.rows[0].data : null;
}

async function updateSessionData(id, data) {
    if (!isConfigured() || typeof data !== 'string' || !data) return false;
    const safeId = normalizeId(id);
    if (!safeId) return false;
    if (storageBackend === 'mongodb') {
        const result = await mongoModel.updateOne({ shortId: safeId }, { $set: { data } });
        return result.matchedCount > 0;
    }
    const result = await pgPool.query('UPDATE teddy_sessions SET data = $1 WHERE short_id = $2', [data, safeId]);
    return result.rowCount > 0;
}

module.exports = { init, isConfigured, saveSession, getSession, updateSessionData, generateShortId };
