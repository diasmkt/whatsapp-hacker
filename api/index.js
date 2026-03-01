const app = require('../backend/src/server');

/**
 * VERCEL SERVERLESS HANDLER
 * Este arquivo é o ponto de entrada oficial para a Vercel.
 * Ele importa o app Express e o exporta como um handler compatível.
 */
module.exports = (req, res) => {
    // Redireciona todas as chamadas para o app Express
    return app(req, res);
};
