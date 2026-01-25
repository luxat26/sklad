import { createClient } from "@/lib/supabase/server";

export async function getWarehouseItems() {
  const supabase = await createClient();
  
  // Načteme položky A k nim připojené výpůjčky
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      loans (
        id,
        borrower_name,
        quantity,
        borrowed_at
      )
    `)
    .order('name');

  if (error) {
    console.error("Chyba DB:", error);
    return [];
  }
  
  return data || [];
}