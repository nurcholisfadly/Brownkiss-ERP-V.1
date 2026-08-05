import { useState, FormEvent } from 'react';
import { ProductionBatch, Recipe, Ingredient, ErpUser, ProductionStageLog } from '../../../types';

export interface UseProductionOptions {
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

export function useProduction({
  batches,
  recipes,
  ingredients,
  donutInventory,
  users = [],
  currentUser,
  onAddBatch,
  onUpdateBatch,
  onDeleteBatch,
  onUpdateIngredients,
  onUpdateDonutInventory,
  onAddSecurityLog,
}: UseProductionOptions) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat'>('aktif');

  // Form states for starting or scheduling new production batch
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [batchQty, setBatchQty] = useState('50');
  const [initStatus, setInitStatus] = useState<'Diproses' | 'Menunggu'>('Diproses');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>(() => {
    return currentUser?.name || 'Chef Utama';
  });
  const [isStaged, setIsStaged] = useState(false);
  const [stageTargetQty, setStageTargetQty] = useState('50');

  // Modal states for recording Waste
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [targetBatchForWaste, setTargetBatchForWaste] = useState<ProductionBatch | null>(null);
  const [inputWasteQty, setInputWasteQty] = useState('0');
  const [inputWasteReason, setInputWasteReason] = useState('Gosong');
  const [isCompletingBatch, setIsCompletingBatch] = useState(false);

  // Modal states for recording Staged Production (Produksi Bertahap)
  const [showStageModal, setShowStageModal] = useState(false);
  const [targetBatchForStage, setTargetBatchForStage] = useState<ProductionBatch | null>(null);
  const [stageCompletedQty, setStageCompletedQty] = useState('50');
  const [stageWasteQty, setStageWasteQty] = useState('0');
  const [stageWasteReason, setStageWasteReason] = useState('Gosong');
  const [stageOperator, setStageOperator] = useState<string>(() => {
    return currentUser?.name || 'Chef Utama';
  });

  // Accordion state for staged log details
  const [expandedStagedBatchId, setExpandedStagedBatchId] = useState<string | null>(null);

  // Error messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to find recipe for batch by recipeId first, then by name
  const findRecipeForBatch = (batch: ProductionBatch) => {
    if (batch.recipeId) {
      const found = recipes.find((r) => r.id === batch.recipeId);
      if (found) return found;
    }
    return recipes.find((r) => r.name === batch.resep);
  };

  // List of active bakers/staff for operator dropdown
  const bakerOperators =
    users.length > 0
      ? users.filter((u) => u.status === 'Aktif').map((u) => u.name)
      : ['Chef Utama', 'Baker Senior', 'Asisten Baker'];

  if (currentUser && !bakerOperators.includes(currentUser.name)) {
    bakerOperators.unshift(currentUser.name);
  }

  // Helper calculations for live preview inside modal
  const getModalLivePreview = () => {
    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) return { totalQty: 0, totalBiaya: 0, totalNilaiJual: 0, margin: 0 };

    const qty = parseInt(batchQty) || 0;
    const totalNilaiJual = qty * recipe.price;

    let totalBiaya = 0;
    recipe.ingredients.forEach((ri) => {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      if (ing) {
        const qtyNeeded = (ri.qtyNeeded / (recipe.batchOutput || 1)) * qty;
        totalBiaya += qtyNeeded * ing.costPerUnit;
      }
    });

