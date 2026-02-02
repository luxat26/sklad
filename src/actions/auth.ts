'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  const username = formData.get("username") as string; // 1. Získáme jméno
  
  if (!username || username.trim().length === 0) {
      return { error: "Musíš zadat jméno!" };
  }

  const CORRECT_PASSWORD = process.env.WAREHOUSE_PASSWORD || "sklad"; 

  if (password === CORRECT_PASSWORD) {
    const cookieStore = await cookies();
    
    // Nastavení cookie pro přihlášení
    const cookieOptions = { 
      secure: false, // Na produkci true, pro localhost false
      httpOnly: true,
      sameSite: 'lax' as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30 
    };

    cookieStore.set("is_logged_in", "true", cookieOptions);
    // 2. Uložíme i jméno uživatele
    cookieStore.set("warehouse_user", username, cookieOptions);
    
    redirect("/");
  } else {
    return { error: "Nesprávné heslo!" };
  }
}

// 3. Nová funkce pro odhlášení
export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("is_logged_in");
    cookieStore.delete("warehouse_user");
    redirect("/login");
}