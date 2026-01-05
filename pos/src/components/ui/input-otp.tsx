"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50 w-full",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { big?: boolean }
>(({ big, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 ",
      big && "justify-between w-full",
      className
    )}
    {...props}
  />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number } & {
    hasError?: boolean;
    big?: boolean;
    password?: boolean;
  }
>(({ index, hasError, big, password, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index] as {
    char: string | null;
    hasFakeCaret: boolean;
    isActive: boolean;
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex aspect-square items-center justify-center border border-input rounded-sm transition-all",
        big ? "w-full aspect-square text-2xl" : "size-10 text-sm",
        isActive && "bg-gray-100 !border-superbase",
        char ? "bg-gray-100 text-superbase font-semibold" : "",
        hasError ? "border-destructive" : "border-input",
        className
      )}
      {...props}
    >
      {password && char ? "#" : char}

      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    {/* <Dot /> */}
    <div className="bg-primary h-1 xxs:w-4 w-3 rounded-[2px] mx-3" />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