    const margin = totalBiaya > 0 ? ((totalNilaiJual - totalBiaya) / totalBiaya) * 100 : 0;
    return { totalQty: qty, totalBiaya, totalNilaiJual, margin };
  };

  const previewData = getModalLivePreview();

  // Create Batch (Either immediate 'Diproses' or scheduled 'Menunggu')
  const handleStartBatch = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) {
      setErrorMsg('Pilih resep terlebih dahulu!');
      return;
    }

    const qty = parseInt(batchQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Jumlah produksi harus lebih besar dari 0!');
      return;
    }

    // Check ingredient stock availability if status is 'Diproses'
    if (initStatus === 'Diproses') {
      const insufficientIngredients: string[] = [];

      recipe.ingredients.forEach((ri) => {
        const ing = ingredients.find((i) => i.id === ri.ingredientId);
        const qtyNeeded = (ri.qtyNeeded / (recipe.batchOutput || 1)) * qty;
        if (!ing || ing.qty < qtyNeeded) {
          insufficientIngredients.push(
            `${ing?.name || 'Bahan'}: Butuh ${qtyNeeded.toFixed(2)} ${ing?.unit || ''} (Stok: ${ing?.qty.toFixed(2) || 0})`
          );
        }
      });

      if (insufficientIngredients.length > 0) {
        setErrorMsg(`Stok Bahan Baku Tidak Cukup:\n` + insufficientIngredients.join('\n'));
        return;
      }

      // Deduct warehouse ingredients
      const updatedIngredients = ingredients.map((ing) => {
        const recipeIng = recipe.ingredients.find((ri) => ri.ingredientId === ing.id);
        if (recipeIng) {
          const qtyNeeded = (recipeIng.qtyNeeded / (recipe.batchOutput || 1)) * qty;
          return {
            ...ing,
            qty: Math.max(0, ing.qty - qtyNeeded),
          };
        }
        return ing;
      });

      onUpdateIngredients(updatedIngredients);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID');

    const cost = Math.round(recipe.hpp * qty);
    const val = Math.round(recipe.price * qty);

    const newBatch: ProductionBatch = {
      id: String(Date.now()).substring(5),
      recipeId: recipe.id,
      resep: recipe.name,
      qty,
      cost,
      val,
      date: `${dateStr} ${timeStr}`,
      status: initStatus,
      progress: initStatus === 'Diproses' ? 50 : 0,
      operator: selectedOperator,
      scheduledDate: initStatus === 'Menunggu' ? scheduledDate : undefined,
      isStaged,
      stageTargetQty: isStaged ? parseInt(stageTargetQty) || qty : undefined,
      stagedLogs: [],
    };

    onAddBatch(newBatch);

    onAddSecurityLog(
      `Membuat Batch Produksi #${newBatch.id} (${recipe.name} x${qty} Pcs) Status: ${initStatus} oleh ${selectedOperator}`,
      'Aman'
    );

    // Reset Form
    setSelectedRecipeId('');
    setBatchQty('50');
    setInitStatus('Diproses');
    setScheduledDate('');
    setIsStaged(false);
    setShowAddModal(false);
  };

  // Convert Scheduled Batch 'Menunggu' to 'Diproses'
  const handleStartScheduledBatch = (batch: ProductionBatch) => {
    const recipe = findRecipeForBatch(batch);
    if (!recipe) {
      alert('Resep untuk batch ini tidak ditemukan!');
      return;
    }

    // Check ingredient stock
    const insufficientIngredients: string[] = [];
    recipe.ingredients.forEach((ri) => {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      const qtyNeeded = (ri.qtyNeeded / (recipe.batchOutput || 1)) * batch.qty;
      if (!ing || ing.qty < qtyNeeded) {
        insufficientIngredients.push(
          `${ing?.name || 'Bahan'}: Butuh ${qtyNeeded.toFixed(2)} ${ing?.unit || ''} (Stok: ${ing?.qty.toFixed(2) || 0})`
        );
      }
    });

    if (insufficientIngredients.length > 0) {
      alert(`Gagal Memulai Produksi!\nStok bahan baku tidak mencukupi:\n` + insufficientIngredients.join('\n'));
      return;
    }

    // Deduct ingredients
    const updatedIngredients = ingredients.map((ing) => {
      const recipeIng = recipe.ingredients.find((ri) => ri.ingredientId === ing.id);
      if (recipeIng) {
        const qtyNeeded = (recipeIng.qtyNeeded / (recipe.batchOutput || 1)) * batch.qty;
        return {
          ...ing,
          qty: Math.max(0, ing.qty - qtyNeeded),
        };
      }
      return ing;
    });

    onUpdateIngredients(updatedIngredients);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID');

    const updatedBatch: ProductionBatch = {
      ...batch,
      status: 'Diproses',
      date: `${dateStr} ${timeStr}`,
      progress: 50,
    };

    onUpdateBatch(updatedBatch);

    onAddSecurityLog(
      `Memulai Jadwal Batch #${batch.id} (${batch.resep} x${batch.qty} Pcs) - Bahan baku dipotong dari gudang`,
      'Aman'
    );
  };

  // Submit Staged Production Log
  const handleSaveStageLog = (e: FormEvent) => {
    e.preventDefault();
    if (!targetBatchForStage) return;

    const compQty = parseInt(stageCompletedQty) || 0;
    const wasteQty = parseInt(stageWasteQty) || 0;

    if (compQty <= 0) {
      alert('Kuantitas selesai tahap ini harus lebih besar dari 0!');
      return;
    }

    setIsCompletingBatch(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newStageNumber = (targetBatchForStage.stagedLogs?.length || 0) + 1;
    const netUsable = Math.max(0, compQty - wasteQty);

    const newLog: ProductionStageLog = {
      id: 'stg_' + Date.now(),
      stageNumber: newStageNumber,
      completedAt: timeStr,
      qtyCompleted: compQty,
      wasteQty,
      wasteReason: wasteQty > 0 ? stageWasteReason : undefined,
      operator: stageOperator,
    };

    const updatedLogs = [...(targetBatchForStage.stagedLogs || []), newLog];
    const totalDoneSoFar = updatedLogs.reduce((sum, l) => sum + l.qtyCompleted, 0);
    const targetQty = targetBatchForStage.stageTargetQty || targetBatchForStage.qty;

    const isFullyComplete = totalDoneSoFar >= targetQty;

    const updatedBatch: ProductionBatch = {
      ...targetBatchForStage,
      stagedLogs: updatedLogs,
      status: isFullyComplete ? 'Selesai' : 'Diproses',
      progress: isFullyComplete ? 100 : Math.round((totalDoneSoFar / targetQty) * 100),
      usableQty: (targetBatchForStage.usableQty || 0) + netUsable,
      wasteQty: (targetBatchForStage.wasteQty || 0) + wasteQty,
      date: isFullyComplete ? `${new Date().toLocaleDateString('id-ID')} ${timeStr}` : targetBatchForStage.date,
    };

    onUpdateBatch(updatedBatch);

    // Update Donut POS etalase inventory
    if (netUsable > 0) {
      onUpdateDonutInventory(targetBatchForStage.resep, netUsable);
    }

    onAddSecurityLog(
      `Catat Produksi Bertahap Tahap #${newStageNumber} Batch #${targetBatchForStage.id} (${targetBatchForStage.resep}): +${netUsable} Pcs ke Etalase POS oleh ${stageOperator}`,
      'Aman'
    );

    setIsCompletingBatch(false);
    setShowStageModal(false);
    setTargetBatchForStage(null);

    alert(`Berhasil mencatat tahap #${newStageNumber}! +${netUsable} Pcs donat ditambahkan ke etalase kasir.`);
  };

  // Final Complete Batch & Record Waste
  const handleCompleteBatchWithWaste = (e: FormEvent) => {
    e.preventDefault();
    if (!targetBatchForWaste) return;

    setIsCompletingBatch(true);

    const wasteNum = parseInt(inputWasteQty) || 0;
    const usableQty = Math.max(0, targetBatchForWaste.qty - wasteNum);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID');

    const updatedBatch: ProductionBatch = {
      ...targetBatchForWaste,
      status: 'Selesai',
      progress: 100,
      wasteQty: wasteNum,
      wasteReason: wasteNum > 0 ? inputWasteReason : undefined,
      usableQty,
      date: `${dateStr} ${timeStr}`,
    };

    onUpdateBatch(updatedBatch);

    // Add usable donuts to POS display cabinet
    if (usableQty > 0) {
      onUpdateDonutInventory(targetBatchForWaste.resep, usableQty);
    }

    onAddSecurityLog(
      `Penyelesaian Batch #${targetBatchForWaste.id} (${targetBatchForWaste.resep}): QC Pass ${usableQty} Pcs ditambahkan ke Display Kasir, Waste: ${wasteNum} Pcs (${inputWasteReason})`,
      wasteNum > 10 ? 'Peringatan' : 'Bahaya'
    );

    setIsCompletingBatch(false);
    setShowWasteModal(false);
    setTargetBatchForWaste(null);

    alert(`Batch #${targetBatchForWaste.id} Selesai! +${usableQty} Pcs donat segar telah dipindahkan ke etalase kasir.`);
  };

  // Cancel Batch with Non-Negative Stock Protection
  const handleCancelBatch = (batch: ProductionBatch) => {
    const isProcessed = batch.status === 'Diproses';

    const currentStock = donutInventory[batch.resep] || 0;
    const producedSoFar = batch.usableQty || 0;
    const alreadySold = Math.max(0, producedSoFar - currentStock);

    let confirmMsg = `Batalkan Batch Produksi #${batch.id} (${batch.resep})?`;
    if (isProcessed) {
      confirmMsg += `\n\nBahan baku resep akan dikembalikan secara utuh ke Gudang.`;
      if (alreadySold > 0) {
        confirmMsg += `\n\n⚠️ PERHATIAN: Sebagian donat dari batch ini (${alreadySold} pcs) sudah terjual di Kasir! Sisa stok display (${currentStock} pcs) akan ditarik.`;
      }
    }

    if (!confirm(confirmMsg)) return;

    // Refund ingredient stock if 'Diproses'
    if (isProcessed) {
      const recipe = findRecipeForBatch(batch);
      if (recipe) {
        const updatedIngredients = ingredients.map((ing) => {
          const recipeIng = recipe.ingredients.find((ri) => ri.ingredientId === ing.id);
          if (recipeIng) {
            const qtyRefund = (recipeIng.qtyNeeded / (recipe.batchOutput || 1)) * batch.qty;
            return {
              ...ing,
              qty: ing.qty + qtyRefund,
            };
          }
          return ing;
        });

        onUpdateIngredients(updatedIngredients);
      }

      // Reclaim unsold stock from display cabinet
      if (producedSoFar > 0 && currentStock > 0) {
        const qtyToReclaim = Math.min(producedSoFar, currentStock);
        onUpdateDonutInventory(batch.resep, -qtyToReclaim);
      }
    }

    const updatedBatch: ProductionBatch = {
      ...batch,
      status: 'Batal',
      progress: 0,
    };

    onUpdateBatch(updatedBatch);

    onAddSecurityLog(
      `Membatalkan Batch #${batch.id} (${batch.resep}): Bahan baku dikembalikan ke Gudang.`,
      alreadySold > 0 ? 'Bahaya' : 'Peringatan'
    );

    alert(`Batch #${batch.id} berhasil dibatalkan.`);
  };

  // Filtered active & history batches
  const activeBatches = batches.filter((b) => b.status === 'Diproses' || b.status === 'Menunggu');
  const completedBatches = batches.filter((b) => b.status === 'Selesai' || b.status === 'Batal');

  return {
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
  };
}
