"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Un visiteur est "en ligne" s'il a donné signe de vie dans les 5 dernières minutes
const ONLINE_WINDOW = 5 * 60 * 1000;
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse/i;
// id du visiteur : dernier signe de vie (en mémoire, repart à zéro au redémarrage)
const online = new Map();
// Jour au format AAAA-MM-JJ, à l'heure du Cameroun
const dayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Douala' });
exports.default = ({ strapi }) => ({
    async hit(ctx) {
        const body = ctx.request.body;
        const id = body?.id;
        const agent = String(ctx.request.headers['user-agent'] ?? '');
        ctx.status = 204;
        if (typeof id !== 'string' || id.length === 0 || id.length > 64 || BOT.test(agent)) {
            return;
        }
        online.set(id, Date.now());
        if (body?.count === true) {
            await strapi.db.connection.raw('INSERT INTO visit_days (day, hits) VALUES (?, 1) ON CONFLICT (day) DO UPDATE SET hits = visit_days.hits + 1', [dayKey()]);
        }
    },
    async stats(ctx) {
        const knex = strapi.db.connection;
        const today = dayKey();
        const sum = async (prefix) => {
            const query = knex('visit_days');
            if (prefix)
                query.where('day', 'like', `${prefix}%`);
            const row = await query.sum({ total: 'hits' }).first();
            return Number(row?.total ?? 0);
        };
        const now = Date.now();
        for (const [id, seen] of online) {
            if (now - seen > ONLINE_WINDOW)
                online.delete(id);
        }
        ctx.body = {
            online: online.size,
            today: await sum(today),
            month: await sum(today.slice(0, 7)),
            year: await sum(today.slice(0, 4)),
            total: await sum(),
        };
    },
});
