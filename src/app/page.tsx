import { getWarehouseItems } from "@/services/items";
import AddItemForm from "@/components/features/AddItemForm";
import ItemList from "@/components/features/ItemList";
import { Package, LogOut } from "lucide-react";
import { cookies } from "next/headers"; // Potřeba pro čtení cookie
import { logoutAction } from "@/actions/auth";

export default async function Dashboard() {
  const items = await getWarehouseItems();
  
  // 1. Zjistíme, kdo je přihlášený
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

        {/* 2. Tlačítko Logout */}
        <form action={logoutAction}>
            <button className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 shadow-sm transition-colors">
                <LogOut className="w-5 h-5" />
            </button>
        </form>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        <AddItemForm />
        
        {/* 3. Posíláme currentUser do ItemList */}
        <ItemList initialItems={items} currentUser={currentUser} />
      </div>
    </main>
  );
}