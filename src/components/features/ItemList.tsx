'use client'

import { useState } from "react";
import { Search, Plus, Minus, User, ArrowUpDown, Loader2, ChevronDown, ChevronUp, PackagePlus, ArrowUpRight, ArrowDownLeft, Trash2, Filter, Check } from "lucide-react";
import { borrowItems, returnItemsFromBorrower, updateItemQuantity, deleteItem, createItem } from "@/actions/items";

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

// Definice možností řazení pro hezčí kód
const SORT_OPTIONS = [
  { value: 'available', label: 'Dostupné nejdřív' },
  { value: 'unavailable', label: 'Nedostupné nejdřív' },
  { value: 'name_asc', label: 'Od A do Z' },
  { value: 'name_desc', label: 'Od Z do A' },
  { value: 'my_items', label: 'Jen moje výpůjčky' },
];

export default function ItemList({ initialItems, currentUser }: { initialItems: Item[], currentUser: string }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("available"); 
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Stav pro otevření/zavření našeho vlastního dropdownu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- FILTROVÁNÍ A ŘAZENÍ ---
  const searchedItems = initialItems.filter((item) => {
    return item.name.toLowerCase().includes(search.toLowerCase()) || 
           (item.box && item.box.toLowerCase().includes(search.toLowerCase()));
  });

  const filteredItems = searchedItems.filter((item) => {
    if (sortBy === 'my_items') {
        return item.loans.some(l => l.borrower_name.toLowerCase() === currentUser.toLowerCase() && l.quantity > 0);
    }
    return true;
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
      case "my_items": return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  // --- AKCE ---
  const handleAction = async (actionType: 'add' | 'borrow' | 'return', itemId: string, itemName: string) => {
    if (amount <= 0) return alert("Množství musí být větší než 0");
    setIsProcessing(true);
    try {
      if (actionType === 'add') await updateItemQuantity(itemId, amount);
      else if (actionType === 'borrow') await borrowItems(currentUser, { [itemId]: amount });
      else if (actionType === 'return') await returnItemsFromBorrower(currentUser, { [itemId]: amount });
      setAmount(1);
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
    if (expandedId === id) setExpandedId(null);
    else { setExpandedId(id); setAmount(1); }
  };

  // --- RENDER ---
  if (isAdding) {
     return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in">
                <h2 className="font-bold text-xl mb-4 text-slate-800">Nová položka</h2>
                <form action={async (fd) => { setIsProcessing(true); await createItem(fd); setIsProcessing(false); setIsAdding(false); }} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Název</label>
                        <input name="name" autoFocus placeholder="Např. Vrtačka" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Box</label>
                            <input name="box" placeholder="A1" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="w-2/3">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Počet ks</label>
                            <input name="quantity" type="number" placeholder="0" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Zrušit</button>
                        <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Uložit</button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center animate-in fade-in">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* === HLAVNÍ HEADER (STICKY) === 
         Oprava: sticky top-0 + bg-[#F1F5F9] (barva pozadí body)
         Tím se vytvoří "neprůhledná vrstva", za kterou se věci schovají.
      */}
      <div className="sticky top-0 z-50 bg-[#F1F5F9] pt-4 pb-2">
          
          {/* HORNÍ LIŠTA S HLEDÁNÍM */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-[2] shadow-lg rounded-xl bg-white">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Hledat..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-9 pr-3 py-3 bg-transparent border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-400 text-slate-800" 
              />
            </div>
            
            <button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center w-12 shrink-0">
                <Plus className="w-6 h-6 stroke-[3px]" />
            </button>
          </div>

          {/* VLASTNÍ DROPDOWN (Už ne <select>) */}
          <div className="flex justify-end px-1 relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all bg-white
                    ${sortBy === 'my_items' ? 'text-blue-700 border-blue-200' : 'text-slate-600 border-slate-200'}
                `}
              >
                 {sortBy === 'my_items' ? <User className="w-3 h-3 text-blue-600" /> : <Filter className="w-3 h-3 text-slate-500" />}
                 
                 {/* Zobrazíme text aktuálně vybrané možnosti */}
                 <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                 
                 <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ROZBALOVACÍ MENU (Absolutní pozice) */}
              {isDropdownOpen && (
                  <>
                    {/* Neviditelná vrstva přes celou obrazovku, aby kliknutí vedle zavřelo menu */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                    
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {SORT_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => { setSortBy(option.value); setIsDropdownOpen(false); }}
                                className={`
                                    w-full text-left px-4 py-3 text-xs font-bold flex items-center justify-between transition-colors
                                    ${sortBy === option.value ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                                `}
                            >
                                {option.label}
                                {/* Zobrazíme "fajfku" u vybraného, ale žádné modré pozadí */}
                                {sortBy === option.value && <Check className="w-3 h-3 text-slate-900" />}
                            </button>
                        ))}
                    </div>
                  </>
              )}
          </div>
      </div>

      {/* SEZNAM POLOŽEK */}
      <div className="space-y-3 pb-20">
        {sortedItems.map((item) => {
          const isExpanded = expandedId === item.id.toString();
          
          const totalBorrowed = item.loans.reduce((a,b)=>a+b.quantity,0);
          const myLoan = item.loans.find(l => l.borrower_name.toLowerCase() === currentUser.toLowerCase());
          const myLoanQty = myLoan ? myLoan.quantity : 0;

          const borderClass = isExpanded 
            ? "border-blue-500 ring-4 ring-blue-500/10 z-10 relative shadow-xl scale-[1.02]" 
            : (item.quantity > 0 ? "border-slate-100 hover:border-slate-200" : "border-red-100 bg-red-50/30");

          return (
            <div key={item.id} className={`bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm overflow-hidden ${borderClass}`}>
              
              <div onClick={() => toggleExpand(item.id.toString())} className="p-4 flex items-center gap-3 cursor-pointer select-none">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors ${item.quantity > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-500'}`}>
                    {item.quantity > 0 ? <PackagePlus className="w-5 h-5"/> : <ArrowDownLeft className="w-5 h-5"/>}
                    {item.box && <span className="text-[9px] font-bold uppercase mt-0.5">{item.box}</span>}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 leading-tight truncate pr-2">{item.name}</h3>
                    <div className="flex gap-2 mt-1 items-center">
                        <span className={`text-xs font-bold ${item.quantity > 0 ? 'text-slate-500' : 'text-red-500'}`}>
                            Skladem: {item.quantity} ks
                        </span>
                        {totalBorrowed > 0 && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-bold flex items-center whitespace-nowrap">
                                Půjčeno {totalBorrowed}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-slate-300">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 w-full mb-4"></div>

                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => setAmount(Math.max(1, amount - 1))} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform hover:bg-slate-100">
                            <Minus className="w-5 h-5 text-slate-600" />
                        </button>
                        
                        <div className="flex-1 relative">
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                className="w-full text-center text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">ks</span>
                        </div>

                        <button onClick={() => setAmount(amount + 1)} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform hover:bg-slate-100">
                            <Plus className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <button 
                            onClick={() => handleAction('add', item.id.toString(), item.name)}
                            className="flex flex-col items-center justify-center gap-1 bg-emerald-50 border-2 border-emerald-100 hover:bg-emerald-100 text-emerald-700 p-3 rounded-xl transition-colors active:scale-95"
                        >
                            <Plus className="w-6 h-6 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase">Přidat</span>
                        </button>

                        <button 
                            onClick={() => handleAction('borrow', item.id.toString(), item.name)}
                            disabled={item.quantity < amount}
                            className="flex flex-col items-center justify-center gap-1 bg-orange-50 border-2 border-orange-100 hover:bg-orange-100 text-orange-600 p-3 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            <ArrowUpRight className="w-6 h-6 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase">Půjčit</span>
                        </button>

                        <button 
                            onClick={() => handleAction('return', item.id.toString(), item.name)}
                            disabled={myLoanQty < amount} 
                            className="flex flex-col items-center justify-center gap-1 bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 text-blue-600 p-3 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            <ArrowDownLeft className="w-6 h-6 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase">Vrátit</span>
                        </button>
                    </div>

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

                    <div className="flex justify-center mt-2">
                        <button onClick={() => handleDelete(item.id.toString())} className="text-red-400 text-xs font-bold flex items-center gap-1 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                            Smazat položku
                        </button>
                    </div>

                </div>
              )}
            </div>
          );
        })}

        {sortedItems.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-medium animate-in fade-in">
                {sortBy === 'my_items' ? 'Nemáš žádné výpůjčky 👍' : 'Nic se nenašlo 👻'}
            </div>
        )}
      </div>
    </div>
  );
}