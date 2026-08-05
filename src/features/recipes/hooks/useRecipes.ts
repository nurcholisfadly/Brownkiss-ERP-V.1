import { useState, useMemo } from 'react';
import { Recipe, RecipeVersion, Ingredient, ProductionBatch } from '../../../types';

export interface UseRecipesOptions {
  recipes: Recipe[];
  ingredients: Ingredient[];
  batches?: ProductionBatch[];
  onAddRecipe: (newRecipe: Recipe) => void;
  onUpdateRecipe?: (updatedRecipe: Recipe) => void;
  onDeleteRecipe?: (id: string) => void;
  onUpdateIngredient?: (updated: Ingredient) => void;
}

export function useRecipes({
  recipes,
  ingredients,
  batches = [],
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onUpdateIngredient,
}: UseRecipesOptions) {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // View Mode: Standard Recipe List vs HPP Simulation Sandbox
  const [viewMode, setViewMode] = useState<'list' | 'simulasi'>('list');

  // Filtering State
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'AKTIF' | 'NONAKTIF' | 'BASE' | 'TOPPING' | 'PACKAGING' | 'RESELLER' | 'LAINNYA'
  >('ALL');

  // SIMULASI HPP STATE (SANDBOX)
  const [simulatedPrices, setSimulatedPrices] = useState<Record<string, number>>({});
  const [selectedSimRecipeId, setSelectedSimRecipeId] = useState<string>('ALL');

  // Map of ingredients for fast lookup
  const ingredientMap = useMemo(() => {
    return new Map(ingredients.map((ing) => [ing.id, ing]));
  }, [ingredients]);

  // Reset or initialize simulation prices based on current warehouse prices
  const handleResetSimulation = () => {
    const initialMap: Record<string, number> = {};
    ingredients.forEach((ing) => {
      initialMap[ing.id] = ing.costPerUnit;
    });
    setSimulatedPrices(initialMap);
  };

  // Initialize simulation prices if empty
  useMemo(() => {
    if (Object.keys(simulatedPrices).length === 0 && ingredients.length > 0) {
      handleResetSimulation();
    }
  }, [ingredients]);

  // Batch update percentage change in simulation
  const handleApplyPercentageChangeToSimulation = (percentage: number) => {
    const updated: Record<string, number> = {};
    ingredients.forEach((ing) => {
      const current = simulatedPrices[ing.id] ?? ing.costPerUnit;
      updated[ing.id] = Math.round(current * (1 + percentage / 100));
    });
    setSimulatedPrices(updated);
  };

  // Apply simulated prices permanently to warehouse inventory
  const handleCommitSimulatedPricesToWarehouse = () => {
    if (!onUpdateIngredient) {
      alert('Fungsi pembaruan bahan tidak tersedia.');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menerapkan harga beli simulasi ini ke data asli di Gudang Bahan Baku?')) {
      return;
    }

    let updatedCount = 0;
    ingredients.forEach((ing) => {
      const simPrice = simulatedPrices[ing.id];
      if (simPrice !== undefined && simPrice !== ing.costPerUnit) {
        onUpdateIngredient({
          ...ing,
          costPerUnit: simPrice,
        });
        updatedCount++;
      }
    });

    alert(`Berhasil memperbarui harga beli untuk ${updatedCount} bahan baku di Gudang!`);
  };

  // Toggle Recipe Status (Aktif <-> Nonaktif)
  const handleToggleRecipeStatus = (recipe: Recipe) => {
    if (!onUpdateRecipe) return;

    const newStatus = recipe.status === 'Nonaktif' ? 'Aktif' : 'Nonaktif';
    const updatedRecipe: Recipe = {
      ...recipe,
      status: newStatus,
    };

    onUpdateRecipe(updatedRecipe);
  };

  // Restore previous version
  const handleRestoreVersion = (recipe: Recipe, versionItem: RecipeVersion) => {
    if (!onUpdateRecipe) return;

    if (!confirm(`Apakah Anda yakin ingin memulihkan resep "${recipe.name}" ke versi v${versionItem.version}?`)) {
      return;
    }

    const currentVersion = recipe.version || 1;
    const nextVersion = currentVersion + 1;

    const snapshot: RecipeVersion = {
      version: currentVersion,
      date:
        new Date().toLocaleDateString('id-ID') +
        ' ' +
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      hpp: recipe.hpp,
      price: recipe.price,
      margin: recipe.margin,
      batchOutput: recipe.batchOutput || 1,
      ingredients: [...recipe.ingredients],
      note: `Dipulihkan dari v${versionItem.version}`,
      updatedBy: 'Sistem ERP',
    };

    const restoredRecipe: Recipe = {
      ...recipe,
      price: versionItem.price,
      hpp: versionItem.hpp,
      margin: versionItem.margin,
      batchOutput: versionItem.batchOutput,
      ingredients: [...versionItem.ingredients],
      version: nextVersion,
      history: [snapshot, ...(recipe.history || [])],
    };

    onUpdateRecipe(restoredRecipe);
    setSelectedRecipeForDetail(restoredRecipe);
    alert(`Resep "${recipe.name}" berhasil dipulihkan ke versi v${versionItem.version}!`);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    if (!onDeleteRecipe) return;

    // Check if recipe is referenced in active production batches
    const activeBatches = (batches || []).filter(
      (b) =>
        (b.status === 'Diproses' || b.status === 'Menunggu') &&
        (b.resep === recipe.name || (b as any).recipeId === recipe.id)
    );

    if (activeBatches.length > 0) {
      const batchList = activeBatches
        .map((b) => `• Batch #${b.id} - ${b.resep} (${b.qty} pcs) [Status: ${b.status}]`)
        .join('\n');
      alert(
        `Gagal Menghapus Resep!\n\nResep "${recipe.name}" sedang digunakan oleh ${activeBatches.length} batch produksi yang aktif:\n\n${batchList}\n\nSilakan selesaikan atau batalkan batch produksi tersebut terlebih dahulu.`
      );
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus resep "${recipe.name}"?`)) {
      onDeleteRecipe(recipe.id);
    }
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'AKTIF') return r.status !== 'Nonaktif';
      if (activeTab === 'NONAKTIF') return r.status === 'Nonaktif';
      return r.category === activeTab;
    });
  }, [recipes, activeTab]);

  return {
    showAddModal,
    setShowAddModal,
    selectedRecipeForDetail,
    setSelectedRecipeForDetail,
    editingRecipe,
    setEditingRecipe,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    simulatedPrices,
    setSimulatedPrices,
    selectedSimRecipeId,
    setSelectedSimRecipeId,
    ingredientMap,
    filteredRecipes,
    handleResetSimulation,
    handleApplyPercentageChangeToSimulation,
    handleCommitSimulatedPricesToWarehouse,
    handleToggleRecipeStatus,
    handleRestoreVersion,
    handleDeleteRecipe,
  };
}
