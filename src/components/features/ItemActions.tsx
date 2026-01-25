'use client'

import { updateItemQuantity, deleteItem } from "@/actions/items";
import { Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";

export default function ItemActions({ itemId, quantity }: { itemId: string, quantity: number }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (delta: number) => {
    startTransition(async () => {
      await updateItemQuantity(itemId, delta);
    });
  };

  const handleDelete = () => {
    if (confirm("Opravdu smazat?")) {
      startTransition(async () => {
        await deleteItem(itemId);
      });
    }
  };

  return (
    // Změna: h-full -> h-auto, flex-col -> flex-row
    <div className="flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-14">
      
      {/* PLUS */}
      <button 
        disabled={isPending}
        onClick={() => handleUpdate(1)}
        className="h-full px-5 flex items-center justify-center text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-slate-100"
      >
        <Plus className="w-5 h-5 stroke-[3px]" />
      </button>

      {/* MÍNUS */}
      <button 
        disabled={isPending || quantity <= 0}
        onClick={() => handleUpdate(-1)}
        className="h-full px-5 flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100 transition-colors border-r border-slate-100 disabled:opacity-30"
      >
        <Minus className="w-5 h-5 stroke-[3px]" />
      </button>

      {/* KOŠ */}
      <button 
        disabled={isPending}
        onClick={handleDelete}
        className="h-full px-4 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>

    </div>
  );
}