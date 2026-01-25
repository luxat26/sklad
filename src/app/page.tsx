import { getWarehouseItems } from "@/services/items";
import AddItemForm from "@/components/features/AddItemForm";
import ItemList from "@/components/features/ItemList"; // Import nové komponenty
import { Package } from "lucide-react";

export default async function Dashboard() {
  const items = await getWarehouseItems();

  return (
    <main className="min-h-screen bg-[#F1F5F9] pb-20 px-4 font-sans">
      <header className="max-w-md mx-auto py-8">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" /> SKLAD
        </h1>
        <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-wider pl-1">
          {items.length} položek v evidenci
        </p>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        {/* Formulář necháme nahoře */}
        <AddItemForm />

        {/* Místo vypisování map() tady vložíme naši chytrou komponentu */}
        <ItemList initialItems={items} />
      </div>
    </main>
  );
}