'use client'

import { useState } from "react";
import { Info, X, Save, Loader2 } from "lucide-react";
import { updateGeneralInfo } from "@/actions/info";

export default function GeneralInfo({ initialText }: { initialText: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateGeneralInfo(text);
    setIsSaving(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* TLAČÍTKO INFO (vedle Logoutu) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-xl border border-slate-200 shadow-sm transition-colors active:scale-95"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* MODAL OKNO */}
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in flex flex-col h-[60vh]">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" />
                Nástěnka
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 mb-4">
              <textarea 
                className="w-full h-full p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-slate-700 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Zde napište informace pro ostatní..."
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Uložit</>}
            </button>

          </div>
        </div>
      )}
    </>
  );
}