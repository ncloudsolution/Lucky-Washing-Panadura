"use client";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { Plus } from "lucide-react";
import ComplexPriceInput from "../inputs/ComplexPriceInput";
import ComplexVariations from "../inputs/ComplexVariations";
import { ProductVariantSchema } from "@/utils/validations/product";
import { BasicDataFetch } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import { cachedb } from "@/data/dbcache";
import { useQueryClient } from "@tanstack/react-query";
import { DevTool } from "@hookform/devtools";
import { isEqual } from "lodash";
import { ToggleInput } from "../inputs/ToogleInput";

export interface IProductVariant {
  name: string;
  metaId: string | null;
  barcode: string | null;
  id: string | null;
  prices: { set: number; reg: number; sel: number }[];
  variation: { key: string; value: string }[] | null;
}

const FormVariation = ({
  data,
  type,
}: {
  data: IProductVariant & { sinhalaMode: boolean };
  type: "edit" | "new";
}) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof ProductVariantSchema>;

  function transformToKeyValue(
    variation: { key: string; value: string }[] | Record<string, string> | null
  ): { key: string; value: string }[] {
    if (!variation) return [];

    // If it's already an array, return it as is
    if (Array.isArray(variation)) {
      return variation;
    }

    // If it's an object, transform it to array
    return Object.entries(variation).map(([key, value]) => ({
      key,
      value,
    }));
  }

  const transformedVariation = transformToKeyValue(data.variation);
  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: {
      sinhalaMode: data.sinhalaMode,
      metaId: data.metaId ?? "",
      id: data.id ?? "",
      barcode: data.barcode ?? "",
      prices: data.prices,
      variation: transformedVariation,
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = formMethods;

  const sinhalaModeValue = watch("sinhalaMode");

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
    if (type === "edit") {
      const set1 = {
        barcode: data.barcode,
        prices: data.prices,
        variation: transformedVariation,
      };

      const set2 = {
        barcode: formValues.barcode,
        prices: formValues.prices,
        variation: formValues.variation,
      };

      //
      //
      //
      //
      //
      //
      //   "formValues.variation:",
      //   JSON.stringify(formValues.variation)
      // );

      if (isEqual(set1, set2)) {
        return setError("root", {
          message: "No changes detected. Please modify at least one field.",
        });
      }

      // return
    }

    try {
      const res = await BasicDataFetch({
        method: type === "new" ? "POST" : "PUT",
        endpoint: "/api/products/variant",
        data: formValues,
      });

      if (type !== "edit") {
        await cachedb.productVarient.put(res.data);
        await queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        const { id, barcode, variation, prices, metaId } = res.data;

        await cachedb.productVarient.update(id, {
          barcode,
          variation,
          prices,
        });
        //to retriger products page queryfunction to hapen
        await queryClient.invalidateQueries({ queryKey: ["products"] });
      }

      closeRef.current?.click();

      // res already contains parsed JSON from BasicDataFetch
      toast.success(res.message);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const {
    fields: priceFields,
    append: appendPrice,
    remove: removePrice,
  } = useFieldArray({
    control,
    name: "prices",
  });

  const handleAddPrices = async () => {
    const valid = await trigger("prices");
    if (valid) {
      appendPrice({ set: priceFields.length + 1, reg: 0, sel: 0 });
    }
  };

  const {
    fields: variationFields,
    append: appendVariation,
    remove: removeVariation,
  } = useFieldArray({
    control,
    name: "variation",
  });

  const handleAddVariation = async () => {
    const valid = await trigger("variation");
    if (valid) {
      appendVariation({ key: "", value: "" });
    }
  };

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Product Variation"
      className="gap-1"
      cardDescription={
        type === "new"
          ? `Add new variant for ${data.name}`
          : `Edit the variant of ${data.name}`
      }
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-4 pb-4">
            <>
              <TextInput
                placeholder="05"
                labelName="Barcode Optional"
                fieldName="barcode"
                specialTag="Optional"
                control={control}
                hasError={!!errors.barcode}
              />

              {data.variation && (
                <>
                  <div className="w-full h-1 border-b-2 border-dashed border-gray-400 my-2" />
                  <div className="relative">
                    <ComplexVariations
                      control={control}
                      fields={variationFields}
                      removeField={removeVariation}
                      errors={errors.variation}
                      sinhalaMode={sinhalaModeValue}
                    />
                    <div className="absolute right-0 top-0">
                      <ToggleInput
                        name="sinhalaMode"
                        labelName="Sinhala Mode"
                        control={control}
                      />
                    </div>
                  </div>

                  {/**-----------old way----multiple**/}
                  {/* <Button
                  type="button"
                  onClick={handleAddVariation}
                  className={`mt-2 w-full  border-1 border-primary bg-transparent text-primary hover:bg-transparent`}
                >
                  <Plus size={18} /> Add More
                </Button> */}
                </>
              )}
            </>

            <>
              <div className="w-full h-1 border-b-2 border-dashed border-gray-400 my-2" />
              <ComplexPriceInput
                fields={priceFields}
                removeField={removePrice}
                control={control}
                errors={errors.prices}
              />

              <Button
                type="button"
                onClick={handleAddPrices}
                className={`mt-2 w-full  border-1 border-primary bg-transparent text-primary hover:bg-transparent`}
              >
                <Plus size={18} /> Add More
              </Button>
            </>

            {errors.root && (
              <p className="text-destructive text-sm mt-2">
                {errors.root.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <Button
              type="submit"
              className="flex-1 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderBtn loadertext="Inserting ..." />
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

export default FormVariation;
