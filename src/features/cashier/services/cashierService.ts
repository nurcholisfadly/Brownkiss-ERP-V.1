import { supabase } from '../../../lib/supabase';
import { Sale } from '../../../types';

export async function getSalesFromCloud(): Promise<Sale[]> {
  const { data: salesData, error: errSales } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (errSales) throw errSales;
  if (!salesData) return [];

  const { data: itemsData, error: errItems } = await supabase
    .from('sale_items')
    .select('*');

  if (errItems) throw errItems;

  const itemsList = itemsData || [];

  return salesData.map((s: any) => {
    const items = itemsList
      .filter((it: any) => it.sale_id === s.id)
      .map((it: any) => ({
        name: it.name,
        qty: Number(it.qty),
        price: Number(it.price),
      }));

    return {
      id: s.id,
      date: s.date,
      total: Number(s.total),
      paymentMethod: s.payment_method,
      customerName: s.customer_name,
      customerAddress: s.customer_address,
      shippingCost: Number(s.shipping_cost || 0),
      invoiceNo: s.invoice_no,
      status: s.status || 'Selesai',
      voidedBy: s.voided_by,
      voidedAt: s.voided_at,
      voidReason: s.void_reason,
      discountType: s.discount_type || 'none',
      discountValue: s.discount_value ? Number(s.discount_value) : 0,
      discountAmount: s.discount_amount ? Number(s.discount_amount) : 0,
      promoName: s.promo_name || undefined,
      cashPaid: s.cash_paid ? Number(s.cash_paid) : 0,
      qrisPaid: s.qris_paid ? Number(s.qris_paid) : 0,
      changeAmount: s.change_amount ? Number(s.change_amount) : 0,
      returnDetails: s.return_details
        ? typeof s.return_details === 'string'
          ? JSON.parse(s.return_details)
          : s.return_details
        : [],
      items,
      isClosed: Boolean(s.is_closed),
    };
  });
}

export async function saveSaleToCloud(sale: Sale): Promise<void> {
  const { error: sErr } = await supabase.from('sales').upsert({
    id: sale.id,
    date: sale.date,
    total: sale.total,
    payment_method: sale.paymentMethod,
    customer_name: sale.customerName || 'Umum',
    customer_address: sale.customerAddress || '-',
    shipping_cost: sale.shippingCost || 0,
    invoice_no: sale.invoiceNo || `INV-${Date.now()}`,
    status: sale.status || 'Selesai',
    voided_by: sale.voidedBy,
    voided_at: sale.voidedAt,
    void_reason: sale.voidReason,
    discount_type: sale.discountType || 'none',
    discount_value: sale.discountValue || 0,
    discount_amount: sale.discountAmount || 0,
    promo_name: sale.promoName,
    cash_paid: sale.cashPaid || 0,
    qris_paid: sale.qrisPaid || 0,
    change_amount: sale.changeAmount || 0,
    return_details: sale.returnDetails || [],
    is_closed: sale.isClosed || false,
  });

  if (sErr) throw sErr;

  const { error: dErr } = await supabase
    .from('sale_items')
    .delete()
    .eq('sale_id', sale.id);

  if (dErr) throw dErr;

  if (sale.items && sale.items.length > 0) {
    const itemsToInsert = sale.items.map((it) => ({
      sale_id: sale.id,
      name: it.name,
      qty: it.qty,
      price: it.price,
      returned_qty: it.returnedQty || 0,
    }));

    const { error: iErr } = await supabase.from('sale_items').insert(itemsToInsert);
    if (iErr) throw iErr;
  }
}

export async function deleteSaleFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}
