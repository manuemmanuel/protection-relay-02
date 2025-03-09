import type { Metadata } from "next";
import { aeonik } from "@/fonts/fonts";
import "./globals.css";
import WindowControls from '@/components/WindowControls'

export const metadata: Metadata = {
  title: "Transformer-Relay",
  description: "Solid State Transformer Protection Relay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${aeonik.variable} font-sans antialiased`}>
        <WindowControls />
        {children}
      </body>
    </html>
  );
}
