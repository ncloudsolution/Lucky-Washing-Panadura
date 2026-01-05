import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Control } from "react-hook-form";

export function ToggleInput({
  name,
  control,
  labelName,
  colorize,
}: {
  name: string;
  control: Control<any>;
  labelName: string;
  colorize?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={`flex items-center gap-5 h-6`}>
          <FormLabel className="font-semibold text-[12px] xxs:text-[14px] mb-0">
            {labelName}
          </FormLabel>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              className={`${
                colorize &&
                "data-[state=checked]:bg-superbase data-[state=unchecked]:bg-destructive"
              }`}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
