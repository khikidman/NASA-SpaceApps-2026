import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Space Explorer | Moon to Mars",
  description: "A space learning adventure for ages 7–12. Collect supplies, solve challenges, and explore the Moon and Mars.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
