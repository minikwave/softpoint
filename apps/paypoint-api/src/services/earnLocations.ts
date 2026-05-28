import { prisma } from '../lib/prisma.js';

export interface EarnLocationRow {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: string;
  lng: string;
  earn_rate: string | null;
}

export async function listEarnLocations(category?: string): Promise<EarnLocationRow[]> {
  const where: { isActive: boolean; category?: string } = { isActive: true };
  if (category?.trim()) where.category = category.trim();

  const rows = await prisma.paypointEarnLocation.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    address: r.address,
    lat: r.lat.toString(),
    lng: r.lng.toString(),
    earn_rate: r.earnRate,
  }));
}
