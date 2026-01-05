"use client";
import * as React from "react";
import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { singlishToUnicode } from "sinhala-unicode-coverter";

const ComplexVariations = ({
  fields,
  control,
  removeField,
  errors,
  sinhalaMode,
}: {
  fields: { id: string; value?: string }[]; // include value for prefill
  control: Control<any>;
  removeField: (index: number) => void;
  errors?: any;
  sinhalaMode: boolean;
}) => {
  // Initialize rawValues from existing field values if available
  const [rawValues, setRawValues] = React.useState<{ [key: string]: string }>(
    () => {
      const init: { [key: string]: string } = {};
      fields.forEach((f) => {
        init[f.id] = f.value ?? ""; // ❌ use existing value if editing
      });
      return init;
    }
  );

  return (
    <div className="flex flex-col gap-y-1 w-full">
      {fields.map((field, index) => {
        const hasError =
          errors && errors[index] && (errors[index].key || errors[index].value);

        const rawValue = rawValues[field.id] ?? "";

        return (
          <div key={field.id} className="flex gap-3 items-start relative">
            <FormField
              control={control}
              name={`variation.${index}.value`}
              render={({ field: rhfField }) => {
                const handleChange = (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => {
                  const val = e.target.value;
                  setRawValues((prev) => ({ ...prev, [field.id]: val }));
                  rhfField.onChange(sinhalaMode ? singlishToUnicode(val) : val);
                };

                const handleKeyDown = (
                  e: React.KeyboardEvent<HTMLInputElement>
                ) => {
                  if (!sinhalaMode) return;

                  const input = e.currentTarget;
                  let newRaw = rawValue;

                  if (e.key === "Backspace") {
                    e.preventDefault();
                    newRaw = rawValue.slice(0, -1);
                  } else if (e.key === " ") {
                    e.preventDefault();
                    newRaw = rawValue + " ";
                  } else if (e.key.length === 1) {
                    // normal character keys only (skip Shift, Ctrl, etc.)
                    e.preventDefault();
                    newRaw = rawValue + e.key;
                  } else {
                    return; // allow other keys (Arrow, Tab, etc.)
                  }

                  // Update raw state
                  setRawValues((prev) => ({ ...prev, [field.id]: newRaw }));

                  // Convert the full string so far to Sinhala
                  rhfField.onChange(singlishToUnicode(newRaw));
                };

                const handleBeforeInput = (
                  e: React.FormEvent<HTMLInputElement>
                ) => {
                  if (sinhalaMode) {
                    const inputEvent = e.nativeEvent as InputEvent;
                    const newChar = inputEvent.data || "";

                    // Allow spaces (or tabs) to be added
                    if (newChar === " ") {
                      const newRaw = rawValue + newChar;
                      setRawValues((prev) => ({ ...prev, [field.id]: newRaw }));
                      rhfField.onChange(singlishToUnicode(newRaw));
                      e.preventDefault();
                      return;
                    }

                    // Normal character: append and convert full string
                    const newRaw = rawValue + newChar;
                    setRawValues((prev) => ({ ...prev, [field.id]: newRaw }));
                    rhfField.onChange(singlishToUnicode(newRaw));

                    e.preventDefault(); // prevent default insertion
                  }
                };

                return (
                  <FormItem
                    className={`${hasError ? "mb-5" : "mb-0"} w-full static`}
                  >
                    {index === 0 && (
                      <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
                        Variation Name
                      </FormLabel>
                    )}
                    <FormControl>
                      <Input
                        className="w-full"
                        value={
                          sinhalaMode ? singlishToUnicode(rawValue) : rawValue
                        }
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onBeforeInput={handleBeforeInput}
                      />
                    </FormControl>
                    <FormMessage
                      className={`absolute left-0 ${
                        index === 0 ? "top-[75px]" : "top-[45px]"
                      } right-0 bg-card`}
                    />
                  </FormItem>
                );
              }}
            />

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
          </div>
        );
      })}
    </div>
  );
};

export default ComplexVariations;

//-----------old way---- variation object have multiple

// "use client";
// import * as React from "react";
// import { Control } from "react-hook-form";
// import TextInput from "./TextInput";
// import {
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { X } from "lucide-react";

// const ComplexVariations = ({
//   fields,
//   control,
//   removeField,
//   errors,
// }: {
//   fields: { id: string }[]; // from useFieldArray
//   control: Control<any>;
//   removeField: (index: number) => void;
//   errors?: any;
// }) => {
//   return (
//     <div className="flex flex-col gap-y-1 w-full">
//       <div className="flex flex-col space-y-3">
//         {fields.map((field, index) => {
//           const hasError =
//             errors &&
//             errors[index] &&
//             (errors[index].key || errors[index].value);
//           return (
//             <div key={field.id} className="flex gap-3 items-start relative">
//               <FormField
//                 control={control}
//                 name={`variation.${index}.key`}
//                 render={({ field }) => (
//                   <FormItem
//                     className={`${hasError ? "mb-5" : "mb-0"} w-full static`}
//                   >
//                     {index === 0 && (
//                       <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
//                         Attribute Name
//                       </FormLabel>
//                     )}
//                     <FormControl>
//                       <Input
//                         {...field}
//                         className="w-full"
//                         disabled={index === 0}
//                       />
//                     </FormControl>

//                     <FormMessage
//                       className={`absolute left-0 ${
//                         index === 0 ? "top-[75px] " : "top-[45px] "
//                       } right-0 bg-card`}
//                     />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={control}
//                 name={`variation.${index}.value`}
//                 render={({ field }) => {
//                   const hasError =
//                     errors &&
//                     errors[index] &&
//                     (errors[index].key || errors[index].value);
//                   return (
//                     <FormItem
//                       className={`${hasError ? "mb-5" : "mb-0"} w-full static`}
//                     >
//                       {index === 0 && (
//                         <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
//                           Variation Name {/*Attribute Value*/}
//                         </FormLabel>
//                       )}
//                       <FormControl>
//                         <Input {...field} className="w-full" />
//                       </FormControl>

//                       <FormMessage
//                         className={`absolute left-0 ${
//                           index === 0 ? "top-[75px] " : "top-[45px] "
//                         } right-0 bg-card`}
//                       />
//                     </FormItem>
//                   );
//                 }}
//               />
//               {/* Remove Button - placed outside FormControl */}
//               {index > 0 && (
//                 <button
//                   type="button"
//                   onClick={() => removeField(index)}
//                   className="p-1 absolute -right-2 -top-2 bg-primary rounded-full text-white"
//                   title="Remove part"
//                 >
//                   <X size={12} />
//                 </button>
//               )}
//               {/* <TextInput
//                 labelName="Attribute Name"
//                 fieldName={`variation.${index}.key`}
//                 control={control}
//                 placeholder="Any attribute"
//               />

//               <TextInput
//                 labelName="Attribute Value"
//                 fieldName={`variation.${index}.value`}
//                 control={control}
//                 placeholder="Any Value"
//               /> */}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default ComplexVariations;
