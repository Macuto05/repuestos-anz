import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RepuestosANZ | Marketplace de Repuestos Automotrices",
  description: "Encuentra repuestos para tu vehículo - El inventario más grande del país",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-background-light text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
