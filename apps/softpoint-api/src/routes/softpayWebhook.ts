import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  earnFromSoftPayWebhook,
  softPayEarnEnabled,
  verifySoftPaySignature,
  type SoftPayWebhookEnvelope,
} from '../services/softpayEarnAdapter.js';
import { recordOutboundEvent } from '../services/eventOutbox.js';

/**
 * SoftPay → SoftPoint inbound webhooks (raw body + HMAC).
 * SoftPG agent credit webhooks are never accepted here.
 */
export async function softpayWebhookRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  fastify.post<{ Body: string | Buffer }>('/hooks/softpay', async (request, reply) => {
    if (!softPayEarnEnabled()) {
      return reply.status(503).send({
        error: {
          code: 'SOFTPAY_EARN_DISABLED',
          message: 'Set SOFTPAY_WEBHOOK_SECRET to enable SoftPay → SoftPoint earn',
        },
      });
    }

    const raw =
      typeof request.body === 'string'
        ? request.body
        : Buffer.isBuffer(request.body)
          ? request.body.toString('utf8')
          : '';
    const sig = request.headers['x-softpay-signature'] as string | undefined;

    if (!verifySoftPaySignature(raw, sig)) {
      return reply.status(401).send({ error: { code: 'INVALID_SIGNATURE', message: 'bad signature' } });
    }

    let envelope: SoftPayWebhookEnvelope;
    try {
      envelope = JSON.parse(raw) as SoftPayWebhookEnvelope;
    } catch {
      return reply.status(400).send({ error: { code: 'INVALID_JSON', message: 'Invalid JSON' } });
    }

    if (!envelope?.type || !envelope?.intentId) {
      return reply.status(400).send({
        error: { code: 'INVALID_ENVELOPE', message: 'type and intentId required' },
      });
    }

    try {
      const out = await earnFromSoftPayWebhook(envelope);
      await recordOutboundEvent({
        type: 'softpay.webhook.received',
        softpayIntentId: envelope.intentId,
        payload: {
          event: envelope.type,
          handled: out.handled,
          skipped: out.skipped,
          reason: out.reason,
        },
      });
      return reply.send({
        ok: true,
        ...out,
        note: 'SoftPoint SP earn only — SoftPG agent credit is out of scope',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
      return reply.status(500).send({ error: { code: msg, message: msg } });
    }
  });

  fastify.get('/hooks/softpay', async (_request, reply) => {
    return reply.send({
      service: 'softpoint-softpay-hook',
      enabled: softPayEarnEnabled(),
      accepts: ['settlement.completed', 'payment.executed', 'receipt.generated'],
      header: 'X-SoftPay-Signature: sha256=…',
      boundary: 'SoftPay loyalty earn only — not SoftPG agent credit',
    });
  });
}
