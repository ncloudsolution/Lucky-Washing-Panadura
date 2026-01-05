"use client";
import * as React from "react";
import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import PriceInput from "./PriceInput";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

// ✅ Correct type: part and price

const ComplexPriceInput = ({
  fields,
  control,
  removeField,
  errors,
  setNo,
}: {
  fields: { id: string }[]; // from useFieldArray
  control: Control<any>;
  removeField: (index: number) => void;
  errors: any;
  setNo?: number;
}) => {
  return (
    <div className="flex flex-col gap-y-1 w-full">
      <div className="flex flex-col space-y-3">
        {fields.map((field, index) => {
          const hasError =
            errors && errors[index] && (errors[index].sel || errors[index].reg);
          return (
            <div key={field.id} className="flex gap-3 items-start relative">
              <FormField
                control={control}
                name={`prices.${index}.set`}
                render={({ field }) => (
                  <FormItem className="w-[100px] static">
                    {index === 0 && (
                      <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
                        Set
                      </FormLabel>
                    )}
                    <FormControl>
                      <Input
                        disabled
                        {...field}
                        className="text-center"
                        value={setNo ? setNo : index + 1}
                      />
                    </FormControl>

                    {/* Remove Button - placed outside FormControl */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="p-1 absolute -right-2 -top-2 bg-primary rounded-full text-white"
                        title="Remove part"
                      >
                        <X size={12} />
                      </button>
                    )}

                    <FormMessage
                      className={`absolute left-0 ${
                        index === 0 ? "top-[75px] " : "top-[45px] "
                      } right-0 bg-card`}
                    />
                  </FormItem>
                )}
              />

              {/* Price input field */}
              <PriceInput
                placeholder="3000"
                labelName="Regular Price"
                fieldName={`prices.${index}.reg`}
                control={control}
                index={index}
                hasError={!!hasError}
              />

              <PriceInput
                labelName="Selling Price"
                placeholder="2500"
                fieldName={`prices.${index}.sel`}
                control={control}
                index={index}
                hasError={!!hasError}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplexPriceInput;
