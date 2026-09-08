import { pool } from './db.js';

export type OrderEvent =
  | 'DEVELOPMENT_RESERVATION_CREATED'
  | 'RESERVATION_DUPLICATE'
  | 'RESERVATION_EXPIRED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_CONFIRMED'
  | 'ISSUANCE_PENDING'
  | 'ISSUANCE_FAILED'
  | 'MINTED'
  | 'REFUND_REQUIRED'
  | 'REFUNDED'
  | 'ZSA_ISSUE_REQUESTED'
  | 'ZSA_ISSUE_FAILED'
  | 'ZSA_TRANSFER_REQUESTED'
  | 'ZSA_TRANSFER_FAILED'
  | 'ZSA_TRANSFER_CONFIRMED';

export async function emitOrderEvent(orderId: string, event: OrderEvent): Promise<void> {
  if (!pool) return;
  await pool.query('INSERT INTO order_events(order_id, event) VALUES($1, $2)', [orderId, event]);
}
