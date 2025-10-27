import type { Metadata } from "next";
import { Overpass } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const overpass = Overpass({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Legal Case Manager",
  description: "Manage your legal cases and clients efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${overpass.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
