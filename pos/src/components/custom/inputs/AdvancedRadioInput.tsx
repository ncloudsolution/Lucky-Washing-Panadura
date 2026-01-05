import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image, { StaticImageData } from "next/image";
import React from "react";
import { Control } from "react-hook-form";

interface AdvancedRadioInput {
  control: Control<any>;
  fieldName: string;
  labelName: string;
  radioList: IRadioList[];
  seperator?: boolean;
}

export interface IRadioList {
  id: string;
  label: string;
  value: string;
  primaryImg?: StaticImageData | StaticImport | string;
  descriptiveImg?: StaticImageData | StaticImport | string;
  description?: string;
  components?: React.ComponentType;
  enable: boolean;
}

export function AdvancedRadioInput({
  control,
  fieldName,
  labelName,
  radioList,
  seperator = false,
}: AdvancedRadioInput) {
  return (
    <>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className="font-semibold text-[12px] xxs:text-[14px]">
              {labelName}
            </FormLabel>

            <FormControl {...field}>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="gap-0"
              >
                {radioList.map((ob, index) => (
                  <div
                    key={ob.id}
                    className={`relative flex flex-col p-2 rounded-md cursor-pointer  ${
                      field.value === ob.value
                        ? "bg-secondary border-input"
                        : "border-transparent"
                    } transition-all duration-500 border-b-2`}
                  >
                    <div className="flex justify-between items-center w-full">
                      {/* Radio button and label */}
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={ob.value}
                          id={ob.id}
                          className="peer" // Add peer class for sibling selectors
                        />
                        <Label htmlFor={ob.id} className="cursor-pointer">
                          {ob.label}
                        </Label>
                      </div>

                      {/* Clickable overlay - only handles clicks */}
                      <label
                        htmlFor={ob.id}
                        className="absolute inset-0 cursor-pointer"
                        onClick={(e) => {
                          // Only trigger if clicking outside the radio button
                          if (!(e.target as HTMLElement).closest(".peer")) {
                            field.onChange(ob.value);
                          }
                        }}
                      />

                      {/* Rest of your content remains unchanged */}
                      <div className="h-7 w-16 relative">
                        {ob.primaryImg && (
                          <Image
                            src={ob.primaryImg}
                            fill
                            alt="payment-logo-image"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 w-full">
                      {ob.descriptiveImg && ob.value === field.value && (
                        <div className="relative h-10">
                          <Image
                            fill
                            src={ob.descriptiveImg}
                            alt="payment-logo-image"
                            className="object-contain"
                          />
                        </div>
                      )}

                      {ob.description && (
                        <div
                          className={`${
                            field.value === ob.value
                              ? "h-fit opacity-100"
                              : "h-0 opacity-0"
                          } xs:text-[12px] text-[10px] px-[2px] transition-all duration-500`}
                        >
                          <>{ob.description}</>
                        </div>
                      )}
                    </div>

                    {field.value === "bankTransfer" && ob.components && (
                      <ob.components />
                    )}

                    {seperator &&
                      field.value !== ob.value &&
                      index !== radioList.length - 1 && (
                        <Separator className="mt-2" />
                      )}
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
