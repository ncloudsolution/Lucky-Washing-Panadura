import React, { useState } from "react";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Control } from "react-hook-form";
import { playMusic } from "@/utils/common";
import { TMetric } from "@/data";

interface CounterInputProps {
  control: Control<any>;
  fieldName: string;
  disabled?: boolean;
  hasError?: boolean;
  mini?: boolean;
  onEnterPress?: () => void; // Add this prop
  metric?: TMetric;
}

const CounterInput: React.FC<CounterInputProps> = ({
  control,
  fieldName,
  disabled = false,
  mini = false,
  onEnterPress, // Add this
  metric,
}) => {
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => {
        const handleCount = (down: boolean) => {
          const current = Number(field.value) || 1;
          const next = down ? Math.max(1, current - 1) : current + 1;
          field.onChange(next);
          down
            ? playMusic("/sounds/negative-pop.mp3")
            : playMusic("/sounds/positive-pop.mp3");
        };

        return (
          <FormItem className="flex items-center gap-2 bg-sidebar shadow-none relative">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleCount(true)}
              disabled={disabled || (Number(field.value) || 1) <= 1}
              className={`${mini && "size-[24px] rounded-sm shadow-none"}`}
            >
              –
            </Button>

            <FormControl>
              <Input
                autoComplete="off"
                className={`${
                  mini ? "text-xs w-[35px] p-[2px] h-[28px]" : " w-[60px]"
                } text-center`}
                {...field}
                inputMode="numeric"
                onChange={(e) => {
                  let v = e.target.value;

                  // Allow only digits (and dot if metric is true)
                  const pattern = metric !== "None" ? /^\d*\.?\d*$/ : /^\d*$/;
                  if (!pattern.test(v)) return;

                  // Convert "." to "0." (only if metric is true)
                  if (metric && v === ".") v = "0.";

                  field.onChange(v); // always keep string while typing
                }}
                onBlur={() => {
                  // If user stops on ".", remove dot or interpret as number
                  if (
                    field.value === "" ||
                    field.value === "." ||
                    field.value === "0."
                  ) {
                    field.onChange(""); // empty means invalid anyway
                    return;
                  }

                  field.onChange(Number(field.value)); // convert to number only when finished
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    // Trigger blur to convert string to number first
                    e.currentTarget.blur();
                    // Then trigger form submission
                    if (onEnterPress) {
                      onEnterPress();
                    }
                  }
                }}
                value={field.value ?? 1}
                disabled={disabled}
              />
            </FormControl>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleCount(false)}
              disabled={disabled}
              className={`${mini && "size-[24px] rounded-sm shadow"}`}
            >
              +
            </Button>
          </FormItem>
        );
      }}
    />
  );
};

export default CounterInput;
