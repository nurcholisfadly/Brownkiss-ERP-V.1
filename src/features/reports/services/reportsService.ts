import { supabase } from '../../../lib/supabase';
import { CashTransaction, ClosingReport, InventorySnapshot } from '../../../types';

export async function getCashTransactionsFromCloud(): Promise<CashTransaction[]> {
  const { data, error } = await supabase
    .from('cash_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cash_transactions:', error);
    throw error;
  }
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    date: d.date,
    type: d.type,
    amount: Number(d.amount) || 0,
    category: d.category,
    note: d.note || '',
    createdBy: d.created_by,
    paymentMethod: d.payment_method || 'Tunai',
    refId: d.ref_id,
    createdAt: d.created_at,
  }));
}

export async function saveCashTransactionToCloud(tx: CashTransaction): Promise<void> {
  const { error } = await supabase.from('cash_transactions').upsert({
    id: tx.id,
    date: tx.date,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    note: tx.note,
    created_by: tx.createdBy,
    payment_method: tx.paymentMethod || 'Tunai',
    ref_id: tx.refId,
  });
  if (error) throw error;
}

export async function deleteCashTransactionFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
  if (error) throw error;
}

/* ====================================================================
 * CLOSING REPORTS SERVICE
 * ==================================================================== */

export async function getClosingReportsFromCloud(): Promise<ClosingReport[]> {
  const { data, error } = await supabase
    .from('closing_reports')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching closing_reports:', error);
    return [];
  }
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    date: d.date,
    totalPenjualan: Number(d.total_penjualan) || 0,
    totalTunaiSistem: Number(d.total_tunai_sistem) || 0,
    totalQrisSistem: Number(d.total_qris_sistem) || 0,
    kasFisik: Number(d.kas_fisik) || 0,
    selisihKas: Number(d.selisih_kas) || 0,
    closedBy: d.closed_by,
    closedByRole: d.closed_by_role || undefined,
    notes: d.notes || '',
    wasteDonutQty: Number(d.waste_donut_qty) || 0,
    wasteDonutDetails: d.waste_donut_details
      ? typeof d.waste_donut_details === 'string'
        ? JSON.parse(d.waste_donut_details)
        : d.waste_donut_details
      : [],
    status: d.status || 'CLOSED',
    createdAt: d.created_at,
  }));
}

export async function saveClosingReportToCloud(report: ClosingReport): Promise<void> {
  const { error } = await supabase.from('closing_reports').upsert({
    id: report.id,
    date: report.date,
    total_penjualan: report.totalPenjualan,
    total_tunai_sistem: report.totalTunaiSistem,
    total_qris_sistem: report.totalQrisSistem,
    kas_fisik: report.kasFisik,
    selisih_kas: report.selisihKas,
    closed_by: report.closedBy,
    closed_by_role: report.closedByRole,
    notes: report.notes,
    waste_donut_qty: report.wasteDonutQty,
    waste_donut_details: report.wasteDonutDetails || [],
    status: report.status || 'CLOSED',
  });

  if (error) {
    console.error('Error saving closing_report:', error);
    throw error;
  }
}

/* ====================================================================
 * INVENTORY SNAPSHOTS SERVICE
 * ==================================================================== */

export async function getInventorySnapshotsFromCloud(): Promise<InventorySnapshot[]> {
  const { data, error } = await supabase
    .from('inventory_snapshots')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory_snapshots:', error);
    return [];
  }
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    closingReportId: d.closing_report_id,
    date: d.date,
    snapshotData: d.snapshot_data
      ? typeof d.snapshot_data === 'string'
        ? JSON.parse(d.snapshot_data)
        : d.snapshot_data
      : [],
    totalValue: Number(d.total_value) || 0,
    createdAt: d.created_at,
  }));
}

export async function saveInventorySnapshotToCloud(snapshot: InventorySnapshot): Promise<void> {
  const { error } = await supabase.from('inventory_snapshots').upsert({
    id: snapshot.id,
    closing_report_id: snapshot.closingReportId,
    date: snapshot.date,
    snapshot_data: snapshot.snapshotData || [],
    total_value: snapshot.totalValue || 0,
  });

  if (error) {
    console.error('Error saving inventory_snapshot:', error);
    throw error;
  }
}
