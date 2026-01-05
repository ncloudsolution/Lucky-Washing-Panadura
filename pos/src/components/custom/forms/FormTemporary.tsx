"use client";
import React from "react";
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
import { BasicDataFetch, getVariationName } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ToggleInput } from "../inputs/ToogleInput";
import { sinhalaBill } from "@/data";
import { addtoCacheCart, saveOneProductWithVariants } from "@/data/dbcache";

export interface IProductVariant {
  name: string;
  metaId: string | null;
  barcode: string | null;
  id: string | null;
  prices: { set: number; reg: number; sel: number }[];
  variation: { key: string; value: string }[] | null;
}

const FormTemporary = ({ barcode }: { barcode: string }) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof ProductVariantSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: {
      sinhalaMode: sinhalaBill,
      metaId: "temp",
      id: "temp",
      barcode: barcode,
      prices: [{ set: 1, reg: 0, sel: 0 }],
      variation: [{ key: "Name", value: "" }],
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
  const queryClient = useQueryClient();

  const onSubmit = async (formValues: FormFields) => {
    // 1️⃣ Close UI immediately
    closeRef.current?.click();

    // 2️⃣ Show processing toast
    const loadingToast = toast.loading(
      "Temporary product adding… continue scanning."
    );

    // 3️⃣ Run heavy work in background (non-blocking for UI)
    (async () => {
      try {
        // API first (because you need real IDs)
        const res = await BasicDataFetch({
          method: "POST",
          endpoint: "/api/products/temporary",
          data: formValues,
        });

        // Save to local cache DB
        await saveOneProductWithVariants({
          productsMeta: res.data.productMetaData,
          productsVarient: res.data.productVarientData,
        });

        // Now we have the REAL variant ID, safe to add to cart
        const tempVariations = [
          {
            variationId: res.data.productVarientData.id,
            variationName: getVariationName(
              res.data.productVarientData.variation
            ),
            quantity: 1,
            prices: res.data.productVarientData.prices,
            unitPrice: res.data.productVarientData.prices,
          },
        ];

        // Add to cart
        await addtoCacheCart(tempVariations);

        // Refresh products cache
        await queryClient.invalidateQueries({ queryKey: ["products"] });

        // 4️⃣ Switch toast to success
        toast.dismiss(loadingToast);
        // toast.success("Temporary product added!");
      } catch (err) {
        // Handle failure
        toast.dismiss(loadingToast);

        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";

        toast.error(errorMessage);
      }
    })();
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

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Temporary Product"
      className="gap-1"
      cardDescription={`Enterd Brcode : ${barcode}`}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-4 pb-4">
            <>
              <>
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
              </>

              <div className="hidden">
                <TextInput
                  placeholder="05"
                  labelName="Barcode"
                  fieldName="barcode"
                  control={control}
                  hasError={!!errors.barcode}
                  disabled
                />
              </div>
            </>

            <>
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

export default FormTemporary;
