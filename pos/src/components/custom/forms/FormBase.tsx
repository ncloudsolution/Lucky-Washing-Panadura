"use client";
import React, { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { ToggleInput } from "../inputs/ToogleInput";
import { HorizontalMultiSelectInput } from "../inputs/HorizontalMultiSelectInput";
import { MetricTypes, TMetric } from "@/data";
import { ProductBaseSchema } from "@/utils/validations/product";
import { BasicDataFetch, CategoryWrapper } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  ensureClientInit,
  getBusinessMeta,
  saveCategory,
  saveOneProductWithVariants,
  updateBaseDataOfProduct,
} from "@/data/dbcache";
import { deleteSingleImage } from "@/firebase/helpers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ICacheProduct } from "@/app/(screens)/core/pos/page";
import { singlishToUnicode } from "sinhala-unicode-coverter";
import SelectInput from "../inputs/SelectInput";
import { Button } from "@/components/ui/button";
import { LoaderBtn } from "../buttons/LoaderBtn";
import { isEqual } from "lodash";

const FormBase = ({ data }: { data: ICacheProduct }) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof ProductBaseSchema>;

  const sinhala = !!(data.searchQuery && data.name);
  const categories = data.categories.map((item) => ({ value: item }));

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

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ProductBaseSchema),
    defaultValues: {
      sinhalaMode: sinhala,
      searchQuery: data.searchQuery,
      metric: data.metric,
      name: data.name,
      brand: data.brand ? data.brand : "",
      categories: categories,
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    setValue,
    setError,
    formState: { isSubmitting, errors },
  } = formMethods;

  const searchQueryValue = watch("searchQuery");

  useEffect(() => {
    if (searchQueryValue) {
      setValue("name", singlishToUnicode(searchQueryValue), {
        shouldValidate: true,
      });
    }
  }, [searchQueryValue, setValue]);

  const sinhalaModeValue = watch("sinhalaMode");

  useEffect(() => {
    if (!sinhalaModeValue) {
      setValue("searchQuery", "");
      setValue("name", data.name);
    }
  }, [sinhalaModeValue, setValue]);

  // const {
  //   data: branches = [],
  //   isLoading: branchesLoading,
  //   error,
  // } = useQuery({
  //   queryKey: ["branches"],
  //   queryFn: () =>
  //     BasicDataFetch({
  //       method: "GET",
  //       endpoint: `/api/company/branch`,
  //     }),
  //   select: (response) => response?.data as IBranch[],
  //   staleTime: 1000 * 60 * 5,
  // });
  const queryClient = useQueryClient();

  const onSubmit = async (formValues: FormFields) => {
    const start = performance.now();

    const modifiedData = {
      ...formValues,
      searchQuery: sinhalaModeValue ? formValues.searchQuery : null,
      id: data.id,
    };

    const set1 = {
      sinhalaMode: sinhala,
      searchQuery: data.searchQuery,
      metric: data.metric,
      name: data.name,
      brand: data.brand,
      categories: categories,
    };

    const set2 = {
      sinhalaMode: modifiedData.sinhalaMode,
      searchQuery: modifiedData.searchQuery,
      metric: modifiedData.metric,
      name: modifiedData.name,
      brand: modifiedData.brand,
      categories: modifiedData.categories,
    };

    if (isEqual(set1, set2)) {
      return setError("root", {
        message: "No changes detected. Please modify at least one field.",
      });
    }

    // return

    try {
      const res = await BasicDataFetch({
        // Added await here
        method: "PUT",
        endpoint: "/api/products/core",
        data: modifiedData,
      });

      //AFTER THIS SHOULD CONTINUE

      updateBaseDataOfProduct(res.data);

      const updatedBaseProduct = {
        brand: res.data.brand,
        categories: res.data.categories,
        description: res.data.description,
        id: res.data.id,
        images: res.data.images,
        searchQuery: res.data.searchQuery,
        metric: res.data.metric,
        name: res.data.name,
        shortDescription: res.data.shortDescription,
        tags: res.data.tags,
        // varients: [
        //   {
        //     barcode: res.data.createdVarient.barcode,
        //     createdAt: res.data.createdVarient.createdAt,
        //     id: res.data.createdVarient.id,
        //     metaId: res.data.createdVarient.metaId,
        //     prices: res.data.createdVarient.prices,
        //     variation: res.data.createdVarient.variation,
        //   },
        // ],
      };

      queryClient.setQueryData(
        ["products"],
        (oldData: ICacheProduct[] = []) => {
          const newArray: ICacheProduct[] = [];

          oldData.forEach((old) => {
            if (old.id !== updatedBaseProduct.id) {
              // keep unchanged product
              newArray.push(old);
            } else {
              // merge old varients with the updated base product
              const mergedProduct = {
                ...updatedBaseProduct,
                varients: old.varients, // keep existing varients
              };
              newArray.push(mergedProduct);
            }
          });

          return newArray;
        }
      );

      closeRef.current?.click();
      const end = performance.now();
      const responseTimeMs = end - start;

      // res already contains parsed JSON from BasicDataFetch
      toast.success(`${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`);
    } catch (err) {
      // if (uploadedImageUrl) {
      //   await deleteSingleImage(uploadedImageUrl);
      // }
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const {
    fields: categoriesFields,
    append: appendCategories,
    remove: removeCategories,
  } = useFieldArray({
    control,
    name: "categories",
  });

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Product Core"
      className="gap-1"
      cardDescription={`Edit the product of ${data.name}`}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-4">
            <>
              {sinhalaModeValue && (
                <TextInput
                  placeholder="simenthi"
                  labelName="Search Query - Singlish"
                  fieldName="searchQuery"
                  control={control}
                  hasError={!!errors.searchQuery}
                />
              )}

              <div className="relative">
                <TextInput
                  pointerNone={sinhalaModeValue}
                  placeholder={
                    sinhalaModeValue ? singlishToUnicode("simenthi") : "Cement"
                  }
                  labelName="Display Name"
                  fieldName="name"
                  control={control}
                  hasError={!!errors.name}
                />
                <div className="absolute right-0 top-0">
                  <ToggleInput
                    name="sinhalaMode"
                    labelName="Sinhala Mode"
                    control={control}
                  />
                </div>
              </div>

              <TextInput
                placeholder="Ultratech"
                labelName="Brand Optional"
                fieldName="brand"
                specialTag="Optional"
                control={control}
                hasError={!!errors.brand}
              />

              <HorizontalMultiSelectInput
                control={control}
                fieldName="categories"
                labelName="Categories"
                selections={CategoryWrapper(FinalCategoryItems)}
                placeholder="Select Categories"
                appendCategory={(cat: string) =>
                  appendCategories({ value: cat })
                }
                removeCategory={(index) => removeCategories(index)}
                hasError={!!errors.categories}
              />
              <SelectInput
                control={control}
                fieldName="metric"
                labelName="Metric"
                selections={MetricTypes}
                labelList={[
                  "",
                  "Kilogram",
                  "Liter",
                  "Inch",
                  "Foot",
                  "Yard",
                  "Meter",
                  "Square Foot",
                  "Square Meter",
                  "Cube",
                ]}
              />
            </>

            {errors.root && (
              <p className="text-destructive text-sm mt-2">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="flex-1 mt-3 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderBtn loadertext="Updating ..." />
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>

        {/*3 - ✅ Hidden close button */}
        <DialogClose asChild>
          <button type="button" className="hidden" ref={closeRef}></button>
        </DialogClose>
        {/* <DevTool control={control} /> */}
      </Form>
    </FormWrapper>
  );
};

export default FormBase;
