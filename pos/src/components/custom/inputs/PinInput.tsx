import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { CentralHKInterface } from "@/utils/common/index";

interface PinInputProps extends CentralHKInterface {
  count: number;
  big?: boolean;
  password?: boolean;
}

const PinInput = ({
  control,
  labelName,
  fieldName,
  hasError = false,
  big = false,
  count,
  password = false,
}: PinInputProps) => {
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-semibold text-[12px] xxs:text-[14px]">
            {labelName}
          </FormLabel>
          <FormControl>
            <InputOTP
              {...field}
              //   onComplete={handleSubmit(onSubmit)}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              //   disabled={manualSubmitting}
            >
              <InputOTPGroup big={big}>
                {/* style={{ height: 44, width: 44 }}  */}
                {Array.from({ length: count }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    hasError={hasError}
                    big={big}
                    password={password}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default PinInput;
