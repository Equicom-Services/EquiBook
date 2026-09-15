import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import EmailToasts from "@/components/shared/EmailToasts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equibook",
  icons: { icon: [] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 antialiased">
        <Navbar />

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Confirms every email the API sends. */}
        <EmailToasts />
      </body>
    </html>
  );
}