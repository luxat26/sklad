'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getGeneralInfo() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'general_info')
    .single();
  
  return data?.value || "";
}

export async function updateGeneralInfo(newText: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: 'general_info', 
      value: newText,
      updated_at: new Date().toISOString()
    });

  if (error) return { error: error.message };
  
  revalidatePath('/');
  return { success: true };
}