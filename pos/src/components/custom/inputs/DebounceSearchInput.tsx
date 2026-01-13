"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BasicDataFetch } from "@/utils/common";
import MobileInput from "./MobileInput";
import { UserRoundSearch, X } from "lucide-react";
import { AddNewDialog } from "../dialogs/AddNewDialog";
import FormCustomer from "../forms/FormCustomer";
import { useLiveQuery } from "dexie-react-hooks";
import {
  clearCurrentCustomer,
  getCurrentCustomer,
  getOrderType,
  setCurrentCustomer,
} from "@/data/dbcache";
import { LoaderBtn } from "../buttons/LoaderBtn";
import { globalDefaultCustomer } from "@/data";

export function DebounceSearchInput({
  error,
  isSubmitting,
}: {
  error: boolean;
  isSubmitting: boolean;
}) {
  const [query, setQuery] = useState("+94");
  const [results, setResults] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const orderType = useLiveQuery(async () => {
    return getOrderType();
  }, []);
  // ✅ Don't provide default - let it be undefined initially
  const selectedCustomer = useLiveQuery(() => getCurrentCustomer(), []);

  // ✅ Flag to set default only once
  const defaultSetRef = useRef(false);

  //✅ Set default customer once when component mounts
  useEffect(() => {
    if (!orderType) return;

    if (
      globalDefaultCustomer.enable &&
      !defaultSetRef.current &&
      !orderType.editMode
    ) {
      defaultSetRef.current = true;
      setCurrentCustomer("Default", "+94777777777");
    }

    setIsReady(true);
  }, [orderType?.editMode, globalDefaultCustomer.enable]);

  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    setQuery("+94");
  }, [isSubmitting]);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 5) {
      fetchUsers(debouncedQuery);
    }
  }, [debouncedQuery]);

  const fetchUsers = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length <= 5) {
      setShowPanel(false);
      return;
    }

    setLoading(true);
    try {
      const response = await BasicDataFetch({
        method: "GET",
        endpoint: `/api/customer?mobile=${searchQuery}`,
      });

      setResults(response.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // ✅ Determine if we have a valid selected customer to show
  const hasValidCustomer =
    selectedCustomer?.name &&
    selectedCustomer?.mobile &&
    selectedCustomer.mobile !== "+94";

  // ✅ Don't render until ready
  if (!isReady) {
    return (
      <div className="flex justify-center gap-3 items-center text-sm text-center h-10 w-full bg-white/60 rounded-sm animate-pulse">
        <span className="w-fit"> Customer Loading</span>
        <div className="w-fit">
          <LoaderBtn />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search results */}
      <div
        className={`${
          showPanel && query ? "" : "hidden"
        } border bottom-14 bg-superbase rounded-md p-2 w-full mb-3 z-20 absolute `}
      >
        <Command>
          <CommandList>
            {loading ? (
              <CommandEmpty className="flex gap-2 w-full items-center text-sm justify-center py-6">
                <LoaderBtn loadertext="Searching ..." />
              </CommandEmpty>
            ) : results.length === 0 && showPanel ? (
              <CommandEmpty className="flex gap-2 w-full items-center text-sm justify-center py-6">
                <UserRoundSearch className="size-[16px]" /> No customer found.
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((user) => (
                  <CommandItem
                    key={user.mobile}
                    className="flex justify-between"
                    onSelect={async () => {
                      await setCurrentCustomer(user.name, user.mobile);
                      setShowPanel(false);
                      setQuery(user.mobile);
                    }}
                  >
                    <div className="font-semibold line-clamp-1">
                      {user.name}
                    </div>
                    <div>{user.mobile}</div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>

      {/* Show selected customer or input */}
      {hasValidCustomer ? (
        <>
          <div className="h-10 w-full bg-white text-sm rounded-sm flex justify-between items-center px-3">
            <span className="font-semibold line-clamp-1">
              {selectedCustomer.name}
            </span>
            <span className="pr-5">{selectedCustomer.mobile}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await clearCurrentCustomer();
              defaultSetRef.current = false;
              setQuery("+94");
            }}
            className="p-1 absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary rounded-full text-white"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <>
          <MobileInput
            hasError={error}
            placeholder="Search by Mobile"
            value={query}
            onChange={(mobile: string) => {
              setQuery(mobile);
              setShowPanel(mobile.length > 5);
            }}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <AddNewDialog
              form={<FormCustomer />}
              triggerText="Add Customer"
              mini
            />
          </div>
        </>
      )}
    </div>
  );
}
