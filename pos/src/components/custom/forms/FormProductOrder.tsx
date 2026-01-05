"use client";
import React, { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import OrderVariationInput from "../inputs/OrderVariationInput";
import { IPriceVarient } from "@/data";

export interface ISelectedVariation {
  variationName: string;
  variationId: string;
  prices: IPriceVarient[];
  quantity: number;
  unitPrice: number;
}

interface FormProductOrderProps {
  selectedVariations: ISelectedVariation[];
  onSubmission: (data: any) => void;
}

const FormProductOrder: React.FC<FormProductOrderProps> = ({
  selectedVariations,
  onSubmission,
}) => {
  const ProductOrderSchema = z.object({
    variations: z
      .array(
        z.object({
          variationId: z.string().min(1, "Variation ID is required"),
          price: z.string().min(1, "Price is required"),
          quantity: z.number().min(1, "Quantity must be at least 1"),
        })
      )
      .min(1, "At least one variation is required"),
  });

  type FormFields = z.infer<typeof ProductOrderSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ProductOrderSchema),
    mode: "onSubmit",
    defaultValues: {
      variations: selectedVariations.map((variation) => ({
        variationId: variation.variationId,
        price: variation.prices[0]?.sel?.toString() || "",
        quantity: variation.quantity || 1,
      })),
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
  } = formMethods;

  const { fields, remove } = useFieldArray({
    control,
    name: "variations",
  });

  // Merge instead of reset hard
  useEffect(() => {
    if (selectedVariations.length) {
      const currentValues = watch("variations");
      const merged = selectedVariations.map((variation) => {
        const existing = currentValues.find(
          (v) => v.variationId === variation.variationId
        );
        return {
          variationId: variation.variationId,
          price: existing?.price || variation.prices[0]?.sel?.toString() || "",
          quantity: existing?.quantity || variation.quantity || 1,
        };
      });

      reset({ variations: merged }, { keepDefaultValues: false });
    }
  }, [selectedVariations, reset, watch]);

  const onSubmit = async (data: FormFields) => {
    console.log(data, "dd");
    const enrichedData = data.variations.map((formVariation) => {
      const variationDetails = selectedVariations.find(
        (v) => v.variationId === formVariation.variationId
      );

      return {
        variationId: formVariation.variationId,
        variationName: variationDetails?.variationName || "",
        unitPrice: formVariation.price,
        quantity: formVariation.quantity,
        prices: variationDetails?.prices || [],
      };
    });

    onSubmission(enrichedData);
  };

  // Get unique price options for each variation separately
  const getPriceOptionsForVariation = (variationId: string) => {
    const variation = selectedVariations.find(
      (v) => v.variationId === variationId
    );
    if (!variation) return [];
    return variation.prices
      .map((priceSet) => priceSet.sel?.toString())
      .filter(
        (price): price is string => price !== undefined && price !== null
      );
  };

  const watchedVariations = watch("variations");

  return (
    <FormWrapper variant="dialog">
      <Form {...formMethods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${
            selectedVariations.length > 1 ? "space-y-4" : "space-y-2"
          }`}
        >
          {fields.map((field, index) => {
            const variationId = watchedVariations?.[index]?.variationId;
            const priceOptions = variationId
              ? getPriceOptionsForVariation(variationId)
              : [];

            return (
              <div key={field.id} className="border rounded-lg p-4">
                <OrderVariationInput
                  control={control}
                  fieldName="variations"
                  labelName="Variations"
                  fields={[field]}
                  removeField={remove}
                  priceArray={priceOptions}
                  variations={selectedVariations}
                  variationIndex={index}
                />
              </div>
            );
          })}

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 bg-superbase/80 text-white hover:bg-superbase focus:bg-superbase shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderBtn loadertext="Adding to cart..." />
              ) : (
                "Add to Cart"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </FormWrapper>
  );
};

export default FormProductOrder;
