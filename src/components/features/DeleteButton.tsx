'use client'

import { deleteItem } from "@/actions/items";
import { Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";

export default function DeleteButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Opravdu chceš tuto položku smazat?")) {
      startTransition(async () => {
        await deleteItem(itemId);
      });
    }
  };

  return (
    <button
      disabled={isPending}
      onClick={handleDelete}
      className="p-2 text-slate-300 hover:text-red-500 active:scale-90 transition-all disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}