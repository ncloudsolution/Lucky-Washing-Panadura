import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CentralHKInterface } from "@/utils/common/index";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";

interface SelectInputProps extends CentralHKInterface {
  selections: string[];
  isLoading?: boolean;
  labelList?: string[];
}

const SelectInput: React.FC<SelectInputProps> = ({
  control,
  fieldName,
  labelName,
  placeholder,
  selections,
  disabled = false,
  hasError = false,
  isLoading = false,
  labelList,
}) => {
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel className="font-semibold text-[12px] xxs:text-[14px]">
            {labelName}
          </FormLabel>
          <FormControl>
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
              disabled={disabled}
            >
              <SelectTrigger hasError={hasError} ref={field.ref}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {isLoading ? (
                    <div className="h-[150px] w-full flex justify-center items-center">
                      <LoaderBtn loadertext="Loading ..." />
                    </div>
                  ) : (
                    <>
                      {selections.map((item, index) => (
                        <SelectItem key={index} value={item}>
                          {item}{" "}
                          {labelList &&
                            labelList[index] !== "" &&
                            ` - ${labelList[index]}`}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default SelectInput;
