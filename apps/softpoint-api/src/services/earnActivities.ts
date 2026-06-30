import { prisma } from '../lib/prisma.js';
import { issueCredit } from './issue.js';

export async function listEarnActivities() {
  const rows = await prisma.earnActivity.findMany({
    where: { status: { in: ['ACTIVE', 'COMING_SOON'] } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    activity_type: r.activityType,
    name_ko: r.nameKo,
    name_en: r.nameEn,
    description_ko: r.descriptionKo,
    description_en: r.descriptionEn,
    reward_label: r.rewardLabel,
    reward_amount: r.rewardAmount?.toString() ?? null,
    status: r.status,
  }));
}

export async function earnFromActivity(params: {
  userId: string;
  activitySlug: string;
  idempotencyKey?: string;
  proof?: Record<string, unknown>;
}) {
  const activity = await prisma.earnActivity.findFirst({
    where: { slug: params.activitySlug, status: 'ACTIVE' },
  });
  if (!activity) {
    throw new Error('ACTIVITY_NOT_FOUND');
  }
  const amount = activity.rewardAmount;
  if (amount == null || BigInt(amount.toString()) <= 0n) {
    throw new Error('ACTIVITY_NOT_REWARDABLE');
  }

  return issueCredit({
    userId: params.userId,
    amount: BigInt(amount.toString()),
    reason: 'ACTIVITY_EARN',
    idempotencyKey: params.idempotencyKey,
    metadata: {
      source: 'earn_activity',
      activity_slug: activity.slug,
      activity_type: activity.activityType,
      proof: params.proof ?? null,
    },
  });
}
