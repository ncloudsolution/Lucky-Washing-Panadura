"use client";
import NoRecordsCard from "@/components/custom/cards/NoRecordsCard";
import { AddNewDialog } from "@/components/custom/dialogs/AddNewDialog";
import FormCoreProduct from "@/components/custom/forms/FormCoreProduct";
import BarcodeSearchBar from "@/components/custom/inputs/BarcodeSearchBar";
import ViewAccessChecker from "@/components/custom/other/AccessChecker";
import { ProductAccordian } from "@/components/custom/other/ProductAccordian";
import ListSkeleton from "@/components/custom/skeleton/ListSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ensureClientInit,
  getBusinessMeta,
  getCacheProductsWithVariants,
  saveAllProductWithVariants,
  saveCategory,
} from "@/data/dbcache";
import { BasicDataFetch } from "@/utils/common";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { ICacheProduct } from "../pos/page";
import { Button } from "@/components/ui/button";

const Products = () => {
  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();
  const branch = session?.user.branch.toLowerCase();

  const [filteredProducts, setFilteredProducts] = useState<
    ICacheProduct[] | null
  >(null);

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
        await saveCategory(apiCategories, "product");

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

  console.log(role);

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { products: cachedProducts, expired } =
        await getCacheProductsWithVariants();

      if (cachedProducts.length > 0 && !expired) {
        console.log("Cache is fresh");
        return cachedProducts;
      }

      const response = await BasicDataFetch({
        method: "GET",
        endpoint: "/api/products/common",
      });

      const apiData = response.data;

      await saveAllProductWithVariants({
        data: apiData,
        lastProductFetch: Date.now(),
      });

      const { products: refreshed } = await getCacheProductsWithVariants();
      return refreshed;
    },
    staleTime: 1000 * 60 * 5,
  });

  console.log(products, "in pro page");
  const baseProducts = filteredProducts === null ? products : filteredProducts;

  const selectedCategory = FinalCategoryItems.find(
    (c) => c.id === selectedCategoryId
  );

  const displayProducts =
    selectedCategoryId === "0"
      ? baseProducts
      : baseProducts?.filter((product) =>
          product.categories?.some(
            (cat) => cat.toLowerCase() === selectedCategory?.name.toLowerCase()
          )
        );

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col">
        <div className="flex justify-between w-full relative">
          <BarcodeSearchBar
            onSearch={(filtered) => {
              setFilteredProducts(filtered);
              setSelectedCategoryId("0");
            }}
            searchOnly
          />

          <ViewAccessChecker
            permission="create:product"
            userRole={role}
            component={
              <AddNewDialog
                form={<FormCoreProduct />}
                triggerText="Add Product Core"
              />
            }
            skeleton={
              <Skeleton className="size-[40px] rounded-sm bg-gray-300 border-slate-400" />
            }
          />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-2 mt-4">
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
      </div>

      <div className="flex flex-col  h-full">
        {isLoading ? (
          <ListSkeleton />
        ) : displayProducts && displayProducts.length > 0 ? (
          <>
            <ProductAccordian
              products={displayProducts}
              role={role}
              branch={branch}
              unfilterdProducts={products}
            />
          </>
        ) : (
          <NoRecordsCard />
        )}
      </div>
    </div>
  );
};

export default Products;
