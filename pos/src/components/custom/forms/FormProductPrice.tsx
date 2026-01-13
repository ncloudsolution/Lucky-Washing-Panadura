"use client";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import ComplexPriceInput from "../inputs/ComplexPriceInput";
import { ProductVariantSchema } from "@/utils/validations/product";
import { BasicDataFetch } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  addNewProductPriceToTheVarientWithInCart,
  cachedb,
} from "@/data/dbcache";

export interface IProductVariant {
  name: string;
  metaId: string | null;
  barcode: string | null;
  id: string | null;
  prices: { set: number; reg: number; sel: number }[];
  variation: { key: string; value: string }[] | null;
}

const FormProductPrice = ({
  vid,
  nextSetNo,
}: {
  vid: string;
  nextSetNo: number;
}) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof ProductVariantSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: {
      sinhalaMode: true,
      id: vid,
      prices: [{ set: nextSetNo, reg: 0, sel: 0 }],
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    trigger,

    formState: { isSubmitting, errors },
  } = formMethods;

  const queryClient = useQueryClient();

  const onSubmit = async (data: FormFields) => {
    try {
      const res = await BasicDataFetch({
        method: "POST",
        endpoint: "/api/products/variant/only?new-price-set=true",
        data: data,
      });

      await addNewProductPriceToTheVarientWithInCart(vid, {
        set: Number(data.prices[0].set),
        reg: Number(data.prices[0].reg),
        sel: Number(data.prices[0].sel),
      });
      //to retriger products page queryfunction to hapen
      await queryClient.invalidateQueries({ queryKey: ["products"] });

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

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Price"
      className="gap-1"
      cardDescription="Add new Price"
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-4 pb-4">
            <ComplexPriceInput
              fields={priceFields}
              removeField={removePrice}
              control={control}
              errors={errors.prices}
              setNo={nextSetNo}
            />

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

export default FormProductPrice;
