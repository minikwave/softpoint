import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** 고정 UUID로 재시드 시 upsert 가능 */
const SEED_PLACES = [
  {
    id: 'a0000001-0000-4000-8000-000000000001',
    name: '달콤카페 강남점',
    category: '카페',
    address: '서울 강남구 테헤란로 123',
    lat: '37.5012000',
    lng: '127.0396000',
    earnRate: '1%',
    sortOrder: 10,
  },
  {
    id: 'a0000002-0000-4000-8000-000000000002',
    name: '편의점페이 역삼점',
    category: '편의점',
    address: '서울 강남구 역삼동 456',
    lat: '37.5001000',
    lng: '127.0364000',
    earnRate: '0.5%',
    sortOrder: 20,
  },
  {
    id: 'a0000003-0000-4000-8000-000000000003',
    name: '헬스푸드 선릉',
    category: '식품',
    address: '서울 강남구 선릉로 789',
    lat: '37.5045000',
    lng: '127.0489000',
    earnRate: '2%',
    sortOrder: 30,
  },
  {
    id: 'a0000004-0000-4000-8000-000000000004',
    name: '책방쌓음 코리아',
    category: '서점',
    address: '서울 서초구 서초동 101',
    lat: '37.4833000',
    lng: '127.0322000',
    earnRate: '1%',
    sortOrder: 40,
  },
];

async function seedPaymentEarnPolicyIfNoneActive() {
  const active = await prisma.paypointPolicy.findFirst({
    where: { policyId: 'PAYMENT_EARN_POLICY', status: 'ACTIVE' },
  });
  if (active) return;
  await prisma.paypointPolicy.upsert({
    where: {
      policyId_version: { policyId: 'PAYMENT_EARN_POLICY', version: 'seed-2026.1' },
    },
    create: {
      policyId: 'PAYMENT_EARN_POLICY',
      version: 'seed-2026.1',
      policyJson: {
        percent_bps: 100,
        min_payment_amount: '1',
        max_earn_per_tx: '50000',
        round_down: true,
      },
      status: 'ACTIVE',
      effectiveFrom: new Date(),
    },
    update: {
      policyJson: {
        percent_bps: 100,
        min_payment_amount: '1',
        max_earn_per_tx: '50000',
        round_down: true,
      },
      status: 'ACTIVE',
      effectiveFrom: new Date(),
    },
  });
  console.log('Seeded PAYMENT_EARN_POLICY (ACTIVE seed-2026.1) for Spend 적립');
}

const SEED_PRODUCTS = [
  {
    id: 'b0000001-0000-4000-8000-000000000001',
    name: '카페 5,000원권',
    description: '제휴 카페에서 사용',
    productType: 'GIFTICON',
    category: '카페/편의점',
    faceValue: '5000',
    pricePaypoint: '5000',
  },
  {
    id: 'b0000002-0000-4000-8000-000000000002',
    name: '식품 10,000원권',
    description: '제휴 식품매장',
    productType: 'ONLINE_VOUCHER',
    category: '카페/편의점',
    faceValue: '10000',
    pricePaypoint: '10000',
  },
  {
    id: 'b0000003-0000-4000-8000-000000000003',
    name: '게임머니 3,000P',
    description: 'MOCK 게임 크레딧',
    productType: 'GAME_CREDIT',
    category: '게임머니',
    faceValue: '3000',
    pricePaypoint: '3000',
  },
  {
    id: 'b0000004-0000-4000-8000-000000000004',
    name: 'AI 크레딧 5,000P',
    description: 'AI 도구 사용권 (데모)',
    productType: 'AI_USAGE_CREDIT',
    category: 'AI 크레딧',
    faceValue: '5000',
    pricePaypoint: '5000',
  },
];

async function seedDemoAccount() {
  await prisma.paypointAccount.upsert({
    where: { userId: 'U1' },
    create: {
      userId: 'U1',
      balance: '100000',
      reservedBalance: '0',
      status: 'ACTIVE',
    },
    update: {
      balance: '100000',
    },
  });
  console.log('Seeded demo account U1 with 100,000 PP');
}

async function seedProducts() {
  for (const p of SEED_PRODUCTS) {
    await prisma.creditProduct.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        provider: 'MOCK',
        productType: p.productType,
        name: p.name,
        description: p.description,
        faceValue: p.faceValue,
        pricePaypoint: p.pricePaypoint,
        category: p.category,
        status: 'ACTIVE',
      },
      update: {
        name: p.name,
        description: p.description,
        faceValue: p.faceValue,
        pricePaypoint: p.pricePaypoint,
        category: p.category,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`Seeded ${SEED_PRODUCTS.length} credit_products`);
}

async function main() {
  await seedDemoAccount();
  for (const p of SEED_PLACES) {
    await prisma.paypointEarnLocation.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        category: p.category,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        earnRate: p.earnRate,
        sortOrder: p.sortOrder,
        isActive: true,
      },
      update: {
        name: p.name,
        category: p.category,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        earnRate: p.earnRate,
        sortOrder: p.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${SEED_PLACES.length} paypoint_earn_locations`);
  await seedProducts();
  await seedPaymentEarnPolicyIfNoneActive();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
