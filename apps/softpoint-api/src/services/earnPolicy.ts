import { PAYMENT_EARN_POLICY_ID } from '@softpoint/domain';
import { prisma } from '../lib/prisma.js';

export async function getActivePaymentEarnPolicy() {
  return prisma.paypointPolicy.findFirst({
    where: { policyId: PAYMENT_EARN_POLICY_ID, status: 'ACTIVE' },
    orderBy: [{ effectiveFrom: 'desc' }, { updatedAt: 'desc' }],
  });
}
