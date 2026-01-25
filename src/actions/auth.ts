'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  
  // Tady si to logni, ať vidíš ve Vercelu/Terminálu, co se děje
  console.log("SERVER ACTION: Zkouším přihlásit s heslem:", password);
  
  const CORRECT_PASSWORD = process.env.WAREHOUSE_PASSWORD || "sklad"; 

  if (password === CORRECT_PASSWORD) {
    const cookieStore = await cookies();
    
    // === HARDCORE FIX PRO LOCALHOST ===
    // Vypneme secure, vypneme httpOnly (jen pro test), nastavíme lax
    cookieStore.set("is_logged_in", "true", { 
      secure: false, // Důležité pro localhost! Na produkci to Vercel zvládne i tak
      httpOnly: true,
      sameSite: 'lax',
      path: "/",     // Důležité, aby platila pro celý web
      maxAge: 60 * 60 * 24 * 30 
    });
    
    console.log("SERVER ACTION: Heslo OK, cookie nastavena, přesměruji...");
    redirect("/");
  } else {
    console.log("SERVER ACTION: Heslo nesedí.");
    return { error: "Nesprávné heslo!" };
  }
}