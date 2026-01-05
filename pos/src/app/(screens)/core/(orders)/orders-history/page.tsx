"use client";
import SearchInput from "@/components/custom/inputs/SearchInput";
import { Button } from "@/components/ui/button";
import { IOrderMeta } from "@/data";
import { BasicDataFetch } from "@/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useState } from "react";
import { OrderUI } from "../orders-latest/page";

const OrdersFind = () => {
  const [search, setSearch] = useState(""); // Actual trigger key
  const [hasSearched, setHasSearched] = useState(false);

  const {
    data: orderMetas,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order-search", search],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/orders?search=${search}`,
      }),
    select: (response) => response?.data as IOrderMeta[],
    staleTime: 1000 * 60 * 5,
    enabled: !!search && !!hasSearched, // Only fetch when 'search' is truthy
  });

  // Handle settled state with useEffect
  React.useEffect(() => {
    if (!isLoading && hasSearched) {
      setHasSearched(false);
    }
  }, [isLoading, hasSearched]);

  const handleSearch = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    setSearch(trimmed); // Update key so queryKey is fresh
    setHasSearched(true);
  };
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-center">
        <div className="flex flex-row gap-x-5 gap-y-2 w-[500px] absolute right-0 -top-16">
          <SearchInput
            type="number"
            placeholder="Customer Mobile / Invoice Id"
            onchange={setSearch}
            value={search}
            icon={false}
          />
          <Button className="w-fit h-9 shadow" onClick={handleSearch}>
            <Search size={18} /> Search
          </Button>
        </div>
      </div>

      <OrderUI isLoading={isLoading} orderMetas={orderMetas ?? []} />
    </div>
  );
};

export default OrdersFind;
