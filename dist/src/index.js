"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Chiffres de l'ancien site au jour de la bascule
const SEED = { day: '2026-11-15', today: 621, month: 6096, year: 10805 };
exports.default = {
    register() { },
    async bootstrap({ strapi }) {
        const knex = strapi.db.connection;
        if (!(await knex.schema.hasTable('visit_days'))) {
            await knex.schema.createTable('visit_days', (table) => {
                table.string('day', 10).primary();
                table.integer('hits').notNullable().defaultTo(0);
            });
        }
        const monthStart = `${SEED.day.slice(0, 7)}-01`;
        const yearStart = `${SEED.day.slice(0, 4)}-01-01`;
        // La ligne du 1er janvier sert de repère : les chiffres de départ ne sont ajoutés qu'une fois
        const seeded = await knex('visit_days').where('day', yearStart).first();
        if (seeded)
            return;
        await knex.transaction(async (trx) => {
            // Visites de l'année avant ce mois
            await trx('visit_days').insert({ day: yearStart, hits: SEED.year - SEED.month });
            // Visites du mois avant aujourd'hui
            await trx('visit_days').insert({ day: monthStart, hits: SEED.month - SEED.today });
            // Visites d'aujourd'hui, ajoutées à celles déjà comptées depuis le déploiement
            await trx.raw('INSERT INTO visit_days (day, hits) VALUES (?, ?) ON CONFLICT (day) DO UPDATE SET hits = visit_days.hits + ?', [SEED.day, SEED.today, SEED.today]);
        });
    },
};
