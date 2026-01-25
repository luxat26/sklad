import "./globals.css";
// Opraveno: lomítko místo podtržítka
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin-ext"] });

export const metadata = {
  title: "Můj Sklad",
  description: "Jednoduchá správa zásob na mobilu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}