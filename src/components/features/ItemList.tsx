'use client'

import { useState, useMemo } from "react";
import { Search, Plus, Minus, User, Loader2, ChevronDown, ChevronUp, PackagePlus, ArrowUpRight, ArrowDownLeft, Filter, Check, Box, Pencil, X, StickyNote, PackageOpen, Undo2 } from "lucide-react"; 
import { borrowItems, returnItemsFromBorrower, updateItemQuantity, updateItemDetails, borrowEntireBox, returnEntireBox } from "@/actions/items"; // <--- NOVÉ IMPORTY
import AddItemForm from "./AddItemForm";

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
  note: string | null;
  loans: Loan[] 
};

const SORT_OPTIONS = [
  { value: 'available', label: 'Dostupné nejdřív' },
  { value: 'unavailable', label: 'Nedostupné nejdřív' },
  { value: 'name_asc', label: 'Od A do Z' },
  { value: 'name_desc', label: 'Od Z do A' },
  { value: 'my_items', label: 'Jen moje výpůjčky' },
];

function normalizeText(text: string) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function ItemList({ initialItems, currentUser }: { initialItems: Item[], currentUser: string }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("available");
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | string>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // === STAVY PRO EDITACI ===
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: "", box: "", note: "" });

  const uniqueBoxes = useMemo(() => {
    const boxes = initialItems
      .map(i => i.box)
      .filter((b): b is string => typeof b === 'string' && b.trim() !== "");
    return Array.from(new Set(boxes)).sort();
  }, [initialItems]);

  // --- NOVÉ: LOGIKA PRO BOX PANEL ---
  // Spočítáme statistiky pro aktuálně vybraný box
  const boxStats = useMemo(() => {
    if (!selectedBox) return null;
    
    const itemsInBox = initialItems.filter(i => i.box === selectedBox);
    const totalItems = itemsInBox.length;
    // Položky, které jsou alespoň částečně skladem
    const availableItemsCount = itemsInBox.filter(i => i.quantity > 0).length;
    // Položky, kde mám já alespoň něco půjčeno
    const myBorrowedItemsCount = itemsInBox.filter(i => 
        i.loans.some(l => l.borrower_name.toLowerCase() === currentUser.toLowerCase())
    ).length;

    return { totalItems, availableItemsCount, myBorrowedItemsCount, itemsInBox };
  }, [selectedBox, initialItems, currentUser]);

  const handleBorrowEntireBox = async () => {
    if (!selectedBox || !boxStats) return;
    if (!confirm(`Opravdu si chceš půjčit vše dostupné z boxu "${selectedBox}"?`)) return;

    setIsProcessing(true);
    const result = await borrowEntireBox(selectedBox, currentUser);
    setIsProcessing(false);

    if (result.error) {
        alert(result.error);
    } else {
        // Logika Solution A: Zobrazíme hlášku o výsledku
        let msg = `✅ Úspěšně půjčeno ${result.borrowedCount} položek.`;
        if (result.missingCount && result.missingCount > 0) {
            msg += `\n\n⚠️ ${result.missingCount} položek nebylo k dispozici (jsou už půjčené).`;
        }
        alert(msg);
    }
  };

  const handleReturnEntireBox = async () => {
    if (!selectedBox) return;
    if (!confirm(`Vrátit vše, co máš půjčené z boxu "${selectedBox}"?`)) return;

    setIsProcessing(true);
    const result = await returnEntireBox(selectedBox, currentUser);
    setIsProcessing(false);

    if (result.error) {
        alert(result.error);
    } else {
        alert(`✅ Vráceno vše z boxu "${selectedBox}".`);
    }
  };
  // ----------------------------------

  const startEdit = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    setEditingId(item.id.toString());
    setEditValues({ name: item.name, box: item.box || "", note: item.note || "" });
    setExpandedId(item.id.toString());
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEdit = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setIsProcessing(true);
    await updateItemDetails(itemId, editValues.name, editValues.box, editValues.note);
    setEditingId(null);
    setIsProcessing(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") { setAmount(""); return; }
    const num = parseInt(val);
    if (isNaN(num)) return; if (num < 0) return; if (num > 1000) { setAmount(1000); return; }
    setAmount(num);
  };

  const handleAmountBlur = () => { if (amount === "" || amount === 0) setAmount(1); };

  const updateAmountByButton = (delta: number) => {
    const currentVal = typeof amount === 'string' ? 0 : amount;
    const newVal = currentVal + delta;
    if (newVal < 0 || newVal > 1000) return;
    setAmount(newVal);
  };

  const searchedItems = initialItems.filter((item) => {
    if (!search) return true;
    const searchTerms = normalizeText(search).split(" ").filter(t => t.length > 0);
    const normalizedName = normalizeText(item.name);
    return searchTerms.every(term => {
        return normalizedName.startsWith(term) || normalizedName.includes(" " + term);
    });
  });

  const filteredItems = searchedItems.filter((item) => {
    if (sortBy === 'my_items') {
        const hasMyLoan = item.loans.some(l => l.borrower_name.toLowerCase() === currentUser.toLowerCase() && l.quantity > 0);
        if (!hasMyLoan) return false;
    }
    if (selectedBox) {
        if (item.box !== selectedBox) return false;
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aIsAvailable = a.quantity > 0;
    const bIsAvailable = b.quantity > 0;
    switch (sortBy) {
      case "available": 
        if (aIsAvailable && !bIsAvailable) return -1; if (!aIsAvailable && bIsAvailable) return 1; return a.name.localeCompare(b.name);
      case "unavailable": 
        if (!aIsAvailable && bIsAvailable) return -1; if (aIsAvailable && !bIsAvailable) return 1; return a.name.localeCompare(b.name);
      case "name_asc": return a.name.localeCompare(b.name);
      case "name_desc": return b.name.localeCompare(a.name);
      case "my_items": return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const handleAction = async (actionType: 'add' | 'remove' | 'borrow' | 'return', itemId: string, itemName: string) => {
    const finalAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    if (!finalAmount || finalAmount <= 0) return alert("Množství musí být větší než 0");

    if (actionType === 'add' && !confirm(`Opravdu chceš PŘIDAT ${finalAmount} ks k položce "${itemName}"?`)) return;
    if (actionType === 'remove' && !confirm(`Opravdu chceš ODEBRAT ${finalAmount} ks od položky "${itemName}"?`)) return;

    setIsProcessing(true);
    try {
      if (actionType === 'add') await updateItemQuantity(itemId, finalAmount);
      else if (actionType === 'remove') await updateItemQuantity(itemId, -finalAmount);
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

  const toggleExpand = (id: string) => {
    if (editingId) return; 
    if (expandedId === id) setExpandedId(null);
    else { setExpandedId(id); setAmount(1); }
  };

  return (
    <div className="relative">
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center animate-in fade-in">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      <AddItemForm isOpen={isAdding} onClose={() => setIsAdding(false)} existingBoxes={uniqueBoxes} />

      {/* HLAVNÍ LIŠTA */}
      <div className="sticky top-0 z-50 bg-[#F1F5F9] pt-5 pb-2">
          {/* ... Search bar a tlačítka (beze změny) ... */}
          <div className="flex gap-2 items-stretch h-[65px] mb-3">
            <div className="relative flex-1 shadow-2xl rounded-2xl bg-white border-2 border-transparent focus-within:border-blue-100 transition-all">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input placeholder="Hledat..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 h-full bg-transparent border-none rounded-2xl text-base font-medium focus:outline-none placeholder:text-slate-400 text-slate-800" />
            </div>
            <div className="relative">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="h-full flex items-center gap-2 px-4 bg-white text-slate-700 shadow-2xl rounded-2xl transition-all active:scale-95 hover:bg-slate-50 border-2 border-transparent hover:border-slate-100">
                   {sortBy === 'my_items' ? <User className="w-5 h-5 text-slate-700" /> : <Filter className="w-5 h-5 text-slate-700" />}
                   <span className="hidden sm:block text-xs font-bold max-w-[100px] truncate">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                   <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {SORT_OPTIONS.map((option) => (
                              <button key={option.value} onClick={() => { setSortBy(option.value); setIsDropdownOpen(false); }} className={`w-full text-left px-5 py-4 text-sm font-bold flex items-center justify-between transition-colors border-b border-slate-50 last:border-0 ${sortBy === option.value ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                  {option.label}
                                  {sortBy === option.value && <Check className="w-4 h-4 text-slate-900" />}
                              </button>
                          ))}
                      </div>
                    </>
                )}
            </div>
            <button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 text-white w-[60px] h-[60px] rounded-2xl shadow-2xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center shrink-0">
                <Plus className="w-7 h-7 stroke-[3px]" />
            </button>
          </div>

          {/* FILTR BOXŮ */}
          {uniqueBoxes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                <button onClick={() => setSelectedBox(null)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${selectedBox === null ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}>Vše</button>
                {uniqueBoxes.map(box => (
                    <button key={box} onClick={() => setSelectedBox(selectedBox === box ? null : box)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors border ${selectedBox === box ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        <Box className="w-3 h-3" />
                        {box}
                    </button>
                ))}
            </div>
          )}
      </div>

      {/* === NOVÝ PANEL BOXU (ZOBRAZÍ SE JEN POKUD JE VYBRÁN BOX) === */}
      {selectedBox && boxStats && (
        <div className="bg-slate-800 text-white rounded-2xl p-4 mb-4 shadow-xl animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                    <Box className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-lg font-black leading-tight">Box {selectedBox}</h2>
                    <p className="text-xs text-slate-400 font-medium">
                        Celkem {boxStats.totalItems} položek • {boxStats.availableItemsCount} dostupných
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {/* Tlačítko PŮJČIT CELÝ BOX */}
                <button 
                    onClick={handleBorrowEntireBox}
                    disabled={boxStats.availableItemsCount === 0}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                >
                    <PackageOpen className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase text-center">Půjčit vše</span>
                </button>

                {/* Tlačítko VRÁTIT CELÝ BOX */}
                <button 
                    onClick={handleReturnEntireBox}
                    disabled={boxStats.myBorrowedItemsCount === 0}
                    className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
                >
                    <Undo2 className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase text-center">Vrátit vše</span>
                </button>
            </div>
            
            {boxStats.myBorrowedItemsCount > 0 && (
                <p className="text-center text-[10px] text-orange-300 font-bold mt-3 uppercase tracking-wide">
                    Máš půjčeno: {boxStats.myBorrowedItemsCount} položek z tohoto boxu
                </p>
            )}
        </div>
      )}

      {/* SEZNAM POLOŽEK */}
      <div className="space-y-3 pb-20 pt-2">
        {/* ... zbytek seznamu zůstává beze změn ... */}
        {sortedItems.map((item) => {
          const isExpanded = expandedId === item.id.toString();
          const isEditing = editingId === item.id.toString();
          
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
                    {!isEditing && item.box && <span className="text-[9px] font-bold uppercase mt-0.5">{item.box}</span>}
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            <input value={editValues.name} onChange={(e) => setEditValues({...editValues, name: e.target.value})} className="font-bold text-slate-800 bg-slate-50 border border-blue-300 rounded-lg px-2 py-1 text-sm w-full outline-none focus:ring-2 focus:ring-blue-200" placeholder="Název" autoFocus />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Box:</span>
                                <input value={editValues.box} onChange={(e) => setEditValues({...editValues, box: e.target.value})} className="font-bold text-slate-800 bg-slate-50 border border-blue-300 rounded-lg px-2 py-0.5 text-xs w-20 outline-none focus:ring-2 focus:ring-blue-200" placeholder="Box" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="font-bold text-slate-800 leading-tight truncate pr-2">{item.name}</h3>
                            <div className="flex gap-2 mt-1 items-center">
                                <span className={`text-xs font-bold ${item.quantity > 0 ? 'text-slate-500' : 'text-red-500'}`}>Skladem: {item.quantity} ks</span>
                                {totalBorrowed > 0 && (<span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-bold flex items-center whitespace-nowrap">Půjčeno {totalBorrowed}</span>)}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 text-slate-300 pl-2">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <button onClick={(e) => saveEdit(e, item.id.toString())} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check className="w-4 h-4" /></button>
                            <button onClick={cancelEdit} className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <>
                            <button onClick={(e) => startEdit(e, item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                            <div className="p-1">{isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
                        </>
                    )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 w-full mb-4"></div>
                    {!isEditing && (
                        <div className="flex items-center gap-3 mb-4">
                            <button onClick={() => updateAmountByButton(-1)} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform hover:bg-slate-100"><Minus className="w-5 h-5 text-slate-600" /></button>
                            <div className="flex-1 relative">
                                <input type="number" value={amount} onChange={handleAmountChange} onBlur={handleAmountBlur} className="w-full text-center text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2 focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">ks</span>
                            </div>
                            <button onClick={() => updateAmountByButton(1)} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 active:scale-90 transition-transform hover:bg-slate-100"><Plus className="w-5 h-5 text-slate-600" /></button>
                        </div>
                    )}
                    {!isEditing && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <button onClick={() => handleAction('add', item.id.toString(), item.name)} className="flex flex-col items-center justify-center gap-1 bg-emerald-50 border-2 border-emerald-100 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl transition-colors active:scale-95"><Plus className="w-5 h-5 stroke-[3px]" /><span className="text-[9px] font-black uppercase">Přidat</span></button>
                            <button onClick={() => handleAction('remove', item.id.toString(), item.name)} disabled={item.quantity < (typeof amount === 'string' ? 0 : amount)} className="flex flex-col items-center justify-center gap-1 bg-rose-50 border-2 border-rose-100 hover:bg-rose-100 text-rose-700 p-2 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"><Minus className="w-5 h-5 stroke-[3px]" /><span className="text-[9px] font-black uppercase">Ubrat</span></button>
                            <button onClick={() => handleAction('borrow', item.id.toString(), item.name)} disabled={item.quantity < (typeof amount === 'string' ? 0 : amount)} className="flex flex-col items-center justify-center gap-1 bg-orange-50 border-2 border-orange-100 hover:bg-orange-100 text-orange-600 p-2 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"><ArrowUpRight className="w-5 h-5 stroke-[3px]" /><span className="text-[9px] font-black uppercase">Půjčit</span></button>
                            <button onClick={() => handleAction('return', item.id.toString(), item.name)} disabled={myLoanQty < (typeof amount === 'string' ? 0 : amount)} className="flex flex-col items-center justify-center gap-1 bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 text-blue-600 p-2 rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:grayscale"><ArrowDownLeft className="w-5 h-5 stroke-[3px]" /><span className="text-[9px] font-black uppercase">Vrátit</span></button>
                        </div>
                    )}
                    <div className="mb-4">
                        {isEditing ? (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Editace poznámky</label>
                                <textarea value={editValues.note} onChange={(e) => setEditValues({...editValues, note: e.target.value})} className="w-full p-3 bg-slate-50 border border-blue-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-200 outline-none resize-none" rows={2} placeholder="Žádná poznámka..." />
                            </div>
                        ) : (
                            item.note && (
                                <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-3 flex gap-2 items-start text-slate-600"><StickyNote className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" /><p className="text-xs font-medium leading-relaxed italic">{item.note}</p></div>
                            )
                        )}
                    </div>
                    {!isEditing && item.loans.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Aktuální výpůjčky</h4>
                            <div className="flex flex-wrap gap-2">
                                {item.loans.map(loan => {
                                    const isMe = loan.borrower_name.toLowerCase() === currentUser.toLowerCase();
                                    return (
                                        <button key={loan.id} type="button" onClick={() => { if (isMe) setAmount(loan.quantity); }} disabled={!isMe} title={isMe ? "Kliknutím nastavíš toto množství" : "Cizí výpůjčka"} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border transition-all ${isMe ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:border-blue-300 cursor-pointer active:scale-90' : 'bg-white text-slate-400 border-slate-100 cursor-default opacity-80'}`}><User className="w-3 h-3" />{loan.borrower_name}: {loan.quantity}ks</button>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Tip: Kliknutím na Tvou jmenovku rychle nastavíš počet kusů.</p>
                        </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}