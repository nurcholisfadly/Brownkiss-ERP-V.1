import { supabase } from '../../../lib/supabase';
import { ProductionBatch } from '../../../types';

export async function getProductionBatchesFromCloud(): Promise<ProductionBatch[]> {
  const { data, error } = await supabase
    .from('production_batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    recipeId: d.recipe_id,
    resep: d.resep,
    qty: Number(d.qty),
    cost: Number(d.cost),
    val: Number(d.val),
    date: d.date,
    status: d.status,
    progress: Number(d.progress),
    operator: d.operator || undefined,
    scheduledDate: d.scheduled_date || undefined,
    wasteQty: d.waste_qty !== null && d.waste_qty !== undefined ? Number(d.waste_qty) : undefined,
    wasteReason: d.waste_reason || undefined,
    usableQty: d.usable_qty !== null && d.usable_qty !== undefined ? Number(d.usable_qty) : undefined,
    isStaged: d.is_staged || false,
    stageTargetQty: d.stage_target_qty ? Number(d.stage_target_qty) : undefined,
    stagedLogs: d.staged_logs
      ? typeof d.staged_logs === 'string'
        ? JSON.parse(d.staged_logs)
        : d.staged_logs
      : [],
    isClosed: Boolean(d.is_closed),
  }));
}

export async function saveProductionBatchToCloud(batch: ProductionBatch): Promise<void> {
  const { error } = await supabase.from('production_batches').upsert({
    id: batch.id,
    recipe_id: batch.recipeId,
    resep: batch.resep,
    qty: batch.qty,
    cost: batch.cost,
    val: batch.val,
    date: batch.date,
    status: batch.status,
    progress: batch.progress,
    operator: batch.operator,
    scheduled_date: batch.scheduledDate,
    waste_qty: batch.wasteQty || 0,
    waste_reason: batch.wasteReason,
    usable_qty: batch.usableQty,
    is_staged: batch.isStaged || false,
    stage_target_qty: batch.stageTargetQty,
    staged_logs: batch.stagedLogs || [],
    is_closed: batch.isClosed || false,
  });

  if (error) throw error;
}

export async function deleteProductionBatchFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('production_batches').delete().eq('id', id);
  if (error) throw error;
}

export async function getDonutInventoryFromCloud(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('donut_inventory')
    .select('*');

  if (error) throw error;
  if (!data) return {};

  const inventory: Record<string, number> = {};
  data.forEach((d: any) => {
    inventory[d.flavor] = Number(d.qty);
  });

  return inventory;
}

export async function saveDonutInventoryToCloud(inventory: Record<string, number>): Promise<void> {
  const records = Object.keys(inventory).map((flavor) => ({
    flavor,
    qty: inventory[flavor],
  }));

  if (records.length === 0) return;

  const { error } = await supabase.from('donut_inventory').upsert(records);
  if (error) throw error;
}
