'use client'

import { useState } from "react";
import { Search, Plus, ArrowUpRight, ArrowDownLeft, X, Minus, User, ArrowUpDown, Loader2, ChevronsRight } from "lucide-react";
import ItemActions from "@/components/features/ItemActions";
import { borrowItems, returnItemsFromBorrower, createItem } from "@/actions/items";

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

// 1. Přidáme prop currentUser
export default function ItemList({ initialItems, currentUser }: { initialItems: Item[], currentUser: string }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("available"); 
  const [mode, setMode] = useState<'view' | 'borrow' | 'return'>('view');
  
  // 2. Smazali jsme stavy pro borrowerName - už je nepotřebujeme
  
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}.`;
  };

  // --- FILTROVÁNÍ ---
  const filteredItems = initialItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.box && item.box.toLowerCase().includes(search.toLowerCase()));
    
    // 3. Logika pro VRACENÍ: Zobrazit jen položky, které má PŘIHLÁŠENÝ uživatel půjčené
    if (mode === 'return') {
      const userHasLoan = item.loans.some(l => l.borrower_name.toLowerCase() === currentUser.toLowerCase());
      return matchesSearch && userHasLoan;
    }
    
    return matchesSearch;
  });

  // ŘAZENÍ (beze změny)
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

  const updateCart = (id: string, delta: number, limit: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const newVal = Math.max(0, Math.min(limit, current + delta));
      if (newVal === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: newVal };
    });
  };

  const addAllToCart = (id: string, limit: number) => {
    const currentInCart = cart[id] || 0;
    const remaining = limit - currentInCart;
    if (remaining > 0) {
      updateCart(id, remaining, limit);
    }
  };

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    try {
      if (mode === 'borrow') {
        // 4. Použijeme currentUser místo borrowerName
        await borrowItems(currentUser, cart);
      } else if (mode === 'return') {
        await returnItemsFromBorrower(currentUser, cart);
      }
      setMode('view');
      setCart({});
    } catch (error) {
      console.error("Chyba:", error);
      alert("Něco se pokazilo.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HORNÍ MENU ---
  const renderTopMenu = () => {
    if (mode !== 'view') {
      const isBorrow = mode === 'borrow';
      const totalItems = Object.values(cart).reduce((a,b)=>a+b,0);
      
      // 5. Zjednodušený hlavičkový panel - už se neptá na jméno
      return (
        <div className={`p-4 rounded-2xl mb-4 shadow-lg ${isBorrow ? 'bg-slate-800 text-white' : 'bg-white border-2 border-green-500'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`font-bold flex items-center gap-2 ${!isBorrow && 'text-slate-800'}`}>
              {isBorrow ? <ArrowUpRight className="text-orange-400"/> : <ArrowDownLeft className="text-green-500"/>}
              {isBorrow ? 'VYPŮJČIT' : 'VRÁTIT MOJE VĚCI'}
            </h3>
            <button onClick={() => { setMode('view'); setCart({}); }}><X className={`w-5 h-5 ${isBorrow ? 'text-slate-400' : 'text-slate-500'}`}/></button>
          </div>
          
          <p className={`text-sm mb-3 font-medium ${isBorrow ? 'text-slate-400' : 'text-slate-500'}`}>
             {isBorrow ? `Půjčuješ si jako: ${currentUser}` : `Zobrazuji jen položky, které má půjčené: ${currentUser}`}
          </p>

          <button onClick={handleConfirmAction} disabled={totalItems === 0} className={`w-full font-bold py-3 rounded-xl disabled:opacity-50 ${isBorrow ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>Potvrdit {isBorrow ? 'výpůjčku' : 'vrácení'} ({totalItems} ks)</button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => setIsAdding(true)} className="bg-white border-2 border-blue-500 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 shadow-sm active:scale-95 transition-transform"><Plus className="w-5 h-5 text-blue-600" /><span className="text-[10px] font-bold uppercase">Přidat</span></button>
        <button onClick={() => setMode('borrow')} className="bg-white border-2 border-orange-200 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 shadow-sm active:scale-95 transition-transform"><ArrowUpRight className="w-5 h-5 text-orange-500" /><span className="text-[10px] font-bold uppercase">Vypůjčit</span></button>
        <button onClick={() => setMode('return')} className="bg-white border-2 border-green-200 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 shadow-sm active:scale-95 transition-transform"><ArrowDownLeft className="w-5 h-5 text-green-500" /><span className="text-[10px] font-bold uppercase">Vrátit</span></button>
      </div>
    );
  };

  // ... (Zbytek renderování ItemListu je stejný, jen smažeme prázdný stav pro 'return' co byl závislý na potvrzení jména) ...
  
  if (isAdding) {
      // (Stejný kód pro formulář přidání)
      return (
      <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-blue-500 mb-4 animate-in zoom-in">
        <h3 className="font-bold mb-3 text-lg">Přidat</h3>
        <form action={async (fd) => { setIsProcessing(true); await createItem(fd); setIsProcessing(false); setIsAdding(false); }} className="space-y-3">
            <input name="name" autoFocus placeholder="Název" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800" required />
            <div className="flex gap-2">
                <input name="box" placeholder="Box" className="w-1/3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm" />
                <input name="quantity" type="number" placeholder="Ks" className="w-2/3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm" />
            </div>
            <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-xs font-bold text-slate-400">Zrušit</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold">Uložit</button>
            </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* Loading Overlay (stejný) */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      )}

      {renderTopMenu()}

      {/* SEARCH BAR (stejný) */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-[2]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Hledat..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-9 pr-3 py-3 bg-white border border-slate-400 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium" 
          />
        </div>

        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
             <ArrowUpDown className="w-4 h-4 text-slate-500" />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-9 pr-2 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none text-slate-700 truncate"
          >
            <option value="available">Dostupné</option>
            <option value="unavailable">Nedostupné</option>
            <option value="name_asc">A-Z</option>
            <option value="name_desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="space-y-2">
        {sortedItems.map((item) => {
          const totalBorrowed = item.loans.reduce((a,b)=>a+b.quantity,0);
          // 6. Tady počítáme kolik má půjčeno PŘIHLÁŠENÝ uživatel
          const userBorrowedCount = item.loans.filter(l => l.borrower_name.toLowerCase() === currentUser.toLowerCase()).reduce((a,b) => a + b.quantity, 0);
          const maxLimit = mode === 'return' ? userBorrowedCount : item.quantity;
          
          if (mode === 'return' && userBorrowedCount === 0) return null;

          const borderClass = item.quantity > 0 
            ? "border-emerald-200 shadow-sm" 
            : "border-red-200 bg-red-50/30 shadow-sm";

          return (
            <div key={item.id} className={`bg-white rounded-xl border-2 overflow-hidden ${borderClass}`}>
              
              <div className="flex items-center p-3 gap-2">
                
                {/* NÁZEV */}
                <div className="flex-1 min-w-0 pr-1">
                  <span className="font-bold text-slate-800 text-sm block leading-tight break-words">{item.name}</span>
                  {totalBorrowed > 0 && (
                      <span className="text-[10px] text-orange-600 font-bold block mt-1">
                          {totalBorrowed} ks půjčeno
                      </span>
                  )}
                </div>

                {/* INFO */}
                <div className="flex flex-col items-center justify-center border-l border-r border-slate-100 px-1.5 min-w-[45px]">
                   <div className="text-[9px] text-slate-400 uppercase leading-none mb-1">Box {item.box || '-'}</div>
                   <div className={`text-lg font-black leading-none ${item.quantity === 0 ? 'text-red-500' : 'text-slate-800'}`}>
                     {mode === 'view' ? item.quantity : (mode === 'borrow' ? item.quantity : totalBorrowed)}
                   </div>
                   <div className="text-[8px] text-slate-300 uppercase leading-none mt-0.5">ks</div>
                </div>

                {/* AKCE */}
                <div className="pl-1">
                {mode === 'view' ? (
                   <ItemActions itemId={item.id.toString()} quantity={item.quantity} />
                ) : (
                    <div className={`flex items-center gap-1 p-1 rounded-lg ${mode === 'borrow' ? 'bg-orange-50' : 'bg-green-50'}`}>
                        <button onClick={() => updateCart(item.id.toString(), -1, maxLimit)} className={`w-7 h-7 flex items-center justify-center rounded-md ${mode === 'borrow' ? 'text-orange-600 bg-white shadow-sm' : 'text-green-600 bg-white shadow-sm'}`}>
                          <Minus className="w-3 h-3 stroke-[3px]"/>
                        </button>
                        <span className={`w-5 text-center font-bold text-sm ${mode === 'borrow' ? 'text-orange-700' : 'text-green-700'}`}>
                          {cart[item.id.toString()] || 0}
                        </span>
                        <button onClick={() => updateCart(item.id.toString(), 1, maxLimit)} disabled={cart[item.id.toString()] === maxLimit} className={`w-7 h-7 flex items-center justify-center rounded-md ${mode === 'borrow' ? 'text-orange-600 bg-white shadow-sm' : 'text-green-600 bg-white shadow-sm'}`}>
                          <Plus className="w-3 h-3 stroke-[3px]"/>
                        </button>
                        <div className="w-px h-5 bg-black/5 mx-0.5"></div>
                        <button 
                            onClick={() => addAllToCart(item.id.toString(), maxLimit)} 
                            disabled={cart[item.id.toString()] === maxLimit}
                            className={`w-7 h-7 flex flex-col items-center justify-center rounded-md active:scale-95 transition-transform ${mode === 'borrow' ? 'text-orange-700 bg-orange-200/50 hover:bg-orange-200' : 'text-green-700 bg-green-200/50 hover:bg-green-200'}`}
                        >
                            <ChevronsRight className="w-4 h-4 stroke-[3px]" />
                        </button>
                    </div>
                )}
                </div>
              </div>

              {/* SEZNAM DLUŽNÍKŮ - Zvýraznění aktuálního uživatele */}
              {item.loans.length > 0 && (mode === 'view' || mode === 'return') && (
                <div className="bg-slate-50 border-t border-slate-100 px-3 py-2 flex flex-wrap gap-2">
                  {item.loans.map(loan => {
                    const isMe = loan.borrower_name.toLowerCase() === currentUser.toLowerCase();
                    return (
                        <div key={loan.id} className={`flex items-center gap-1 border px-2 py-1 rounded-md shadow-sm ${isMe ? 'bg-blue-100 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-200'}`}>
                        <User className={`w-3 h-3 ${isMe ? 'text-blue-500' : 'text-slate-400'}`} />
                        
                        <span className={`text-[10px] font-bold ${isMe ? 'text-blue-900' : 'text-slate-700'}`}>{loan.borrower_name} :</span>
                        <span className="text-[10px] font-bold text-orange-600">{loan.quantity}ks</span>
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Prázdný stav při vracení */}
        {mode === 'return' && sortedItems.length === 0 && (
          <div className="text-center py-10 animate-in fade-in">
              <p className="text-slate-500 font-medium text-lg">Nemáš nic půjčené. 👍</p>
              <button onClick={() => setMode('view')} className="mt-4 text-sm text-blue-600 font-bold underline">Zpět na přehled</button>
          </div>
        )}
      </div>
    </div>
  );
}