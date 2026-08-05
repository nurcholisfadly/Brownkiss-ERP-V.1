import React, { useState } from 'react';
import { Recipe } from '../../../types';
import { Plus, Search } from 'lucide-react';

interface CartItem {
  recipe: Recipe;
  qty: number;
}

interface ProductCatalogProps {
  recipes: Recipe[];
  donutInventory: Record<string, number>;
  cart: Record<string, CartItem>;
  currencySymbol: string;
  onAddToCart: (recipe: Recipe) => void;
}

export default function ProductCatalog({
  recipes,
  donutInventory,
  cart,
  currencySymbol,
  onAddToCart,
}: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeRecipes = recipes.filter((r) => r.status !== 'Nonaktif');

  const filteredRecipes = activeRecipes.filter((recipe) => {
    if (selectedCategory !== 'ALL' && recipe.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      return recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-[#E9E2D8] rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: '🍩 Semua Donat' },
            { id: 'BASE', label: '🍩 BASE' },
            { id: 'TOPPING', label: '✨ TOPPING' },
            { id: 'RESELLER', label: '🤝 RESELLER' },
            { id: 'PACKAGING', label: '📦 PACKAGING' },
            { id: 'LAINNYA', label: '📂 LAINNYA' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#8B3350] text-[#FBF7F2] shadow-xs'
                  : 'bg-[#FBF7F2] text-[#5C5248] hover:bg-[#E9E2D8]/50 border border-[#E9E2D8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#9A8E80] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 border border-[#E9E2D8] rounded-xl text-xs outline-none focus:border-[#8B3350]"
            placeholder="Cari varian donat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => {
          const availableStock = donutInventory[recipe.name] || 0;
          const cartItem = cart[recipe.id];
          const qtyInCart = cartItem ? cartItem.qty : 0;
          const remainingDisplayStock = Math.max(0, availableStock - qtyInCart);

          const isOutOfStock = availableStock <= 0 || remainingDisplayStock <= 0;

          return (
            <button
              key={recipe.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(recipe)}
              className={`bg-white border rounded-2xl p-4 text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                isOutOfStock
                  ? 'opacity-60 border-[#E9E2D8] bg-gray-50'
                  : 'border-[#E9E2D8] hover:border-[#8B3350] hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-3xl mb-2 block">{recipe.emoji || '🍩'}</span>
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      availableStock > 20
                        ? 'bg-emerald-100 text-emerald-800'
                        : availableStock > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {availableStock > 0 ? `Stok: ${remainingDisplayStock}` : 'Habis'}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-sm text-[#2A2420] group-hover:text-[#8B3350] transition-colors line-clamp-1">
                  {recipe.name}
                </h4>
                <p className="font-mono font-bold text-xs text-[#8B3350] mt-1">
                  {currencySymbol} {recipe.price.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-[#E9E2D8] flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#9A8E80] uppercase tracking-wider font-semibold">
                  {recipe.category || 'BASE'}
                </span>

                <div className="w-7 h-7 bg-[#FBF7F2] group-hover:bg-[#8B3350] group-hover:text-white border border-[#E9E2D8] rounded-full flex items-center justify-center transition-all">
                  <Plus className="w-4 h-4" />
                </div>
              </div>

              {qtyInCart > 0 && (
                <div className="absolute top-2 right-2 bg-[#8B3350] text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded-full shadow-xs">
                  {qtyInCart} di keranjang
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
