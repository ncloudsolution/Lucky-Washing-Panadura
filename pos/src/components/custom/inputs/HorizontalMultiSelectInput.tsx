import * as React from "react";
import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CentralHKInterface } from "@/utils/common";

interface IHorizontalMultiSelectInput extends CentralHKInterface {
  selections: { id: string; name: string }[];
  appendCategory: (x: any) => void;
  removeCategory?: (index: number) => void;
  hasError: boolean;
  specialTag?: string;
}

export function HorizontalMultiSelectInput({
  placeholder,
  labelName,
  control,
  fieldName,
  selections,
  hasError,
  specialTag,
  appendCategory,
  removeCategory,
}: IHorizontalMultiSelectInput) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredSelections = React.useMemo(() => {
    if (!search) return selections;
    return selections.filter((sel) =>
      sel.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, selections]);

  const labelParts = specialTag ? labelName.split(specialTag) : [labelName];
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="w-full">
          {labelName && (
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
          )}
          <FormControl>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  hasError={hasError}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={`${
                    open && "border-superbase"
                  } w-full justify-between font-normal px-3 h-auto min-h-10 rounded-sm hover:bg-background focus:border-superbase`}
                >
                  <div className="flex flex-wrap gap-1 items-center flex-1">
                    {field.value && field.value.length > 0 ? (
                      field.value.map((item: any, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-superbase/10 text-superbase px-2 py-1 rounded text-xs"
                        >
                          {item.value}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCategory?.(index);
                            }}
                            role="button"
                            tabIndex={0}
                            className="hover:text-superbase cursor-pointer"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                removeCategory?.(index);
                              }
                            }}
                          >
                            <X size={14} />
                          </div>
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">{placeholder}</span>
                    )}
                  </div>
                  <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 z-[1001]"
                style={{
                  width: "var(--radix-popover-trigger-width)",
                }}
              >
                <Command>
                  <CommandInput
                    autoFocus
                    placeholder={placeholder}
                    value={search}
                    onValueChange={setSearch}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {filteredSelections.map((sel) => {
                        const isSelected = field.value?.some(
                          (v: any) => v.value === sel.name
                        );
                        return (
                          <CommandItem
                            className="flex justify-between"
                            key={sel.id}
                            value={sel.name}
                            onSelect={() => {
                              if (!isSelected) {
                                appendCategory(sel.name);
                              } else {
                                const index = field.value.findIndex(
                                  (v: any) => v.value === sel.name
                                );
                                if (index !== -1) {
                                  removeCategory?.(index);
                                }
                              }
                              setSearch("");
                            }}
                          >
                            {sel.name}
                            <Check
                              className={cn(
                                "h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        );
                      })}
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
}
