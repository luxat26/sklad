'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- CRUD POLOŽKY ---

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const box = formData.get("box") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 0;

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

// --- PŮJČOVÁNÍ ---

export async function borrowItems(borrowerName: string, cart: Record<string, number>) {
  const supabase = await createClient();
  
  for (const [itemId, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;

    // 1. Zjistit dostupnost
    const { data: item } = await supabase.from('items').select('quantity').eq('id', itemId).single();
    if (!item || item.quantity < qty) continue;

    // 2. Odečíst sklad
    await supabase.from('items').update({ quantity: item.quantity - qty }).eq('id', itemId);

    // 3. Vytvořit záznam
    await supabase.from('loans').insert({
      item_id: parseInt(itemId),
      borrower_name: borrowerName,
      quantity: qty
    });
  }

  revalidatePath('/');
  return { success: true };
}

// --- NOVÉ: VRÁCENÍ KONKRÉTNÍ OSOBOU ---

export async function returnItemsFromBorrower(borrowerName: string, returnCart: Record<string, number>) {
  const supabase = await createClient();

  for (const [itemIdStr, qtyToReturn] of Object.entries(returnCart)) {
    let remainingToReturn = qtyToReturn;
    const itemId = parseInt(itemIdStr);

    // 1. Najdeme aktivní výpůjčky PRO TOTO KONKRÉTNÍ JMÉNO
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('item_id', itemId)
      .eq('borrower_name', borrowerName) // Klíčová změna: filtrujeme podle jména
      .order('borrowed_at', { ascending: true });

    if (!loans || loans.length === 0) continue;

    // 2. Postupně umořujeme dluhy této osoby
    for (const loan of loans) {
      if (remainingToReturn <= 0) break;

      if (loan.quantity <= remainingToReturn) {
        // Smazat celou výpůjčku
        await supabase.from('loans').delete().eq('id', loan.id);
        remainingToReturn -= loan.quantity;
      } else {
        // Snížit dluh
        await supabase.from('loans').update({ quantity: loan.quantity - remainingToReturn }).eq('id', loan.id);
        remainingToReturn = 0;
      }
    }

    // 3. Vrátíme fyzicky kusy na sklad
    const { data: item } = await supabase.from('items').select('quantity').eq('id', itemId).single();
    if (item) {
      await supabase.from('items').update({ quantity: item.quantity + qtyToReturn }).eq('id', itemId);
    }
  }

  revalidatePath('/');
  return { success: true };
}