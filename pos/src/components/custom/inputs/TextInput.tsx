import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import MobileInput from "@/components/custom/inputs/MobileInput";
import { CentralHKInterface } from "@/utils/common";
import RichTextEditor from "./rich-text-editor";

// import RichTextEditor from "./rich-text-editor";
// import MobileInput from "./MobileInput";

interface TextInput extends CentralHKInterface {
  type?: string;
  specialTag?: string;
  autoCapitalized?: boolean;
  pointerNone?: boolean;
}

const TextInput: React.FC<TextInput> = ({
  control,
  fieldName,
  labelName,
  type = "text",
  placeholder,
  specialTag,
  autoCapitalized = false,
  disabled = false,
  hasError = false,
  pointerNone = false,
}) => {
  const labelParts = specialTag ? labelName.split(specialTag) : [labelName];

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel className="font-semibold text-[12px] xxs:text-[14px]">
            {labelParts.map((part, index) => (
              <span key={index}>
                {part}
                {/* Add bold styling only if we're not at the last part and `specialTag` exists */}
                {index < labelParts.length - 1 && specialTag && (
                  <span className="font-semibold text-[10px] leading-[10px] text-black bg-gray-200 px-2 py-1 mx-1 rounded-sm">
                    {specialTag}
                  </span>
                )}
              </span>
            ))}
          </FormLabel>

          <FormControl>
            <div className={`${pointerNone && "pointer-events-none"}`}>
              {(type === "text" || type === "password") && (
                <Input
                  hasError={hasError}
                  disabled={disabled}
                  autoComplete="off"
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  onChange={(e) => {
                    // Get the current input value
                    let updatedValue = e.target.value;

                    if (autoCapitalized) {
                      // Capitalize the first letter of the input value by default
                      if (updatedValue && updatedValue.length > 0) {
                        updatedValue = updatedValue.toUpperCase();
                      }

                      // Apply the default capitalization
                      e.target.value = updatedValue;

                      // // Call custom onChange if provided (without assigning its return value)
                      // if (onChange) {
                      //   onChange(e); // This just calls the custom handler, without expecting a return value
                      // }
                    }
                    // Update the form state
                    field.onChange(e);
                  }}
                />
              )}
              {type === "textarea" && (
                <Textarea
                  disabled={disabled}
                  {...field}
                  placeholder={placeholder}
                  autoComplete="off"
                />
              )}
              {type === "number" && (
                <Input
                  hasError={hasError}
                  disabled={disabled}
                  autoComplete="off"
                  {...field}
                  type="number"
                  placeholder={placeholder}
                  step="any" // Allows decimal input
                  inputMode="decimal" // Suggests decimal keyboard on mobile
                  onChange={(e) => {
                    const rawValue = e.target.value;

                    if (rawValue === "") {
                      field.onChange(""); // Allow empty
                      return;
                    }

                    const parsedValue = parseFloat(rawValue);

                    // Only update if the parsed value is a valid number
                    if (!isNaN(parsedValue)) {
                      field.onChange(parsedValue); // Keep as number
                    }
                  }}
                  value={field.value ?? ""}
                />
              )}

              {type === "texteditor" && (
                <RichTextEditor
                  content={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}

              {type === "mobile" && (
                <MobileInput
                  hasError={hasError}
                  value={field.value}
                  onChange={field.onChange}
                  // onBlur={field.onBlur}
                  placeholder={placeholder}
                />
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TextInput;
