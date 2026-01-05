"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import CounterInput from "../inputs/CounterInput";
import { Save } from "lucide-react";
import { updateCacheCartQuantity } from "@/data/dbcache";
import { IPriceVarient, TMetric } from "@/data";
import { PriceDropDown } from "../other/PriceDropDown";

const FormCartCounter = ({
  currentQuantity,
  productVarientId,
  unitPrice,
  metric,
  priceVariations,
}: {
  currentQuantity: number;
  productVarientId: string;
  unitPrice: number;
  metric: TMetric;
  priceVariations: IPriceVarient[];
}) => {
  const QuantitySchema = z.object({
    quantity: z.number().gt(0, "Quantity must be at least 1"),
    productVarientId: z
      .string()
      .min(1, { message: "Variant Id must be at least 1 characters" }),
  });

  type FormFields = z.infer<typeof QuantitySchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(QuantitySchema),
    defaultValues: {
      quantity: currentQuantity,
      productVarientId: productVarientId,
    },
    mode: "onSubmit",
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = formMethods;

  const liveQuantity = watch("quantity");
  const onSubmit = async (data: FormFields) => {
    if (data.quantity === currentQuantity) {
      return;
    }

    try {
      await updateCacheCartQuantity(productVarientId, data.quantity);
      toast.success("Cart Updated");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...formMethods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && liveQuantity !== currentQuantity) {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }
        }}
      >
        <div className="flex items-center gap-2 relative">
          <PriceDropDown
            metric={metric}
            priceVariations={priceVariations}
            unitPrice={unitPrice}
            productVarientId={productVarientId}
          />

          <CounterInput
            metric={metric}
            control={control}
            fieldName="quantity"
            mini
            onEnterPress={() => {
              if (liveQuantity !== currentQuantity && !isSubmitting) {
                handleSubmit(onSubmit)();
              }
            }}
          />
          <Button
            type="submit"
            className={`z-50 right-0 absolute rounded-sm w-[105px] h-[24px] bg-superbase/80 text-white hover:bg-superbase focus:bg-superbase shadow-lg transition-all duration-500 ${
              liveQuantity !== currentQuantity
                ? "opacity-100 translate-y-8"
                : "opacity-0 translate-y-0 pointer-events-none"
            }`}
            // disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoaderBtn loadertext="" />
            ) : (
              <>
                <Save /> Save
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FormCartCounter;
