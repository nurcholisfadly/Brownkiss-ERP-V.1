import React from 'react';
import { Recipe, Ingredient, ProductionBatch } from '../../../types';
import { BookOpen, Plus, FlaskConical } from 'lucide-react';
import { useRecipes } from '../hooks/useRecipes';

import RecipeCard from './RecipeCard';
import RecipeDetailModal from './RecipeDetailModal';
import RecipeFormModal from './RecipeFormModal';
import HppSimulationSandbox from './HppSimulationSandbox';

interface RecipeManagerProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  batches?: ProductionBatch[];
  onAddRecipe: (newRecipe: Recipe) => void;
  onUpdateRecipe?: (updatedRecipe: Recipe) => void;
  onDeleteRecipe?: (id: string) => void;
  onUpdateIngredient?: (updated: Ingredient) => void;
}

export default function RecipeManager(props: RecipeManagerProps) {
  const {
    recipes,
    ingredients,
    onAddRecipe,
    onUpdateRecipe,
    onDeleteRecipe,
  } = props;

  const {
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
  } = useRecipes(props);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-semibold text-xl text-[#2A2420] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#8B3350]" />
            Manajemen Resep &amp; Kalkulasi HPP
          </h2>
          <p className="text-xs text-[#9A8E80] mt-1">
            Kalkulasi biaya modal per batch produksi, versioning resep, status aktif/nonaktif, dan simulasi HPP sandbox.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'simulasi' : 'list')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer border ${
              viewMode === 'simulasi'
                ? 'bg-[#8B3350] text-white border-[#8B3350] shadow-sm'
                : 'bg-[#FBF7F2] text-[#5C5248] border-[#E9E2D8] hover:bg-[#E9E2D8]/50'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{viewMode === 'simulasi' ? '📋 Kembalikan ke Resep' : '🧪 Simulasi HPP Sandbox'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2A2420] hover:bg-[#3A322B] text-[#FBF7F2] font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Resep Baru</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: RESEP LIST & VERSIONING */}
      {viewMode === 'list' && (
        <>
          {/* Category Pills & Status Filter */}
          <div className="flex flex-wrap gap-2 pb-1 border-b border-[#E9E2D8]">
            {(
              [
                { id: 'ALL', label: '📋 Semua Resep' },
                { id: 'AKTIF', label: '✅ Aktif' },
                { id: 'NONAKTIF', label: '⏸️ Nonaktif' },
                { id: 'BASE', label: '🍩 BASE' },
                { id: 'TOPPING', label: '✨ TOPPING' },
                { id: 'PACKAGING', label: '📦 PACKAGING' },
                { id: 'RESELLER', label: '🤝 RESELLER' },
                { id: 'LAINNYA', label: '📂 LAINNYA' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#2A2420] text-[#FBF7F2] shadow-xs'
                    : 'bg-[#FBF7F2] text-[#5C5248] hover:bg-[#E9E2D8]/50 border border-[#E9E2D8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Empty State */}
          {filteredRecipes.length === 0 && (
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
              <BookOpen className="w-12 h-12 text-[#9A8E80] mx-auto opacity-60" />
              <h3 className="font-serif font-medium text-lg text-[#2A2420]">Belum Ada Resep Terdaftar</h3>
              <p className="text-xs text-[#5C5248] leading-relaxed">
                Silakan buat resep baru terlebih dahulu untuk menghitung estimasi HPP riil bahan baku secara akurat.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs font-bold text-[#8B3350] hover:underline"
              >
                Mulai Tambahkan Resep &rarr;
              </button>
            </div>
          )}

          {/* Grid of Recipe Cards */}
          {filteredRecipes.length > 0 && (
            <div className="recipe-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  ingredientMap={ingredientMap}
                  onToggleStatus={handleToggleRecipeStatus}
                  onEdit={(r) => setEditingRecipe(r)}
                  onViewDetail={(r) => setSelectedRecipeForDetail(r)}
                  onDelete={onDeleteRecipe ? handleDeleteRecipe : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: SIMULASI HPP SANDBOX */}
      {viewMode === 'simulasi' && (
        <HppSimulationSandbox
          recipes={recipes}
          ingredients={ingredients}
          ingredientMap={ingredientMap}
          simulatedPrices={simulatedPrices}
          selectedSimRecipeId={selectedSimRecipeId}
          setSimulatedPrices={setSimulatedPrices}
          setSelectedSimRecipeId={setSelectedSimRecipeId}
          handleApplyPercentageChangeToSimulation={handleApplyPercentageChangeToSimulation}
          handleResetSimulation={handleResetSimulation}
          handleCommitSimulatedPricesToWarehouse={handleCommitSimulatedPricesToWarehouse}
        />
      )}

      {/* MODAL: DETAIL RESEP */}
      {selectedRecipeForDetail && (
        <RecipeDetailModal
          recipe={selectedRecipeForDetail}
          ingredientMap={ingredientMap}
          onClose={() => setSelectedRecipeForDetail(null)}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* MODAL: BUAT / EDIT RESEP */}
      {(showAddModal || editingRecipe) && (
        <RecipeFormModal
          editingRecipe={editingRecipe}
          ingredients={ingredients}
          ingredientMap={ingredientMap}
          onClose={() => {
            setShowAddModal(false);
            setEditingRecipe(null);
          }}
          onAddRecipe={onAddRecipe}
          onUpdateRecipe={onUpdateRecipe}
        />
      )}
    </div>
  );
}
