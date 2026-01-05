import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";
import { Control } from "react-hook-form";

interface TextInput {
  control: Control<any>;
  fieldName: string;
  labelName: string;
  placeholder?: string;
  index?: number;
  hasError: boolean;
  nonComplex?: boolean;
}

const PriceInput: React.FC<TextInput> = ({
  control,
  fieldName,
  labelName,
  placeholder,
  index = 0,
  hasError,
  nonComplex,
}) => {
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem
          className={`${
            hasError && !nonComplex ? "mb-5" : "mb-0"
          } w-full static`}
        >
          {index === 0 && (
            <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
              {labelName}
            </FormLabel>
          )}
          <FormControl>
            <Input
              autoComplete="off"
              {...field}
              placeholder={placeholder}
              inputMode="decimal"
              onChange={(e) => {
                let value = e.target.value;

                if (
                  value.length > 1 &&
                  value.startsWith("0") &&
                  !value.startsWith("0.")
                ) {
                  value = value.replace(/^0+/, "");
                }

                if (value === "" || value === ".") {
                  field.onChange(value);
                  return;
                }

                // Allow decimal input but keep as string
                if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                  field.onChange(value);
                }
              }}
              onBlur={(e) => {
                // Convert to number only when field loses focus
                const value = e.target.value;
                if (value === "" || value === ".") {
                  field.onChange(0);
                } else {
                  field.onChange(Number(value) || 0);
                }
              }}
              value={field.value ?? ""}
            />
          </FormControl>
          {nonComplex ? (
            <FormMessage />
          ) : (
            <FormMessage
              className={`absolute left-0 ${
                index === 0 ? "top-[75px] " : "top-[45px] "
              } right-0 bg-card`}
            />
          )}
        </FormItem>
      )}
    />
  );
};

export default PriceInput;
