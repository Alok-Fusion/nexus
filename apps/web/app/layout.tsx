import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXUS — Local-First AI-Native Workspace",
  description: "Private, sovereign, AI-native productivity and knowledge workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand/20 selection:text-brand">
        {children}
      </body>
    </html>
  );
}
