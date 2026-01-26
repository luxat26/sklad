'use client'

import { loginAction } from "@/actions/auth";
import { Package, Lock, User } from "lucide-react"; // Import User ikony
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full">
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-center text-slate-800 mb-2">Vítej ve skladu</h1>
        <p className="text-center text-slate-400 text-sm mb-8 font-medium">Zadej jméno a heslo skladu</p>

        <form action={handleSubmit} className="space-y-4">
          
          {/* 1. Nový input pro Jméno */}
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="username"
                placeholder="Tvé jméno (např. Lukáš)"
                required
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="password"
                placeholder="Heslo skladu"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Ověřuji..." : "Vstoupit"}
          </button>
        </form>
      </div>
    </main>
  );
}