import type { Metadata } from "next";
import {
  Abhaya_Libre,
  Geist,
  Geist_Mono,
  Noto_Sans_Sinhala,
  Saira,
} from "next/font/google";
import "./globals.css";
import Providers from "@/Provider";
import { Toaster } from "sonner";
import { IoIosCloseCircle } from "react-icons/io";
import { FaCircleCheck } from "react-icons/fa6";
import { PiWarningCircleFill } from "react-icons/pi";
import { productData } from "@/data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
});

const abhaya = Abhaya_Libre({
  variable: "--font-abhaya",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "sinhala"],
});

const sinhalaNato = Noto_Sans_Sinhala({
  variable: "--font-sinhalaNato",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "sinhala"],
});

export const metadata: Metadata = {
  title: {
    absolute: `${productData.name} - Cloud POS for Smart Business Management`,
    default: productData.name,
    template: `%s | ${productData.name}`,
  },
  description: `${productData.name} is a powerful cloud-based POS system designed for modern businesses. It supports multiple users with one or more roles, allowing teams to create and manage invoices, handle customers, track sales and stock metrics in real time, print barcodes, send SMS alerts, and issue e-bills. With secure cloud access, all business operations stay connected, centralized, and accessible anytime, anywhere.`,
  keywords: [
    "cloud POS system",
    "multi user POS software",
    "role based POS access",
    "invoice management system",
    "sales tracking dashboard",
    "stock and inventory management",
    "barcode printing POS",
    "SMS alerts POS",
    "e-billing system",
    "retail analytics platform",
    `${productData.name} POS`,
  ],
  icons: { icon: ["/favicon.ico"] },
  authors: [{ name: productData.name, url: productData.contact.web }],
  creator: "Sohan Prabhath Weerasinghe @ nCloud Solutions",
  openGraph: {
    title: `${productData.name} - Cloud POS for Smart Business Management`,
    description: `${productData.name} is a cloud-based POS platform built to manage sales, invoices, customers, and inventory with ease. It supports multiple users and roles, real-time sales analytics, barcode printing, SMS notifications, and digital e-billing—making it ideal for retail and service-based businesses.`,
    url: productData.contact.web,
    siteName: productData.name,
    images: [
      {
        url: "/og-base.jpg",
        width: 1200,
        height: 630,
        alt: `${productData.name} - Cloud POS System`,
      },
    ],
    type: "website",
  },
  metadataBase: new URL(productData.contact.web),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en" id="root">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${saira.variable} ${abhaya.variable} ${sinhalaNato.variable} antialiased`}
        >
          <Toaster
            expand
            position="bottom-right"
            richColors
            duration={5000} //5s
            icons={{
              error: (
                <div className="bg-white rounded-full shadow-md flex justify-center items-center size-[20px]">
                  <IoIosCloseCircle className="text-red-900 size-[20px]" />
                </div>
              ),
              success: (
                <div className="bg-white rounded-full shadow-md flex justify-center items-center size-[20px]">
                  <FaCircleCheck className="text-green-900 size-[16px]" />
                </div>
              ),
              warning: (
                <div className="bg-white shadow-md rounded-full flex justify-center items-center size-[20px]">
                  <PiWarningCircleFill className="text-amber-400 size-full" />
                </div>
              ),
            }}
          />
          {children}
        </body>
      </html>
    </Providers>
  );
}
