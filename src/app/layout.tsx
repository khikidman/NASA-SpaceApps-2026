import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Junior Astronaut | Mission Trainer",
  description: "A browser-based space mission training game. Make decisions, manage your outpost, and explore the science of living on Mars.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
