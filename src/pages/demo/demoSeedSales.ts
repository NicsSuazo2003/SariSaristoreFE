import type { Sale, SaleItem } from '@/types';
import { demoProducts, demoCustomers } from './demoData';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function receiptNo(date: Date, idx: number) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}-${String(idx).padStart(4, '0')}`;
}

function generateSeedSales(): Sale[] {
  const sales: Sale[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const day = new Date(today);
    day.setDate(day.getDate() - daysAgo);

    // 8-25 sales per day (busier on weekends)
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const salesCount = rand(isWeekend ? 12 : 8, isWeekend ? 25 : 18);

    for (let i = 0; i < salesCount; i++) {
      const saleDate = new Date(day);
      saleDate.setHours(rand(8, 20), rand(0, 59), rand(0, 59), 0);

      // 1-5 items per sale
      const itemCount = rand(1, 5);
      const usedProducts = new Set<string>();
      const items: SaleItem[] = [];

      for (let j = 0; j < itemCount; j++) {
        const p = demoProducts[rand(0, demoProducts.length - 1)];
        if (usedProducts.has(p.id)) continue;
        usedProducts.add(p.id);

        const qty = rand(1, 3);
        items.push({
          id: `si-${saleDate.getTime()}-${j}`,
          sale_id: '',
          product_id: p.id,
          product_name: p.name,
          qty,
          unit_price: p.price,
          subtotal: p.price * qty,
        });
      }

      if (items.length === 0) continue;

      const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

      // Payment method distribution: mostly cash, some GCash, some utang
      const roll = Math.random();
      const method = roll < 0.7 ? 'cash' : roll < 0.9 ? 'gcash' : 'utang';

      const customer =
        method === 'utang'
          ? demoCustomers[rand(0, demoCustomers.length - 1)]
          : null;

      const saleId = `seed-s-${saleDate.getTime()}-${i}`;

      sales.push({
        id: saleId,
        receipt_no: receiptNo(saleDate, i + 1),
        client_id: saleId,
        total_amount: subtotal,
        amount_paid: method === 'utang' ? 0 : subtotal,
        change_amount: 0,
        discount: 0,
        payment_method: method,
        customer_id: customer?.id ?? null,
        note: null,
        is_voided: false,
        created_at: saleDate.toISOString(),
        sale_items: items.map((it) => ({ ...it, sale_id: saleId })),
        customer: customer ?? null,
      });
    }
  }

  return sales.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const demoSeedSales: Sale[] = generateSeedSales();