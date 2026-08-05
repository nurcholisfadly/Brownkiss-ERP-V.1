import { supabase } from '../../../lib/supabase';
import { Ingredient, IngredientPurchase } from '../../../types';

export async function getIngredientsFromCloud(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    qty: Number(d.qty),
    unit: d.unit,
    minQty: Number(d.min_qty),
    costPerUnit: Number(d.cost_per_unit),
  }));
}

export async function saveIngredientsToCloud(ingredients: Ingredient[]): Promise<void> {
  if (ingredients.length === 0) return;

  const records = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    qty: i.qty,
    unit: i.unit,
    min_qty: i.minQty,
    cost_per_unit: i.costPerUnit,
  }));

  const { error } = await supabase.from('ingredients').upsert(records);
  if (error) throw error;
}

export async function deleteIngredientFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  if (error) throw error;
}

export async function getIngredientPurchasesFromCloud(): Promise<IngredientPurchase[]> {
  const { data, error } = await supabase
    .from('ingredient_purchases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    ingredientId: d.ingredient_id,
    ingredientName: d.ingredient_name,
    date: d.date,
    type: d.type || 'RESTOCK',
    qtyAdded: Number(d.qty_added || 0),
    unit: d.unit,
    costPerUnit: Number(d.cost_per_unit || 0),
    totalCost: Number(d.total_cost || 0),
    note: d.note || '',
    createdAt: d.created_at,
  }));
}

export async function saveIngredientPurchaseToCloud(purchase: IngredientPurchase): Promise<void> {
  const { error } = await supabase.from('ingredient_purchases').upsert({
    id: purchase.id,
    ingredient_id: purchase.ingredientId,
    ingredient_name: purchase.ingredientName,
    date: purchase.date,
    type: purchase.type,
    qty_added: purchase.qtyAdded,
    unit: purchase.unit,
    cost_per_unit: purchase.costPerUnit,
    total_cost: purchase.totalCost,
    note: purchase.note || '',
  });

  if (error) throw error;
}

export async function deleteIngredientPurchaseFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('ingredient_purchases').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkUpdateIngredientsStockCloud(updates: { id: string; qty: number }[]): Promise<void> {
  if (updates.length === 0) return;

  const { error } = await supabase.rpc('bulk_update_ingredients_stock', {
    updates: updates
  });

  if (error) {
    console.error('Error invoking RPC bulk_update_ingredients_stock:', error);
    throw error;
  }
}
