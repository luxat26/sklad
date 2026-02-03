'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- CRUD POLOŽKY ---

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const box = formData.get("box") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 0;
  const note = formData.get("note") as string; // <--- NOVÉ

  if (!name) return { error: "Název je povinný" };

  const { error } = await supabase
    .from('items')
    .insert([{ name, quantity, box, updated_at: new Date().toISOString() }]);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function updateItemQuantity(itemId: string, delta: number) {
  const supabase = await createClient();
  const { data: item } = await supabase.from('items').select('quantity').eq('id', itemId).single();
  
  if (!item) return { error: "Nenalezeno" };
  const newQuantity = Math.max(0, item.quantity + delta);

  if (newQuantity === 0) return await deleteItem(itemId);

  const { error } = await supabase
    .from('items')
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

// --- PŮJČOVÁNÍ (S MERGE LOGIKOU) ---

export async function borrowItems(borrowerName: string, cart: Record<string, number>) {
  const supabase = await createClient();
  
  for (const [itemIdStr, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const itemId = parseInt(itemIdStr);

    // 1. Zjistit dostupnost na skladě
    const { data: item } = await supabase.from('items').select('quantity').eq('id', itemId).single();
    if (!item || item.quantity < qty) continue;

    // 2. Odečíst ze skladu
    await supabase.from('items').update({ quantity: item.quantity - qty }).eq('id', itemId);

    // 3. MERGE LOGIKA: Zjistit, jestli už si to tento člověk půjčil
    const { data: existingLoan } = await supabase
      .from('loans')
      .select('id, quantity')
      .eq('item_id', itemId)
      .eq('borrower_name', borrowerName)
      .maybeSingle(); // Použijeme maybeSingle, aby to nehodilo error, když nic nenajde

    if (existingLoan) {
      // A) Už má půjčeno -> PŘIČTEME k existujícímu záznamu
      await supabase
        .from('loans')
        .update({ quantity: existingLoan.quantity + qty })
        .eq('id', existingLoan.id);
    } else {
      // B) Nemá půjčeno -> VYTVOŘÍME nový záznam
      await supabase.from('loans').insert({
        item_id: itemId,
        borrower_name: borrowerName,
        quantity: qty
      });
    }
  }

  revalidatePath('/');
  return { success: true };
}

// --- VRÁCENÍ (BEZE ZMĚNY, FUNGUJE I S MERGE) ---

export async function returnItemsFromBorrower(borrowerName: string, returnCart: Record<string, number>) {
  const supabase = await createClient();

  for (const [itemIdStr, qtyToReturn] of Object.entries(returnCart)) {
    let remainingToReturn = qtyToReturn;
    const itemId = parseInt(itemIdStr);

    // Najdeme půjčky daného člověka
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('item_id', itemId)
      .eq('borrower_name', borrowerName)
      .order('borrowed_at', { ascending: true });

    if (!loans || loans.length === 0) continue;

    for (const loan of loans) {
      if (remainingToReturn <= 0) break;

      if (loan.quantity <= remainingToReturn) {
        // Smazat celou půjčku
        await supabase.from('loans').delete().eq('id', loan.id);
        remainingToReturn -= loan.quantity;
      } else {
        // Snížit dluh
        await supabase.from('loans').update({ quantity: loan.quantity - remainingToReturn }).eq('id', loan.id);
        remainingToReturn = 0;
      }
    }

    // Vrátíme fyzicky kusy na sklad
    const { data: item } = await supabase.from('items').select('quantity').eq('id', itemId).single();
    if (item) {
      await supabase.from('items').update({ quantity: item.quantity + qtyToReturn }).eq('id', itemId);
    }
  }

  revalidatePath('/');
  return { success: true };
}

// ... existující importy ...

export async function updateItemDetails(itemId: string, name: string, box: string, note: string) {  const supabase = await createClient();
  
  if (!name || name.trim().length === 0) {
      return { error: "Název nesmí být prázdný" };
  }

  const { error } = await supabase
    .from('items')
    .update({ 
        name, 
        box, 
        note,
        updated_at: new Date().toISOString() 
    })
    .eq('id', itemId);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}