"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";

import { CentralHKInterface } from "@/utils/common";
import { useIsMobile } from "@/hooks/use-mobile";

interface ISelections {
  value: string;
  label: string;
}

interface ComplexComboInputProps extends CentralHKInterface {
  selections: ISelections[];
  hasError: boolean;
}

const ComplexComboInput: React.FC<ComplexComboInputProps> = ({
  control,
  fieldName,
  labelName,
  placeholder,
  selections,
  disabled = false,
  hasError,
}) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  return (
    <FormField
      disabled={disabled}
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel className="font-semibold text-[12px] xxs:text-[14px]">
            {labelName}
          </FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  hasError={hasError}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-normal focus:border-superbase text-sm"
                >
                  {field.value ? (
                    (() => {
                      const selected = selections.find(
                        (selection) => selection.value === field.value
                      );
                      if (!selected) return placeholder;

                      return (
                        <div className="flex items-center gap-2">
                          {selected.label.length >= (isMobile ? 30 : 45)
                            ? selected.label.substring(0, isMobile ? 30 : 45) +
                              "..."
                            : selected.label}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-muted-foreground">{placeholder}</div>
                  )}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                style={{
                  width: "var(--radix-popover-trigger-width)",
                }}
              >
                <Command className="w-full">
                  <CommandInput placeholder="Search Here..." className="h-9" />
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty>No selection found.</CommandEmpty>
                    <CommandGroup>
                      {selections.map((selection) => (
                        <CommandItem
                          className="flex items-center gap-2"
                          key={selection.value}
                          keywords={[selection.label]} // Additional keywords for better search
                          value={selection.value}
                          onSelect={(currentValue) => {
                            field.onChange(
                              currentValue === field.value ? "" : currentValue
                            );
                            setOpen(false);
                          }}
                        >
                          {selection.label}
                          <Check
                            className={cn(
                              "ml-auto",
                              field.value === selection.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ComplexComboInput;
