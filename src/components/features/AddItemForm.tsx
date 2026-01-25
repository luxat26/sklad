'use client'
import { createItem } from "@/actions/items";
import { Plus, X } from "lucide-react";
import { useState, useRef } from "react";

export default function AddItemForm() {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const clientAction = async (formData: FormData) => {
    await createItem(formData);
    setIsOpen(false);
    formRef.current?.reset();
  };

  if (!isOpen) {
    // Tady jsme zmenšili tlačítko, aby se vešlo vedle ostatních (budou v ItemList)
    return null; 
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Nová položka</h2>
          <button onClick={() => setIsOpen(true)}><X /></button>
        </div>
        
        <form action={clientAction} ref={formRef} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-[2]">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Název</label>
              <input name="name" required className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200" placeholder="Šroubky" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Box</label>
              <input name="box" className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200" placeholder="A1" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Množství</label>
            <input name="quantity" type="number" className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200" placeholder="0" />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500">Zrušit</button>
            <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold">Uložit</button>
          </div>
        </form>
      </div>
    </div>
  );
}