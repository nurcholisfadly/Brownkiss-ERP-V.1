import { supabase } from '../../../lib/supabase';
import { Recipe, RecipeIngredient } from '../../../types';

export async function getRecipesFromCloud(): Promise<Recipe[]> {
  const { data: recipesData, error: errRecipes } = await supabase
    .from('recipes')
    .select('*')
    .order('name', { ascending: true });

  if (errRecipes) throw errRecipes;
  if (!recipesData) return [];

  const { data: recipeIngData, error: errRecipeIng } = await supabase
    .from('recipe_ingredients')
    .select('*');

  if (errRecipeIng) throw errRecipeIng;

  const relations = recipeIngData || [];

  return recipesData.map((r: any) => {
    const ingredients: RecipeIngredient[] = relations
      .filter((rel: any) => rel.recipe_id === r.id)
      .map((rel: any) => ({
        ingredientId: rel.ingredient_id,
        qtyNeeded: Number(rel.qty_needed),
      }));

    return {
      id: r.id,
      name: r.name,
      price: Number(r.price),
      hpp: Number(r.hpp),
      margin: Number(r.margin),
      emoji: r.emoji || '🍩',
      category: r.category || 'BASE',
      batchOutput: Number(r.batch_output || 1),
      status: r.status || 'Aktif',
      version: Number(r.version || 1),
      history: r.history ? (typeof r.history === 'string' ? JSON.parse(r.history) : r.history) : [],
      ingredients,
    };
  });
}

export async function saveRecipeToCloud(recipe: Recipe): Promise<void> {
  const { error: rErr } = await supabase.from('recipes').upsert({
    id: recipe.id,
    name: recipe.name,
    price: recipe.price,
    hpp: recipe.hpp,
    margin: recipe.margin,
    emoji: recipe.emoji,
    category: recipe.category || 'BASE',
    batch_output: recipe.batchOutput || 1,
    status: recipe.status || 'Aktif',
    version: recipe.version || 1,
    history: recipe.history || [],
  });

  if (rErr) throw rErr;

  const { error: dErr } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', recipe.id);

  if (dErr) throw dErr;

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const relations = recipe.ingredients.map((ing) => ({
      recipe_id: recipe.id,
      ingredient_id: ing.ingredientId,
      qty_needed: ing.qtyNeeded,
    }));

    const { error: iErr } = await supabase.from('recipe_ingredients').insert(relations);
    if (iErr) throw iErr;
  }
}

export async function deleteRecipeFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}
