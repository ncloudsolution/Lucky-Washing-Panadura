"use client";
import { SessionProvider } from "next-auth/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const client = new QueryClient();

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SessionProvider>
  );
};

export default Providers;
