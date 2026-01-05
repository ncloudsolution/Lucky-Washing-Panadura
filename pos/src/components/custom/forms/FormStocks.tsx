"use client";
import React, { useEffect, useState } from "react";
import { FieldPath, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { StepLine } from "./StepLine";
import { ToggleInput } from "../inputs/ToogleInput";

import { ProductStockSchema } from "@/utils/validations/product";
import { BasicDataFetch } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  getCacheProductsWithVariants,
  saveAllProductWithVariants,
} from "@/data/dbcache";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import PriceInput from "../inputs/PriceInput";
import ComplexComboInput from "../inputs/ComplexComboInput";
import { IProductStock, IStockValueEntry } from "@/data";
import { entries } from "lodash";

const FormStocks = ({
  branch,
  operator,
}: {
  branch: string;
  operator: string;
}) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof ProductStockSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ProductStockSchema),
    defaultValues: {
      in: true,
      varientId: "",
      branch: branch,
      operator: operator,
      quantity: 0,
      remarks: "",
      unitPrice: 0,
      discount: 0,
      supplier: "",
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
    formState: { isSubmitting, errors },
  } = formMethods;

  // console.log("Form Errors:", errors);

  const stockIn = watch("in");

  useEffect(() => {
    if (stockIn) {
      // Stock IN: reset to default values (user will fill them)
      formMethods.setValue("unitPrice", 0);
      formMethods.setValue("discount", 0);
      formMethods.setValue("supplier", "");
    } else {
      // Stock OUT: set to null (optional)
      formMethods.setValue("unitPrice", null);
      formMethods.setValue("discount", null);
      formMethods.setValue("supplier", null);
    }
  }, [stockIn]);

  const {
    data: products = [],
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

  const productArrayMod = products.flatMap((p) =>
    p.varients.map((v) => ({
      value: v.id!,
      label: `${p.name} ${v.variation?.Name ? ` - ${v.variation.Name}` : ""} ${
        v.barcode ? ` - ${v.barcode}` : ""
      } ${p.searchQuery ? ` - ${p.searchQuery}` : ""}`,
    }))
  );

  console.log(productArrayMod, "mod");

  const queryClient = useQueryClient();

  const onSubmit = async (data: FormFields) => {
    const start = performance.now();

    try {
      const res = await BasicDataFetch({
        // Added await here
        method: "POST",
        endpoint: "/api/products/stocks?type=logs",
        data: data,
      });

      closeRef.current?.click();
      const end = performance.now();
      const responseTimeMs = end - start;

      // res already contains parsed JSON from BasicDataFetch
      toast.success(`${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`);

      //update lastest SOCKS
      queryClient.setQueryData(
        ["latest-stock-metas"],
        (oldData?: IProductStock[]) => {
          const oldArray = oldData ?? [];
          console.log(oldArray, "old array");
          console.log(res.data, "new resp");
          const updated = [res.data, ...oldArray];
          console.log(updated, "updated array");
          // return updated.slice(0, 10); // limit list if needed
          return updated; // limit list if needed
        }
      );

      //update stock history of the branch
      queryClient.setQueryData(
        ["stock-product-branch", `${data.varientId}-${data.branch}`],
        (oldData: IStockValueEntry | undefined) => {
          const oldObj = oldData ?? {
            entries: [],
            stockInCount: 0,
            stockOutCount: 0,
            soldCount: 0,
          };

          const oldEntries = Array.isArray(oldObj.entries)
            ? oldObj.entries
            : [];

          return {
            entries: [res.data, ...oldEntries],
            stockInCount: data.in
              ? Number(oldObj.stockInCount) + Number(data.quantity)
              : oldObj.stockInCount,
            stockOutCount: !data.in
              ? Number(oldObj.stockOutCount) + Number(data.quantity)
              : oldObj.stockOutCount,
            soldCount: oldObj.soldCount,
          };
        }
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };
  const StepObject = [
    {
      id: 1,
      title: "Part A",
      fields: [
        "in",
        "varientId",
        "branch",
        "operator",
        "quantity",
        "remarks",
      ] as FieldPath<FormFields>[],
    },

    ...(stockIn
      ? [
          {
            id: 2,
            title: "Part B",
            fields: [
              "supplier",
              "unitPrice",
              "discount",
            ] as FieldPath<FormFields>[],
          },
        ]
      : []),
  ];

  const [step, setStep] = useState(1);
  console.log(step);

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const fields = StepObject[step - 1].fields;

    const isStepValid = await trigger(fields);

    if (!isStepValid) return;

    if (step < StepObject.length) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Stock Log"
      className={`gap-1 relative`}
      cardDescription="Add New Stock Log"
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {stockIn && (
            <StepLine step={step} setStep={setStep} stepObject={StepObject} />
          )}
          <div className="flex flex-col gap-2 w-full pt-4 pb-4">
            {step === 1 && (
              <>
                <div className="relative">
                  <ComplexComboInput
                    selections={productArrayMod}
                    placeholder="product"
                    labelName="Product"
                    fieldName="varientId"
                    control={control}
                    hasError={!!errors.varientId}
                  />
                  <div className="absolute right-0 top-0">
                    <ToggleInput
                      name="in"
                      labelName="Stock in"
                      control={control}
                      colorize
                    />
                  </div>
                </div>

                <PriceInput
                  placeholder="5000"
                  labelName="Quantity"
                  fieldName={`quantity`}
                  control={control}
                  hasError={!!errors.quantity}
                  nonComplex
                />
                {!stockIn && (
                  <PriceInput
                    placeholder="3000"
                    labelName="Unit Price"
                    fieldName={`unitPrice`}
                    control={control}
                    hasError={!!errors.unitPrice}
                    nonComplex
                  />
                )}

                <TextInput
                  placeholder="Reason or explanation"
                  labelName="Remarks Optional"
                  specialTag="Optional"
                  fieldName={`remarks`}
                  control={control}
                  hasError={!!errors.remarks}
                  type="textarea"
                />
              </>
            )}

            {step === 2 && (
              <>
                <TextInput
                  placeholder="Mr.Ranjan"
                  labelName="Supplier Optional"
                  specialTag="Optional"
                  fieldName="supplier"
                  control={control}
                  hasError={!!errors.supplier}
                />
                <PriceInput
                  placeholder="3000"
                  labelName="Unit Price"
                  fieldName={`unitPrice`}
                  control={control}
                  hasError={!!errors.unitPrice}
                  nonComplex
                />

                <PriceInput
                  placeholder="200"
                  labelName="Total Discount"
                  fieldName={`discount`}
                  control={control}
                  hasError={!!errors.discount}
                  nonComplex
                />
              </>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <Button
              className="flex-1"
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
            >
              Back
            </Button>
            {step === StepObject.length ? (
              <Button
                type="submit"
                className="flex-1 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
                disabled={isSubmitting}
                onClick={async (e) => {
                  console.log("🔴 Submit clicked");
                  console.log("Form errors:", errors);
                  console.log("Form values:", formMethods.getValues());

                  // Manually trigger validation for all fields
                  const isValid = await trigger();
                  console.log("Is form valid after trigger:", isValid);

                  if (!isValid) {
                    e.preventDefault();
                    console.log(
                      "❌ Form validation failed:",
                      formMethods.formState.errors
                    );
                  }
                }}
              >
                {isSubmitting ? (
                  <LoaderBtn loadertext="Inserting ..." />
                ) : (
                  "Submit"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 text-white"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
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

export default FormStocks;
