import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { loadConfig } from './config.js';
import { isLikelyTxid } from './validation.js';
import { verifyTransaction } from './zcashRpc.js';
import { orders } from './orders.js';
import { zsa } from './zsa-routes.js';
import { pool } from './db.js';

const config = loadConfig();
const app = express();

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '16kb' }));
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? [config.frontendOrigin, 'http://localhost:5173', 'http://localhost:5174']
        : config.frontendOrigin,
    methods: ['GET', 'POST'],
  }),
);

app.use('/api/mint', orders);
app.use('/api/zsa', zsa);
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'zec-mint-backend',
    poc: 'zec-payment',
    network: config.zcashNetwork,
  });
});

app.get('/api/poc/payment-config', (_req, res) => {
  if (process.env.ENABLE_PAYMENT_POC !== 'true' || !config.paymentAddress) {
    res.status(503).json({ message: 'Payment diagnostic disabled or recipient missing.' });
    return;
  }
  res.json({
    network: config.zcashNetwork,
    recipient: config.paymentAddress,
    amountZec: config.paymentAmountZec,
    fundingSource: 'shielded',
    requiredConfirmations: config.requiredConfirmations,
  });
});

app.post('/api/poc/transactions/:txid/verify', async (req, res) => {
  if (process.env.ENABLE_PAYMENT_POC !== 'true') {
    res.status(503).json({ message: 'Payment diagnostic disabled.' });
    return;
  }
  const txid = String(req.params.txid ?? '');

  if (!isLikelyTxid(txid)) {
    res.status(400).json({
      error: 'INVALID_TXID',
      message: 'Expected a 64-character hexadecimal Zcash transaction id.',
    });
    return;
  }

  if (!config.rpcUrl) {
    res.status(503).json({
      txid,
      state: 'RPC_ERROR',
      confirmations: 0,
      requiredConfirmations: config.requiredConfirmations,
      blockHash: null,
      error:
        'Zcash RPC verification is not configured yet. Set ZCASH_RPC_URL in backend/.env to enable independent verification.',
    });
    return;
  }

  const result = await verifyTransaction({
    txid,
    rpcUrl: config.rpcUrl,
    rpcUser: config.rpcUser,
    rpcPassword: config.rpcPassword,
    timeoutMs: config.rpcTimeoutMs,
    recipient: config.paymentAddress,
    amountZec: config.paymentAmountZec,
    requiredConfirmations: config.requiredConfirmations,
  });

  // RPC outages are explicitly not transaction failures. The frontend keeps
  // the txid and enters NETWORK_ERROR so the user is not prompted to pay again.
  if (result.state === 'RPC_ERROR') {
    res.status(503).json(result);
    return;
  }

  res.json(result);
});

app.use(((error, _req, res, _next) => {
  void _next;
  const badJson = error instanceof SyntaxError;
  res.status(badJson ? 400 : 503).json({
    message: badJson
      ? 'Invalid JSON body.'
      : 'Service unavailable. Check configuration and server logs.',
    code: badJson ? 'INVALID_JSON' : 'SERVICE_UNAVAILABLE',
  });
  console.error(badJson ? 'INVALID_JSON' : 'SERVICE_UNAVAILABLE');
}) as express.ErrorRequestHandler);
const server = app.listen(config.port, () => {
  console.log(
    `zec-mint backend listening on http://localhost:${config.port} (${config.zcashNetwork})`,
  );
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(() => {
      void pool?.end().finally(() => process.exit(0));
      if (!pool) process.exit(0);
    });
  });
