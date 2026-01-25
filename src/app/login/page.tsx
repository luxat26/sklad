import { loginAction } from "@/actions/auth";

/**
 * Jednoduchá login stránka optimalizovaná pro mobil.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Virtuální Sklad</h1>
          <p className="text-sm text-slate-500 mt-2">Zadejte heslo pro přístup</p>
        </div>

        <form action={loginAction} className="space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Heslo"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Vstoupit
          </button>
        </form>
      </div>
    </main>
  );
}