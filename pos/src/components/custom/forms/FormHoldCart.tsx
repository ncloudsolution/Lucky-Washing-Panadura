"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { toast } from "sonner";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { addtoHoldCacheCart } from "@/data/dbcache";
import { DialogClose } from "@radix-ui/react-dialog";

const FormHoldCart = () => {
  //1 - ✅ set ref
  const closeRef = React.useRef<HTMLButtonElement | null>(null);

  const HoldSchema = z.object({
    customerMobile: z
      .string()
      .min(2, { message: "Customer name be at least 1 characters" }),
  });
  type FormFields = z.infer<typeof HoldSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(HoldSchema),
    defaultValues: {
      customerMobile: "",
    },
    mode: "onSubmit",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = formMethods;

  const onSubmit = async (data: FormFields) => {
    try {
      await addtoHoldCacheCart(data.customerMobile);
      // 2 - ✅ Close the dialog after submission
      closeRef.current?.click();
      toast.success("Cart held successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      // 2 - ✅ Close the dialog after submission
      closeRef.current?.click();
      toast.error(errorMessage);
    }
  };

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Hold Cart"
      className="gap-1"
      cardDescription="It's time to hold"
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-2 pb-4">
            <TextInput
              type="mobile"
              placeholder="A.B Perera"
              labelName="Customer Mobile"
              fieldName="customerMobile"
              control={control}
              hasError={!!errors.customerMobile}
            />
          </div>

          <Button
            type="submit"
            className="mt-2 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoaderBtn loadertext="Holding ..." /> : "Hold"}
          </Button>
        </form>

        {/*3 - ✅ Hidden close button */}
        <DialogClose asChild>
          <button type="button" className="hidden" ref={closeRef}></button>
        </DialogClose>
      </Form>
    </FormWrapper>
  );
};

export default FormHoldCart;
