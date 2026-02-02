'use client'

import { useState } from "react";
import { Search, Plus, Minus, User, Loader2, ChevronDown, ChevronUp, PackagePlus, ArrowUpRight, ArrowDownLeft, Trash2, Filter, Check } from "lucide-react";
import { borrowItems, returnItemsFromBorrower, updateItemQuantity, deleteItem } from "@/actions/items";
import AddItemForm from "./AddItemForm"; // <--- Nový import

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
  const [amount, setAmount] = useState<number | string>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // Toto ovládá viditelnost formuláře
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- LOGIKA ---
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") { setAmount(""); return; }
    const num = parseInt(val);
    if (isNaN(num)) return; 
    if (num < 0) return;    
    if (num > 1000) { setAmount(1000); return; }
    setAmount(num);
  };

  const handleAmountBlur = () => {
    if (amount === "" || amount === 0) setAmount(1);
  };

  const updateAmountByButton = (delta: number) => {
    const currentVal = typeof amount === 'string' ? 0 : amount;
    const newVal = currentVal + delta;
    if (newVal < 0 || newVal > 1000) return;
    setAmount(newVal);
  };

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

  const handleAction = async (actionType: 'add' | 'borrow' | 'return', itemId: string, itemName: string) => {
    const finalAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    if (!finalAmount || finalAmount <= 0) return alert("Množství musí být větší než 0");
    setIsProcessing(true);
    try {
      if (actionType === 'add') await updateItemQuantity(itemId, finalAmount);
      else if (actionType === 'borrow') await borrowItems(currentUser, { [itemId]: finalAmount });
      else if (actionType === 'return') await returnItemsFromBorrower(currentUser, { [itemId]: finalAmount });
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
  // Poznámka: Zde jsme odstranili ten velký blok if (isAdding) return ..., 
  // místo toho renderujeme AddItemForm jako komponentu na konci.

  return (
    <div className="relative">
      {/* Loading overlay pro hlavní stránku */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center animate-in fade-in">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Komponenta pro přidání nové položky */}
      <AddItemForm isOpen={isAdding} onClose={() => setIsAdding(false)} />

      {/* === HLAVNÍ LIŠTA === */}
      <div className="sticky top-0 z-50 bg-[#F1F5F9] pt-5 pb-5">
          <div className="flex gap-2 items-stretch h-[65px]">
            {/* HLEDÁNÍ */}
            <div className="relative flex-1 shadow-2xl rounded-2xl bg-white border-2 border-transparent focus-within:border-blue-100 transition-all">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                placeholder="Hledat..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-11 pr-4 h-full bg-transparent border-none rounded-2xl text-base font-medium focus:outline-none placeholder:text-slate-400 text-slate-800" 
              />
            </div>

            {/* FILTR */}
            <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="h-full flex items-center gap-2 px-4 bg-white text-slate-700 shadow-2xl rounded-2xl transition-all active:scale-95 hover:bg-slate-50 border-2 border-transparent hover:border-slate-100"
                >
                   {sortBy === 'my_items' ? <User className="w-5 h-5 text-slate-700" /> : <Filter className="w-5 h-5 text-slate-700" />}
                   <span className="hidden sm:block text-xs font-bold max-w-[100px] truncate">
                      {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                   </span>
                   <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {SORT_OPTIONS.map((option) => (
                              <button
                                  key={option.value}
                                  onClick={() => { setSortBy(option.value); setIsDropdownOpen(false); }}
                                  className={`
                                      w-full text-left px-5 py-4 text-sm font-bold flex items-center justify-between transition-colors border-b border-slate-50 last:border-0
                                      ${sortBy === option.value ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                                  `}
                              >
                                  {option.label}
                                  {sortBy === option.value && <Check className="w-4 h-4 text-slate-900" />}
                              </button>
                          ))}
                      </div>
                    </>
                )}
            </div>
            
            {/* TLAČÍTKO PŘIDAT - Otevírá AddItemForm */}
            <button 
                onClick={() => setIsAdding(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white w-[60px] h-[60px] rounded-2xl shadow-2xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center shrink-0"
            >
                <Plus className="w-7 h-7 stroke-[3px]" />
            </button>
          </div>
      </div>

      {/* SEZNAM POLOŽEK */}
      <div className="space-y-3 pb-20 pt-2">
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

                    {/* === INPUT S MNOŽSTVÍM === */}
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => updateAmountByButton(-1)} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform hover:bg-slate-100">
                            <Minus className="w-5 h-5 text-slate-600" />
                        </button>
                        
                        <div className="flex-1 relative">
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={handleAmountChange}
                                onBlur={handleAmountBlur}
                                className="w-full text-center text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2 focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">ks</span>
                        </div>

                        <button onClick={() => updateAmountByButton(1)} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform hover:bg-slate-100">
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
                            disabled={item.quantity < (typeof amount === 'string' ? 0 : amount)}
                            className="flex flex-col items-center justify-center gap-1 bg-orange-50 border-2 border-orange-100 hover:bg-orange-100 text-orange-600 p-3 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            <ArrowUpRight className="w-6 h-6 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase">Půjčit</span>
                        </button>

                        <button 
                            onClick={() => handleAction('return', item.id.toString(), item.name)}
                            disabled={myLoanQty < (typeof amount === 'string' ? 0 : amount)} 
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