'use client'

import { createItem } from "@/actions/items";
import { X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

type AddItemFormProps = {
  isOpen: boolean;
  onClose: () => void;
  existingBoxes: string[];
};

export default function AddItemForm({ isOpen, onClose, existingBoxes }: AddItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await createItem(formData);
      formRef.current?.reset();
      onClose(); 
    } catch (e) {
      console.error("Chyba při ukládání:", e);
      alert("Nepodařilo se uložit položku.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl text-slate-800">Nová položka</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form action={clientAction} ref={formRef} className="space-y-4">
          {/* NÁZEV */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Název</label>
            <input 
              name="name" 
              required 
              autoFocus
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder:font-normal" 
              placeholder="Např. Vrtačka" 
            />
          </div>
          
          {/* BOX A MNOŽSTVÍ */}
          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Box</label>
              <input 
                name="box" 
                list="box-options" 
                autoComplete="off" 
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="A1" 
              />
              <datalist id="box-options">
                {existingBoxes.map((box) => (
                  <option key={box} value={box} />
                ))}
              </datalist>
            </div>
            <div className="w-2/3">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Počet ks</label>
              <input 
                name="quantity" 
                type="number" 
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                placeholder="0" 
              />
            </div>
          </div>

          {/* === NOVÉ: POZNÁMKA === */}
          <div>
             <label className="text-xs font-bold text-slate-400 uppercase ml-1">Poznámka (volitelné)</label>
             <textarea 
                name="note" 
                rows={2}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Např. Vrátit vyčištěné..."
             />
          </div>
          {/* ====================== */}
          
          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Zrušit
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Uložit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}