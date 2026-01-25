'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;

  // OPRAVA: Teď hledáme WAREHOUSE_PASSWORD
  const CORRECT_PASSWORD = process.env.WAREHOUSE_PASSWORD; 

  if (password === CORRECT_PASSWORD) {
    const cookieStore = await cookies();
    
    cookieStore.set("is_logged_in", "true", { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 dní
    });
    
    redirect("/");
  } else {
    return { error: "Nesprávné heslo!" };
  }
}