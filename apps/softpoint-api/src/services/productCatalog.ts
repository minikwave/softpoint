import { prisma } from '../lib/prisma.js';

export interface ProductRow {
  id: string;
  provider: string;
  product_type: string;
  name: string;
  description: string | null;
  face_value: string;
  price_paypoint: string;
  category: string | null;
  status: string;
}

export async function listCreditProducts(opts?: { category?: string; productType?: string }) {
  const where: { status: string; category?: string; productType?: string } = { status: 'ACTIVE' };
  if (opts?.category?.trim()) where.category = opts.category.trim();
  if (opts?.productType?.trim()) where.productType = opts.productType.trim();

  const rows = await prisma.creditProduct.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return rows.map(
    (p): ProductRow => ({
      id: p.id,
      provider: p.provider,
      product_type: p.productType,
      name: p.name,
      description: p.description,
      face_value: p.faceValue.toString(),
      price_paypoint: p.pricePaypoint.toString(),
      category: p.category,
      status: p.status,
    })
  );
}

export async function getCreditProductById(id: string) {
  const p = await prisma.creditProduct.findUnique({ where: { id } });
  if (!p || p.status !== 'ACTIVE') return null;
  return {
    id: p.id,
    provider: p.provider,
    product_type: p.productType,
    name: p.name,
    description: p.description,
    face_value: p.faceValue.toString(),
    price_paypoint: p.pricePaypoint.toString(),
    category: p.category,
    status: p.status,
  } satisfies ProductRow;
}
