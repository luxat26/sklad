'use client'

import { useState } from "react";
import { Search, Plus, ArrowUpRight, ArrowDownLeft, X, Minus, User, Check } from "lucide-react";
import ItemActions from "@/components/features/ItemActions";
import { borrowItems, returnItemsFromBorrower, createItem } from "@/actions/items";

type Loan = { id: string; borrower_name: string; quantity: number };
type Item = { id: string; name: string; quantity: number; box: string | null; loans: Loan[] };

export default function ItemList({ initialItems }: { initialItems: Item[] }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<'view' | 'borrow' | 'return'>('view');
  
  // State pro jméno a fázi vracení
  const [borrowerName, setBorrowerName] = useState("");
  const [isReturnNameConfirmed, setIsReturnNameConfirmed] = useState(false); // Nový state: je jméno pro vrácení potvrzeno?
  
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);

  // --- FILTROVÁNÍ ---
  const filteredItems = initialItems.filter((item) => {
    // 1. Základní hledání podle textu
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.box && item.box.toLowerCase().includes(search.toLowerCase()));
    
    // 2. Pokud jsme ve fázi vracení a máme jméno -> ukázat jen to, co má dotyčný půjčené
    if (mode === 'return' && isReturnNameConfirmed) {
      const userHasLoan = item.loans.some(l => l.borrower_name.toLowerCase() === borrowerName.toLowerCase());
      return matchesSearch && userHasLoan;
    }

    return matchesSearch;
  });

  // --- LOGIKA KOŠÍKU ---
  const updateCart = (id: string, delta: number, limit: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const newVal = Math.max(0, Math.min(limit, current + delta));
      if (newVal === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: newVal };
    });
  };

  // Potvrzení celé akce
  const handleConfirmAction = async () => {
    if (mode === 'borrow') {
      if (!borrowerName) return alert("Musíš zadat jméno!");
      await borrowItems(borrowerName, cart);
    } else if (mode === 'return') {
      // Voláme novou funkci pro konkrétního člověka
      await returnItemsFromBorrower(borrowerName, cart);
    }
    
    // Reset všeho
    setMode('view');
    setCart({});
    setBorrowerName("");
    setIsReturnNameConfirmed(false);
  };

  // --- HORNÍ MENU ---
  const renderTopMenu = () => {
    if (mode !== 'view') {
      const isBorrow = mode === 'borrow';
      const totalItems = Object.values(cart).reduce((a,b)=>a+b,0);
      
      // Pokud jsme v režimu Vracení, ale ještě nemáme jméno -> Zobrazit jen input na jméno
      if (mode === 'return' && !isReturnNameConfirmed) {
        return (
          <div className="bg-white border-2 border-green-500 p-4 rounded-2xl mb-4 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold flex items-center gap-2 text-slate-800">
                <ArrowDownLeft className="text-green-500"/>
                KDO VRACÍ?
              </h3>
              <button onClick={() => { setMode('view'); setBorrowerName(""); }}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            
            <input 
              placeholder="Zadejte jméno..." 
              value={borrowerName}
              onChange={e => setBorrowerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 text-slate-900 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-green-500 outline-none"
              autoFocus
            />

            <button 
              onClick={() => {
                if(!borrowerName) return alert("Zadej jméno!");
                setIsReturnNameConfirmed(true); // Tím se přepneme do výběru položek
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Pokračovat k výběru
            </button>
          </div>
        );
      }

      // Standardní menu pro Půjčení NEBO pro Vracení (když už je jméno potvrzeno)
      return (
        <div className={`p-4 rounded-2xl mb-4 shadow-lg animate-in slide-in-from-top-2 ${isBorrow ? 'bg-slate-800 text-white' : 'bg-white border-2 border-green-500'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`font-bold flex items-center gap-2 ${!isBorrow && 'text-slate-800'}`}>
              {isBorrow ? <ArrowUpRight className="text-orange-400"/> : <ArrowDownLeft className="text-green-500"/>}
              {isBorrow ? 'VYPŮJČIT' : `VRACÍ: ${borrowerName}`}
            </h3>
            <button onClick={() => { setMode('view'); setCart({}); setBorrowerName(""); setIsReturnNameConfirmed(false); }}><X className={`w-5 h-5 ${isBorrow ? 'text-slate-400' : 'text-slate-500'}`}/></button>
          </div>
          
          {isBorrow && (
            <input 
              placeholder="Jméno (kdo si půjčuje?)" 
              value={borrowerName}
              onChange={e => setBorrowerName(e.target.value)}
              className="w-full bg-slate-700 border-none rounded-xl px-4 py-3 mb-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400 outline-none"
              autoFocus
            />
          )}
          
          <button 
             onClick={handleConfirmAction}
             disabled={totalItems === 0}
             className={`w-full font-bold py-3 rounded-xl transition-colors disabled:opacity-50 ${
               isBorrow 
                 ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                 : 'bg-green-500 hover:bg-green-600 text-white'
             }`}
           >
             Potvrdit {isBorrow ? 'výpůjčku' : 'vrácení'} ({totalItems} ks)
           </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => setIsAdding(true)} className="bg-white border-2 border-blue-500 hover:bg-blue-50 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 shadow-sm active:scale-95 transition-transform">
          <Plus className="w-5 h-5 text-blue-600" />
          <span className="text-[10px] font-bold uppercase">Přidat</span>
        </button>
        <button onClick={() => setMode('borrow')} className="bg-white border-2 border-orange-200 hover:bg-orange-50 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 shadow-sm active:scale-95 transition-transform">
          <ArrowUpRight className="w-5 h-5 text-orange-500" />
          <span className="text-[10px] font-bold uppercase">Vypůjčit</span>
        </button>
        <button onClick={() => setMode('return')} className="bg-white border-2 border-green-200 hover:bg-green-50 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 shadow-sm active:scale-95 transition-transform">
          <ArrowDownLeft className="w-5 h-5 text-green-500" />
          <span className="text-[10px] font-bold uppercase">Vrátit</span>
        </button>
      </div>
    );
  };

  // --- INLINE FORMULÁŘ PŘIDAT ---
  if (isAdding) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-blue-500 mb-4 animate-in zoom-in">
        <h3 className="font-bold mb-3 text-lg">Přidat</h3>
        <form action={async (fd) => { await createItem(fd); setIsAdding(false); }} className="space-y-3">
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
      {renderTopMenu()}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Hledat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        {filteredItems.map((item) => {
          const totalBorrowed = item.loans.reduce((a,b)=>a+b.quantity,0);
          
          // Kolik má půjčeno KONKRÉTNÍ uživatel (pro limit vracení)
          const userBorrowedCount = item.loans
            .filter(l => l.borrower_name.toLowerCase() === borrowerName.toLowerCase())
            .reduce((a,b) => a + b.quantity, 0);

          const maxLimit = mode === 'return' ? userBorrowedCount : item.quantity;

          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              <div className="flex items-center h-14 px-3 gap-2 relative">
                
                {/* 1. NÁZEV */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="font-bold text-slate-800 text-sm truncate leading-tight">{item.name}</span>
                  {totalBorrowed > 0 && (
                      <span className="text-[10px] text-orange-600 font-bold mt-0.5">
                          {totalBorrowed} ks půjčeno
                      </span>
                  )}
                </div>

                {/* 2. BOX */}
                <div className="flex flex-col items-center justify-center w-12 border-r border-slate-100 pr-2">
                   <span className="text-[9px] text-black leading-none mb-0.5">Box č:</span>
                   <span className="text-xs font-bold text-black uppercase">{item.box || '-'}</span>
                </div>

                {/* 3. POČET + AKCE */}
                {mode === 'view' ? (
                    // VIEW MODE
                    <div className="flex items-center gap-2 pl-1">
                        <div className="flex flex-col items-end min-w-[30px]">
                            <span className="text-[9px] text-black leading-none mb-0.5">počet:</span>
                            <span className="text-lg font-black text-black block leading-none">{item.quantity}</span>
                        </div>
                        <div className="scale-90 origin-right"> 
                          <ItemActions itemId={item.id} quantity={item.quantity} />
                        </div>
                    </div>
                ) : (
                    // BORROW / RETURN MODE
                    <div className="flex items-center gap-2 pl-1">
                        <div className="flex flex-col items-end min-w-[30px] opacity-50">
                            <span className="text-[9px] text-black leading-none mb-0.5">počet:</span>
                            <span className="text-sm font-bold text-black block leading-none">{item.quantity}</span>
                        </div>

                        <div className={`flex items-center gap-1 p-1 rounded-lg ${mode === 'borrow' ? 'bg-orange-50' : 'bg-green-50'}`}>
                            <button 
                              onClick={() => updateCart(item.id, -1, maxLimit)} 
                              className={`p-1 rounded ${mode === 'borrow' ? 'text-orange-600 hover:bg-orange-100' : 'text-green-600 hover:bg-green-100'}`}
                            >
                              <Minus className="w-4 h-4 stroke-[3px]"/>
                            </button>
                            
                            <span className={`w-6 text-center font-bold text-lg ${mode === 'borrow' ? 'text-orange-700' : 'text-green-700'}`}>
                              {cart[item.id] || 0}
                            </span>
                            
                            <button 
                              onClick={() => updateCart(item.id, 1, maxLimit)} 
                              className={`p-1 rounded ${mode === 'borrow' ? 'text-orange-600 hover:bg-orange-100' : 'text-green-600 hover:bg-green-100'}`}
                              disabled={cart[item.id] === maxLimit}
                            >
                              <Plus className="w-4 h-4 stroke-[3px]"/>
                            </button>
                        </div>
                    </div>
                )}
              </div>

              {/* SEZNAM DLUŽNÍKŮ */}
              {item.loans.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 px-3 py-2 flex flex-wrap gap-2">
                  {item.loans.map(loan => (
                    <div key={loan.id} className={`flex items-center gap-1 border px-2 py-1 rounded-md shadow-sm ${
                        mode === 'return' && isReturnNameConfirmed && loan.borrower_name.toLowerCase() === borrowerName.toLowerCase() 
                        ? 'bg-green-100 border-green-300' // Zvýraznit uživatele, který vrací
                        : 'bg-white border-slate-200'
                    }`}>
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-700">{loan.borrower_name}:</span>
                      <span className="text-[10px] font-bold text-orange-600">{loan.quantity}ks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Info pro prázdný list při vracení */}
        {mode === 'return' && isReturnNameConfirmed && filteredItems.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
             <p className="text-slate-500 font-medium">Tento uživatel nemá nic půjčeno. 👍</p>
             <button onClick={() => setMode('view')} className="mt-2 text-sm text-blue-600 font-bold underline">Zpět na přehled</button>
          </div>
        )}
      </div>
    </div>
  );
}