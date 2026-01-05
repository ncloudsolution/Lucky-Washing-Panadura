"use client";
import * as React from "react";
import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import CounterInput from "./CounterInput";
import SelectInput from "./SelectInput";
import { ISelectedVariation } from "../forms/FormProductOrder";

interface IOrderVariationInput {
  fieldName: string;
  labelName: string;
  fields: { id: string }[];
  control: Control<any>;
  removeField: (index: number) => void;
  placeholder?: string;
  priceArray: string[];
  variations: ISelectedVariation[];
  variationIndex?: number;
}

const OrderVariationInput: React.FC<IOrderVariationInput> = ({
  fieldName,
  fields,
  control,
  priceArray,
  variations,
  variationIndex = 0,
}) => {
  const getVariationName = (variationId: string) => {
    const variation = variations.find((v) => v.variationId === variationId);
    return variation?.variationName || "Standard Variation";
  };

  if (fields.length === 0) return null;

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-start">
            {/* Hidden variation ID field */}
            <FormField
              control={control}
              name={`${fieldName}.${variationIndex}.variationId`}
              render={({ field: formField }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...formField} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex-1 space-y-0">
              {/* Variation Name Display */}
              <FormField
                control={control}
                name={`${fieldName}.${variationIndex}.variationId`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm block">
                      {getVariationName(formField.value)}
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Price and Quantity */}
              <FormField
                control={control}
                name={`${fieldName}.${variationIndex}.price`}
                render={({ field: formField }) => (
                  <FormItem className="w-full">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <SelectInput
                          labelName=""
                          selections={priceArray}
                          disabled={priceArray.length === 1}
                          placeholder="Select Price"
                          fieldName={`${fieldName}.${variationIndex}.price`}
                          control={control}
                          {...formField}
                        />
                      </div>

                      <div className="w-32">
                        <CounterInput
                          control={control}
                          fieldName={`${fieldName}.${variationIndex}.quantity`}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderVariationInput;
