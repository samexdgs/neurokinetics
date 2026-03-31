import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroKinetics",
  description: "Camera-assisted motor recovery monitor for stroke survivors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
