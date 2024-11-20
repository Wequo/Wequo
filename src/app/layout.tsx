import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";


import ReduxProvider from '@/app/ReduxProvider'; 
import GoogleMapsProvider from "@/app/GoogleMapsProvider"; 

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Quotation",
  description: "Forms to get a final quotation",
};





export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

          <ReduxProvider>
            <GoogleMapsProvider> 
              {children}
            </GoogleMapsProvider>
          </ReduxProvider>

      </body>
    </html>
  );
}
