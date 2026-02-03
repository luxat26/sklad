import { getWarehouseItems } from "@/services/items";
import ItemList from "@/components/features/ItemList";
import GeneralInfo from "@/components/features/GeneralInfo"; // <--- Import
import { getGeneralInfo } from "@/actions/info"; // <--- Import akce
import { Package, LogOut } from "lucide-react";
import { cookies } from "next/headers";
import { logoutAction } from "@/actions/auth";

export default async function Dashboard() {
  const items = await getWarehouseItems();
  const infoText = await getGeneralInfo(); // <--- Načteme text nástěnky
  
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("warehouse_user")?.value || "Neznámý";

  return (
    <main className="min-h-screen bg-[#F1F5F9] pb-20 px-4 font-sans">
      <header className="max-w-md mx-auto py-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" /> SKLAD
          </h1>
          <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-wider pl-1">
            Přihlášen: <span className="text-blue-600">{currentUser}</span>
          </p>
        </div>

        {/* Tlačítka vpravo nahoře */}
        <div className="flex gap-2">
            {/* 1. INFO TLAČÍTKO */}
            <GeneralInfo initialText={infoText} />

            {/* 2. LOGOUT TLAČÍTKO */}
            <form action={logoutAction}>
                <button className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 shadow-sm transition-colors active:scale-95">
                    <LogOut className="w-5 h-5" />
                </button>
            </form>
        </div>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        <ItemList initialItems={items} currentUser={currentUser} />
      </div>
    </main>
  );
}