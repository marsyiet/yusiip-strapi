"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/visits/hit',
            handler: 'visit.hit',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/visits/stats',
            handler: 'visit.stats',
            config: { auth: false },
        },
    ],
};
