"use client";
import { Input } from "@/components/ui/input";
import { Box, ScanLine } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { SelectProductDialog } from "../dialogs/SelectProductDialog";
import {
  addtoCacheCart,
  getCacheProductMetaOnlyByBarcode,
  getCacheProductsWithVariants,
  getCacheProductWithVariantsByBarcode,
} from "@/data/dbcache";
import { playMusic } from "@/utils/common";
import { ICacheProduct } from "@/app/(screens)/core/pos/page";
import { singlishToUnicode } from "sinhala-unicode-coverter";
import ViewAccessChecker from "../other/AccessChecker";
import { AddNewDialog } from "../dialogs/AddNewDialog";
import FormTemporary from "../forms/FormTemporary";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";

const BarcodeSearchBar = ({
  onSearch,
  searchOnly = false,
}: {
  onSearch?: (data: any[]) => void;
  searchOnly?: boolean;
}) => {
  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();

  const dialogTriggerRef = React.useRef<HTMLDivElement | null>(null);
  const [isBarcode, setIsBarcode] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const [barcodeForTemp, setBarcodeForTemp] = useState("");

  const getVariationName = (variation: any) => {
    if (!variation) return "Default";
    return Object.entries(variation)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  const handleDirectSubmit = async (product: any) => {
    const singleVariation = product.varients[0];

    const formData = {
      variations: [
        {
          variationId: singleVariation.variationId,
          variationName: singleVariation.variationName
            ? singleVariation.variationName.Name
            : "Default",
          quantity: 1,
          prices: singleVariation.prices,
          unitPrice: singleVariation.unitPrice,
        },
      ],
    };

    await addtoCacheCart(formData.variations);
  };

  const handleSearchTyping = async (query: string) => {
    const { products } = await getCacheProductsWithVariants();

    if (!query.trim()) {
      onSearch?.(products);
      return;
    }

    const filteredProducts = products.filter((pro: ICacheProduct) => {
      const nameMatch = pro.name?.toLowerCase().includes(query.toLowerCase());

      // only check searchQuery *if it exists* (ignore null / empty)
      const searchQueryMatch = pro.searchQuery
        ? pro.searchQuery.includes(query)
        : false;

      return nameMatch || searchQueryMatch;
    });

    onSearch?.(filteredProducts);
  };

  const handleEnter = async (isBarcode: boolean, searchOnly: boolean) => {
    const { products } = await getCacheProductsWithVariants();

    if (!inputRef.current?.value.trim()) {
      return onSearch?.(products);
    }

    if (isBarcode && !searchOnly) {
      const product = await getCacheProductWithVariantsByBarcode(
        inputRef.current?.value
      );

      if (!product) {
        setBarcodeForTemp(inputRef.current?.value);
        dialogTriggerRef.current?.click();
        toast.warning("Product not found");
        inputRef.current.value = "";
        return;
      }

      // Clear input
      inputRef.current.value = "";

      // Single variation: submit directly
      handleDirectSubmit(product);
      playMusic("/sounds/scanner.mp3");
      return;
    }

    const prod = await getCacheProductMetaOnlyByBarcode(inputRef.current.value);
    if (!prod) return onSearch?.([]);

    const filteredProduct = products.filter(
      (pro: ICacheProduct) => pro.id === prod.id
    );

    return onSearch?.(filteredProduct);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
  };

  return (
    <div className=" bg-slate-200 rounded-md px-3 py-2 flex items-center w-fit">
      <Input
        autoComplete="off"
        type="text"
        id="barcode-input"
        ref={inputRef}
        className="bg-transparent border-none shadow-none focus:border-none focus:shadow-none w-[250px]"
        placeholder={isBarcode ? "Scan Barcode..." : "Search Products..."}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleEnter(isBarcode, searchOnly);
          }
        }}
        onChange={(e) => {
          if (!isBarcode) {
            singlishToUnicode(e.target.value);
            handleSearchTyping(e.target.value); // live search
          }
        }}
      />
      {!isBarcode &&
        inputRef.current?.value &&
        inputRef.current?.value?.length > 0 && (
          <div
            className={`text-xs px-3 absolute z-10 ${
              searchOnly ? "-top-9" : "-bottom-9"
            } bg-superbase text-white py-2 rounded-sm`}
          >
            {singlishToUnicode(inputRef.current?.value ?? "")}
          </div>
        )}

      <div className="flex relative">
        <div
          className={`${
            !isBarcode && "translate-x-full"
          } absolute w-1/2 h-full bg-superbase left-0 top-0 rounded-sm transition-all duration-500`}
        />
        <ScanLine
          className={`${isBarcode && "text-white"} z-10 p-2 cursor-pointer`}
          size={40}
          onClick={() => {
            if (!isBarcode) {
              setIsBarcode(true);
              inputRef.current?.focus();
            }
          }}
        />
        <Box
          className={`${!isBarcode && "text-white"} z-10 p-2 cursor-pointer`}
          size={40}
          onClick={() => {
            if (isBarcode) {
              inputRef.current?.focus();
              setIsBarcode(false);
            }
          }}
        />
      </div>

      {/* Dialog only shows for multiple variations */}
      {selectedProduct && (
        <SelectProductDialog
          key={dialogKey}
          data={selectedProduct}
          buttonLess={true}
          onDialogClose={handleDialogClose}
        />
      )}

      <ViewAccessChecker
        permission="create:temporary-product"
        userRole={role}
        component={
          <AddNewDialog
            form={<FormTemporary barcode={barcodeForTemp} />}
            triggerText="Add Tempotaty Product"
            triggerBtn={
              <div ref={dialogTriggerRef} className="hidden">
                trig
              </div>
            }
          />
        }
        skeleton={
          <></>
          // <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
        }
      />
    </div>
  );
};

export default BarcodeSearchBar;
