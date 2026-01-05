"use client";
import { SessionProvider } from "next-auth/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FullscreenProvider } from "./context/FullscreenContext";
import PaymentGatewayProvider from "./context/PaymentContext";

const client = new QueryClient();

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <PaymentGatewayProvider>
      <SessionProvider>
        <FullscreenProvider>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </FullscreenProvider>
      </SessionProvider>
    </PaymentGatewayProvider>
  );
};

export default Providers;
