"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Control, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import TextInput from "@/components/custom/inputs/TextInput";

interface IMultiInput {
  fieldName: string; // dynamic array name
  labelName: string;
  fields: { id: string }[]; // from useFieldArray
  control: Control<any>;
  removeField: (index: number) => void;
  type?: "text" | "textarea" | "number" | "mobile";
  placeholder?: string;
}

const MultiInput: React.FC<IMultiInput> = ({
  fieldName,
  labelName,
  fields,
  control,
  removeField,
  type = "text",
  placeholder,
}) => {
  const watched = useWatch({ control, name: fieldName });

  return (
    <div className="flex flex-col gap-y-1 w-full">
      <div className="space-y-1.5">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-start relative">
            <FormField
              control={control}
              name={`${fieldName}.${index}.value`}
              render={({ field, fieldState }) => (
                <FormItem className="w-full static">
                  {index === 0 && (
                    <FormLabel className="font-semibold text-[12px] xxs:text-[14px]">
                      {labelName}
                    </FormLabel>
                  )}
                  <TextInput
                    control={control}
                    fieldName={`${fieldName}.${index}.value`}
                    labelName="" // label already rendered above
                    type={type}
                    placeholder={placeholder}
                    hasError={!!fieldState.error} // Only true if THIS specific field has an error
                  />

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="p-1 absolute -right-2 -top-0.5 bg-primary rounded-full text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiInput;
