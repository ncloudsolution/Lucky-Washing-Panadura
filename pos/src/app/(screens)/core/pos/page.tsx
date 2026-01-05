"use client";

import { SelectProductDialog } from "@/components/custom/dialogs/SelectProductDialog";
import CartCard from "@/components/custom/cards/CartCard";
import BarcodeSearchBar from "@/components/custom/inputs/BarcodeSearchBar";
import { useQuery } from "@tanstack/react-query";
import { BasicDataFetch, focusBarcode } from "@/utils/common";
import ProductTileSkeleton from "@/components/custom/skeleton/ProductTileSkeleton";
import {
  saveAllProductWithVariants,
  getCacheProductsWithVariants,
  ensureClientInit,
  getBusinessMeta,
  saveBusinessCategories,
} from "@/data/dbcache";

import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { IProductMeta, IProductVarient } from "@/data";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFullscreen } from "@/context/FullscreenContext";
import { Skeleton } from "@/components/ui/skeleton";

export type ICacheProduct = IProductMeta & { varients: IProductVarient[] };

function PosWindow() {
  useEffect(() => {
    focusBarcode();
  }, []);

  /* ---------------- Categories (CACHE FIRST) ---------------- */
  const { data: CategoryArray = [], isLoading: isLoadingCatagoryArray } =
    useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        await ensureClientInit();

        // 1️⃣ Try cache
        const meta = await getBusinessMeta();
        if (meta?.categories?.length) {
          return meta.categories;
        }

        // 2️⃣ Fetch API
        const response = await BasicDataFetch({
          method: "GET",
          endpoint: "/api/company/categories",
        });

        const apiCategories: string[] = response.data ?? [];

        // 3️⃣ Save ordered categories to cache
        await saveBusinessCategories(apiCategories);

        return ["All", ...apiCategories, "Temporary"];
      },
      staleTime: 1000 * 60 * 5,
    });

  /* ---------------- Category Objects ---------------- */
  const FinalCategoryItems = useMemo(() => {
    return CategoryArray.map((name, index) => ({
      id: index === 0 ? "0" : name.toLowerCase().replace(/\s+/g, "-"),
      name,
    }));
  }, [CategoryArray]);

  const [selectedCategoryId, setSelectedCategoryId] = useState("0");

  /* ---------------- Products ---------------- */
  const [filteredProducts, setFilteredProducts] = useState<
    ICacheProduct[] | null
  >(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      await ensureClientInit();

      const { products: cachedProducts, expired } =
        await getCacheProductsWithVariants();

      if (cachedProducts.length > 0 && !expired) {
        return cachedProducts;
      }

      const response = await BasicDataFetch({
        method: "GET",
        endpoint: "/api/products/common",
      });

      await saveAllProductWithVariants({
        data: response.data,
        lastProductFetch: Date.now(),
      });

      const { products: refreshed } = await getCacheProductsWithVariants();

      return refreshed;
    },
    staleTime: 1000 * 60 * 5,
  });

  const baseProducts = filteredProducts === null ? products : filteredProducts;

  const selectedCategory = FinalCategoryItems.find(
    (c) => c.id === selectedCategoryId
  );

  const displayProducts =
    selectedCategoryId === "0"
      ? baseProducts
      : baseProducts?.filter((product) =>
          product.categories?.some(
            (cat) => cat.toLowerCase() === selectedCategory?.name?.toLowerCase()
          )
        );

  const { isFullscreen } = useFullscreen();

  /* ---------------- UI ---------------- */
  return (
    <div
      className={`flex gap-4 w-full ${
        isFullscreen ? " max-h-[82.5dvh]" : "max-h-[79dvh]"
      } h-full`}
    >
      <CartCard />

      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-black">
        <BarcodeSearchBar
          onSearch={(filtered) => {
            setFilteredProducts(filtered);
            setSelectedCategoryId("0");
          }}
        />
      </div>

      <div className="flex flex-1 gap-5 flex-col">
        {/* Categories */}
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {isLoadingCatagoryArray ? (
            <>
              {Array.from({ length: 15 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-[30px] w-[100px] rounded-sm"
                />
              ))}
            </>
          ) : (
            <>
              {FinalCategoryItems.map((cat, index) => (
                <Button
                  key={index}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`${
                    selectedCategoryId === cat.id
                      ? " bg-superbase hover:bg-superbase text-white border border-superbase"
                      : "text-primary hover:bg-superbase/70 hover:text-white bg-secondary border border-muted-foreground"
                  } h-[30px] text-xs`}
                >
                  {cat.name}
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Products */}
        <div className="flex h-full overflow-y-scroll no-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] justify-items-center content-start justify-start gap-x-2 gap-y-5 w-full h-fit">
              {Array.from({ length: 21 }).map((_, i) => (
                <ProductTileSkeleton key={i} />
              ))}
            </div>
          ) : displayProducts && displayProducts.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] justify-items-center content-start justify-start gap-x-2 gap-y-5 w-full h-fit">
              {displayProducts.map((product: ICacheProduct) => (
                <SelectProductDialog key={product.id} data={product} />
              ))}
            </div>
          ) : (
            <NoRecordsCard />
          )}
        </div>
      </div>
    </div>
  );
}

export default PosWindow;
