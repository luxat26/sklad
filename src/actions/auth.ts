'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;

  // TADY SI NASTAV SVOJE HESLO (zatím natvrdo v kódu)
  const MY_SECRET_PASSWORD = "sklad"; 

  if (password === MY_SECRET_PASSWORD) {
    // Uložíme cookie, že je uživatel přihlášený
    const cookieStore = await cookies();
    cookieStore.set("is_logged_in", "true", { 
      httpOnly: true, 
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 dní
    });
    
    // Přesměrujeme na dashboard
    redirect("/");
  } else {
    return { error: "Nesprávné heslo!" };
  }
}