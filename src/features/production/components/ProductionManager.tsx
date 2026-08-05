import React from 'react';
import { ProductionBatch, Recipe, Ingredient, ErpUser } from '../../../types';
import { ChefHat, History, Plus, PackageCheck } from 'lucide-react';
import { useProduction } from '../hooks/useProduction';

import BatchCard from './BatchCard';
import NewBatchModal from './NewBatchModal';
import WasteModal from './WasteModal';
import StagedProductionModal from './StagedProductionModal';
import ProductionHistoryTable from './ProductionHistoryTable';

interface ProductionManagerProps {
  batches: ProductionBatch[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  donutInventory: Record<string, number>;
  users?: ErpUser[];
  currentUser?: ErpUser | null;
  onAddBatch: (newBatch: ProductionBatch) => void;
  onUpdateBatch: (updatedBatch: ProductionBatch) => void;
  onDeleteBatch: (id: string) => void;
  onUpdateIngredients: (updatedIngredients: Ingredient[]) => void;
  onUpdateDonutInventory: (flavor: string, addQty: number) => void;
  onAddSecurityLog: (event: string, level: 'Aman' | 'Peringatan' | 'Bahaya') => void;
}

export default function ProductionManager(props: ProductionManagerProps) {
  const { recipes, ingredients, onDeleteBatch } = props;

  const {
    showAddModal,
    setShowAddModal,
    activeTab,
    setActiveTab,
    selectedRecipeId,
    setSelectedRecipeId,
    batchQty,
    setBatchQty,
    initStatus,
    setInitStatus,
    scheduledDate,
    setScheduledDate,
    selectedOperator,
    setSelectedOperator,
    isStaged,
    setIsStaged,
    stageTargetQty,
    setStageTargetQty,
    showWasteModal,
    setShowWasteModal,
    targetBatchForWaste,
    setTargetBatchForWaste,
    inputWasteQty,
    setInputWasteQty,
    inputWasteReason,
    setInputWasteReason,
    isCompletingBatch,
    showStageModal,
    setShowStageModal,
    targetBatchForStage,
    setTargetBatchForStage,
    stageCompletedQty,
    setStageCompletedQty,
    stageWasteQty,
    setStageWasteQty,
    stageWasteReason,
    setStageWasteReason,
    stageOperator,
    setStageOperator,
    expandedStagedBatchId,
    setExpandedStagedBatchId,
    errorMsg,
    setErrorMsg,
    findRecipeForBatch,
    bakerOperators,
    previewData,
    activeBatches,
    completedBatches,
    handleStartBatch,
    handleStartScheduledBatch,
    handleSaveStageLog,
    handleCompleteBatchWithWaste,
    handleCancelBatch,
  } = useProduction(props);

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2 border border-[#E9E2D8] rounded-2xl shadow-xxs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('aktif')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'aktif'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>🔥 Antrean Produksi Aktif ({activeBatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                : 'text-[#5C5248] hover:bg-[#FBF7F2]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📜 Riwayat Batch Selesai ({completedBatches.length})</span>
          </button>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2A2420] hover:bg-[#3A322B] text-[#FBF7F2] font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Mulai Batch Baru</span>
        </button>
      </div>

      {/* TAB 1: ANTREAN PRODUKSI AKTIF */}
      {activeTab === 'aktif' && (
        <>
          {activeBatches.length === 0 ? (
            <div className="bg-white border border-[#E9E2D8] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
              <PackageCheck className="w-12 h-12 text-[#9A8E80] mx-auto opacity-60" />
              <h3 className="font-serif font-medium text-lg text-[#2A2420]">Dapur Produksi Sedang Lengang</h3>
              <p className="text-xs text-[#5C5248] leading-relaxed">
                Belum ada batch penggorengan donat yang sedang berjalan atau dijadwalkan saat ini.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs font-bold text-[#8B3350] hover:underline"
              >
                + Mulai Batch Produksi Sekarang &rarr;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBatches.map((batch) => {
                const recipe = findRecipeForBatch(batch);
                return (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    recipe={recipe}
                    expandedStagedBatchId={expandedStagedBatchId}
                    setExpandedStagedBatchId={setExpandedStagedBatchId}
                    onStartScheduledBatch={handleStartScheduledBatch}
                    onOpenStageModal={(b) => {
                      setTargetBatchForStage(b);
                      setShowStageModal(true);
                    }}
                    onOpenWasteModal={(b) => {
                      setTargetBatchForWaste(b);
                      setInputWasteQty('0');
                      setShowWasteModal(true);
                    }}
                    onCancelBatch={handleCancelBatch}
                    onDeleteBatch={onDeleteBatch}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: RIWAYAT BATCH SELESAI */}
      {activeTab === 'riwayat' && (
        <ProductionHistoryTable
          completedBatches={completedBatches}
          onDeleteBatch={onDeleteBatch}
        />
      )}

      {/* MODAL 1: BATCH BARU */}
      {showAddModal && (
        <NewBatchModal
          recipes={recipes}
          ingredients={ingredients}
          bakerOperators={bakerOperators}
          selectedRecipeId={selectedRecipeId}
          batchQty={batchQty}
          initStatus={initStatus}
          scheduledDate={scheduledDate}
          selectedOperator={selectedOperator}
          isStaged={isStaged}
          stageTargetQty={stageTargetQty}
          errorMsg={errorMsg}
          previewData={previewData}
          setSelectedRecipeId={setSelectedRecipeId}
          setBatchQty={setBatchQty}
          setInitStatus={setInitStatus}
          setScheduledDate={setScheduledDate}
          setSelectedOperator={setSelectedOperator}
          setIsStaged={setIsStaged}
          setStageTargetQty={setStageTargetQty}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleStartBatch}
        />
      )}

      {/* MODAL 2: WASTE / SELESAI */}
      {showWasteModal && targetBatchForWaste && (
        <WasteModal
          targetBatch={targetBatchForWaste}
          inputWasteQty={inputWasteQty}
          inputWasteReason={inputWasteReason}
          isCompletingBatch={isCompletingBatch}
          setInputWasteQty={setInputWasteQty}
          setInputWasteReason={setInputWasteReason}
          onClose={() => {
            setShowWasteModal(false);
            setTargetBatchForWaste(null);
          }}
          onSubmit={handleCompleteBatchWithWaste}
        />
      )}

      {/* MODAL 3: PRODUKSI BERTAHAP (STAGED) */}
      {showStageModal && targetBatchForStage && (
        <StagedProductionModal
          targetBatch={targetBatchForStage}
          stageCompletedQty={stageCompletedQty}
          stageWasteQty={stageWasteQty}
          stageWasteReason={stageWasteReason}
          stageOperator={stageOperator}
          bakerOperators={bakerOperators}
          isCompletingBatch={isCompletingBatch}
          setStageCompletedQty={setStageCompletedQty}
          setStageWasteQty={setStageWasteQty}
          setStageWasteReason={setStageWasteReason}
          setStageOperator={setStageOperator}
          onClose={() => {
            setShowStageModal(false);
            setTargetBatchForStage(null);
          }}
          onSubmit={handleSaveStageLog}
        />
      )}
    </div>
  );
}
