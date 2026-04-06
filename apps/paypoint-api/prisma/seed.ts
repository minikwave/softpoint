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

async function main() {
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
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
