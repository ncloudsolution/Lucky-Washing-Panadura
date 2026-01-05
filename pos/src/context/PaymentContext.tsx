"use client";
import React, { createContext, useState, useContext } from "react";

// Type for your context data — known + dynamic keys
interface IBaseData {
  gatewayUrl?: string;
  [key: string]: any; // Allow other dynamic fields
}

// Context type
interface IBaseContextType {
  data: IBaseData;
  setData: React.Dispatch<React.SetStateAction<IBaseData>>;
}

// Create context with default `undefined` so it can be checked via useContext
export const PaymentGatewayContext = createContext<
  IBaseContextType | undefined
>(undefined);

// Custom hook to safely access the context
export const usePaymentGatewayContext = () => {
  const context = useContext(PaymentGatewayContext);
  if (!context) {
    throw new Error(
      "usePaymentGatewayContext must be used within a usePaymentGatewayProvider"
    );
  }
  return context;
};

// Provider
const PaymentGatewayProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<IBaseData>({ gatewayUrl: "" });

  return (
    <PaymentGatewayContext.Provider value={{ data, setData }}>
      {children}
    </PaymentGatewayContext.Provider>
  );
};

export default PaymentGatewayProvider;
