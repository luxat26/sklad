'use client'

import { useState } from "react";
import { Search, Plus, Minus, User, ArrowUpDown, Loader2, ChevronDown, ChevronUp, PackagePlus, ArrowUpRight, ArrowDownLeft, Trash2 } from "lucide-react";
import { borrowItems, returnItemsFromBorrower, updateItemQuantity, deleteItem, createItem } from "@/actions/items";
import AddItemForm from "@/components/features/AddItemForm"; // Ujisti se, že importuješ existující formulář

type Loan = { 
  id: string | number; 
  borrower_name: string; 
  quantity: number; 
  borrowed_at: string; 
};

type Item = { 
  id: string | number; 
  name: string; 
  quantity: number; 
  box: string | null; 
  loans: Loan[] 
};

export default function ItemList({ initialItems, currentUser }: { initialItems: Item[], currentUser: string }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("available"); 
  
  // ID právě rozbalené položky (vždy jen jedna)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Hodnota v inputu pro aktuálně rozbalenou položku
  const [amount, setAmount] = useState<number>(1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // Pro modal nového itemu

  // --- FILTROVÁNÍ A ŘAZENÍ ---
  const filteredItems = initialItems.filter((item) => {
    return item.name.toLowerCase().includes(search.toLowerCase()) || 
           (item.box && item.box.toLowerCase().includes(search.toLowerCase()));
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aIsAvailable = a.quantity > 0;
    const bIsAvailable = b.quantity > 0;

    switch (sortBy) {
      case "available": 
        if (aIsAvailable && !bIsAvailable) return -1;
        if (!aIsAvailable && bIsAvailable) return 1;
        return a.name.localeCompare(b.name);
      case "unavailable": 
        if (!aIsAvailable && bIsAvailable) return -1;
        if (aIsAvailable && !bIsAvailable) return 1;
        return a.name.localeCompare(b.name);
      case "name_asc": return a.name.localeCompare(b.name);
      case "name_desc": return b.name.localeCompare(a.name);
      default: return 0;
    }
  });

  // --- AKCE ---

  const handleAction = async (actionType: 'add' | 'borrow' | 'return', itemId: string, itemName: string) => {
    if (amount <= 0) return alert("Množství musí být větší než 0");
    
    setIsProcessing(true);
    try {
      if (actionType === 'add') {
        // Přidat na sklad (Admin operace)
        await updateItemQuantity(itemId, amount);
      } 
      else if (actionType === 'borrow') {
        // Půjčit aktuálnímu uživateli
        // Musíme to zabalit do objektu, protože borrowItems čeká "košík"
        await borrowItems(currentUser, { [itemId]: amount });
      } 
      else if (actionType === 'return') {
        // Vrátit od aktuálního uživatele
        await returnItemsFromBorrower(currentUser, { [itemId]: amount });
      }

      // Reset po akci
      setAmount(1);
      // Necháme položku otevřenou, nebo ji zavřeme? 
      // Lepší nechat otevřenou, kdyby chtěl dělat další akce.
    } catch (error) {
      console.error(error);
      alert("Chyba při zpracování.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Opravdu chceš smazat tuto položku ze skladu?")) {
      setIsProcessing(true);
      await deleteItem(itemId);
      setIsProcessing(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setAmount(1); // Reset inputu při otevření nové položky
    }
  };

  // --- RENDER ---
  
  if (isAdding) {
     // Používáme tvou existující komponentu AddItemForm, ale musíme ji zobrazit
     // Protože AddItemForm v tvém kódu má vlastní logiku "isOpen", tady jen simulujeme kontejner
     // Nebo jednodušeji: zavoláme ji a ona se vyrenderuje jako overlay.
     // Zde pro jednoduchost vložím inline logiku pro zavření, pokud AddItemForm nemá prop na zavření zvenčí.
     // V tvém AddItemForm jsi měl logiku uvnitř. Takže tady jen renderujeme komponentu.
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
             {/* Museli bychom upravit AddItemForm, aby bral props onClose. 
                 Pro teď to vyřešíme tak, že AddItemForm necháme v page.tsx nebo ho vyvoláme jinak.
                 Ale aby to fungovalo hned, uděláme jednoduchý wrapper: */}
             <div className="bg-white p-6 rounded-3xl w-full max-w-sm">
                <h2 className="font-bold text-xl mb-4">Nová položka</h2>
                <form action={async (fd) => { setIsProcessing(true); await createItem(fd); setIsProcessing(false); setIsAdding(false); }} className="space-y-4">
                    <input name="name" autoFocus placeholder="Název" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold" required />
                    <div className="flex gap-2">
                        <input name="box" placeholder="Box" className="w-1/3 p-3 bg-slate-50 rounded-xl border border-slate-200" />
                        <input name="quantity" type="number" placeholder="Ks" className="w-2/3 p-3 bg-slate-50 rounded-xl border border-slate-200" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500">Zrušit</button>
                        <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold">Uložit</button>
                    </div>
                </form>
             </div>
        </div>
     );
  }

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center animate-in fade-in">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      )}

      {/* HORNÍ LIŠTA (Hledání + Přidat) */}
      <div className="flex gap-2 mb-4 sticky top-4 z-10">
        <div className="relative flex-[2] shadow-lg rounded-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Hledat..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-9 pr-3 py-3 bg-white border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none" 
          />
        </div>
        
        {/* Tlačítko Přidat novou položku (Globální) */}
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center w-12">
            <Plus className="w-6 h-6 stroke-[3px]" />
        </button>
      </div>

      {/* FILTER BOX (volitelný) */}
      <div className="flex justify-end mb-4 px-1">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-transparent outline-none appearance-none pr-4"
            >
                <option value="available">Dostupné nejdřív</option>
                <option value="unavailable">Nedostupné nejdřív</option>
                <option value="name_asc">Od A do Z</option>
            </select>
          </div>
      </div>

      {/* SEZNAM POLOŽEK */}
      <div className="space-y-3 pb-20">
        {sortedItems.map((item) => {
          const isExpanded = expandedId === item.id.toString();
          
          // Výpočty pro zobrazení
          const totalBorrowed = item.loans.reduce((a,b)=>a+b.quantity,0);
          const myLoan = item.loans.find(l => l.borrower_name.toLowerCase() === currentUser.toLowerCase());
          const myLoanQty = myLoan ? myLoan.quantity : 0;

          // Barvičky
          const borderClass = isExpanded 
            ? "border-blue-500 ring-4 ring-blue-500/10 z-10 relative" // Zvýraznění při rozbalení
            : (item.quantity > 0 ? "border-slate-100" : "border-red-100 bg-red-50/30");

          return (
            <div key={item.id} className={`bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm overflow-hidden ${borderClass}`}>
              
              {/* 1. HLAVIČKA (Vždy viditelná) - Kliknutím se rozbalí */}
              <div onClick={() => toggleExpand(item.id.toString())} className="p-4 flex items-center gap-3 cursor-pointer select-none">
                
                {/* Ikonka Boxu / Avatar */}
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${item.quantity > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-500'}`}>
                    {item.quantity > 0 ? <PackagePlus className="w-5 h-5"/> : <ArrowDownLeft className="w-5 h-5"/>}
                    {item.box && <span className="text-[9px] font-bold uppercase mt-0.5">{item.box}</span>}
                </div>

                {/* Texty */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 leading-tight">{item.name}</h3>
                    <div className="flex gap-2 mt-1">
                        <span className={`text-xs font-bold ${item.quantity > 0 ? 'text-slate-500' : 'text-red-500'}`}>
                            Skladem: {item.quantity} ks
                        </span>
                        {totalBorrowed > 0 && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-bold flex items-center">
                                Půjčeno {totalBorrowed}
                            </span>
                        )}
                    </div>
                </div>

                {/* Šipka / Indikátor */}
                <div className="text-slate-300">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {/* 2. ROZBALENÝ OBSAH (Akce) */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 w-full mb-4"></div>

                    {/* A) Input pro množství */}
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => setAmount(Math.max(1, amount - 1))} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform">
                            <Minus className="w-5 h-5 text-slate-600" />
                        </button>
                        
                        <div className="flex-1 relative">
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                className="w-full text-center text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">ks</span>
                        </div>

                        <button onClick={() => setAmount(amount + 1)} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform">
                            <Plus className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    {/* B) Tři hlavní tlačítka */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {/* 1. PŘIDAT (Naskladnit) */}
                        <button 
                            onClick={() => handleAction('add', item.id.toString(), item.name)}
                            className="flex flex-col items-center justify-center gap-1 bg-emerald-50 border-2 border-emerald-100 hover:bg-emerald-100 text-emerald-700 p-3 rounded-xl transition-colors active:scale-95"
                        >
                            <Plus className="w-6 h-6 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase">Přidat</span>
                        </button>

                        {/* 2. PŮJČIT (Mně) */}
                        <button 
                            onClick={() => handleAction('borrow', item.id.toString(), item.name)}
                            disabled={item.quantity < amount}
                            className="flex flex-col items-center justify-center gap-1 bg-orange-50 border-2 border-orange-100 hover:bg-orange-100 text-orange-600 p-3 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            <ArrowUpRight className="w-6 h-6 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase">Půjčit</span>
                        </button>

                        {/* 3. VRÁTIT (Ode mě) */}
                        <button 
                            onClick={() => handleAction('return', item.id.toString(), item.name)}
                            disabled={myLoanQty < amount} // Nemůžu vrátit víc, než mám
                            className="flex flex-col items-center justify-center gap-1 bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 text-blue-600 p-3 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            <ArrowDownLeft className="w-6 h-6 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase">Vrátit</span>
                        </button>
                    </div>

                    {/* C) Info o dlužnících */}
                    {item.loans.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Aktuální výpůjčky</h4>
                            <div className="flex flex-wrap gap-2">
                                {item.loans.map(loan => {
                                    const isMe = loan.borrower_name.toLowerCase() === currentUser.toLowerCase();
                                    return (
                                        <div key={loan.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border ${isMe ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                                            <User className="w-3 h-3" />
                                            {loan.borrower_name}: {loan.quantity}ks
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* D) Smazat položku (Danger zone) */}
                    <div className="flex justify-center mt-2">
                        <button onClick={() => handleDelete(item.id.toString())} className="text-red-400 text-xs font-bold flex items-center gap-1 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                            Smazat celou položku
                        </button>
                    </div>

                </div>
              )}
            </div>
          );
        })}

        {/* Prázdný stav */}
        {sortedItems.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-medium">
                Nic se nenašlo 👻
            </div>
        )}
      </div>
    </div>
  );
}