'use client'

import { updateItemQuantity, deleteItem } from "@/actions/items";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ItemActions({ itemId, quantity }: { itemId: string, quantity: number }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (delta: number) => {
    setLoading(true);
    await updateItemQuantity(itemId, delta);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Opravdu smazat tuto položku?")) {
      setLoading(true);
      await deleteItem(itemId);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Tlačítko PLUS */}
      <button 
        onClick={() => handleUpdate(1)} 
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg active:scale-90 transition-transform border border-blue-100"
      >
        <Plus className="w-4 h-4 stroke-[3px]" />
      </button>

      {/* Tlačítko MÍNUS */}
      <button 
        onClick={() => handleUpdate(-1)} 
        disabled={loading || quantity === 0}
        className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-600 rounded-lg active:scale-90 transition-transform border border-slate-200"
      >
        <Minus className="w-4 h-4 stroke-[3px]" />
      </button>

      {/* Tlačítko KOŠ (Červené, jen ikona) */}
      <button 
        onClick={handleDelete} 
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg active:scale-90 transition-transform border border-red-100 ml-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}