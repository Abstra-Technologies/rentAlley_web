'use client'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {usePathname} from "next/navigation";
import useAuth from "@/hooks/useSession";
import Navibar from "@/src/components/navigation/navbar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

<<<<<<< Updated upstream
export const metadata: Metadata = {
    title: "Rentahan",
    description: "Real Estate Web Application",
};
=======
// export const metadata: Metadata = {
//   title: "Rentahan",
//   description: "Real Estate Web Application",
// };
>>>>>>> Stashed changes

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
<<<<<<< Updated upstream
    return (
        <html lang="en">
        <head><title></title></head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <Navbar/>
        {children}
        </body>
        </html>
    );
=======
  return (
      <html lang="en">
      <head><title></title></head>
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      {/*<Navbar/>*/}
      {/* <Navibar />*/}
      {children}

      </body>
      </html>
  );
>>>>>>> Stashed changes
}
