"use client";
import React, { JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormLabel } from "@/components/ui/form";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { BasicDataFetch } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LoaderBtn } from "../buttons/LoaderBtn";
import { Check, CheckCheck, CircleX, RefreshCw } from "lucide-react";
import { IOrderMeta, TOrderStatus } from "@/data";

import { DateRange } from "react-day-picker";
import { StatusSchema } from "@/utils/validations/company";

const FormStateChange = ({
  data,
  dates,
}: {
  data: IOrderMeta;
  dates: DateRange | undefined;
}) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof StatusSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(StatusSchema),
    defaultValues: {
      id: data.id,
      status: data.status,
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    setValue,
    setError,
    formState: { isSubmitting, errors },
  } = formMethods;

  const queryClient = useQueryClient();

  const onSubmit = async (formValues: FormFields) => {
    console.log(formValues);
    const start = performance.now();
    console.log("hello");
    if (data.status === formValues.status) {
      return setError("status", {
        message: "No changes detected. Please modify the status and submit.",
      });
    }

    // return console.log("returned");

    try {
      const res = await BasicDataFetch({
        // Added await here
        method: "PUT",
        endpoint: "/api/orders/status",
        data: formValues,
      });

      console.log(res);

      await queryClient.invalidateQueries({
        queryKey: ["all-orders", dates],
      });

      closeRef.current?.click();
      const end = performance.now();
      const responseTimeMs = end - start;

      // res already contains parsed JSON from BasicDataFetch
      toast.success(
        `Status updated successfully in ${(responseTimeMs / 1000).toFixed(2)}s`,
      );
    } catch (err) {
      console.log(err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const statusArray: { name: TOrderStatus; icon: JSX.Element }[] = [
    {
      name: "Processing",
      icon: <RefreshCw />,
    },
    { name: "Packed", icon: <Check /> },
    { name: "Delivered", icon: <CheckCheck /> },
    { name: "Cancelled", icon: <CircleX /> },
  ];
  const status = formMethods.watch("status");

  return (
    <FormWrapper
      variant="dialog"
      cardTitle={`Order Status`}
      className="gap-1"
      cardDescription={`Invoice No - ${data.invoiceId}`}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-4">
            <div className="flex flex-col gap-2 py-1">
              <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
                Status
              </FormLabel>
              <div className="flex w-full gap-3 justify-between">
                {statusArray.map((opt, index) => (
                  <Button
                    disabled={opt.name === data.status}
                    type="button"
                    onClick={() => {
                      if (status !== opt.name) {
                        setValue("status", opt.name);
                      }
                    }}
                    key={index}
                    className={`flex flex-1 rounded-sm hover:shadow-md ${
                      status === opt.name
                        ? status === "Processing"
                          ? "bg-amber-500 hover:bg-amber-500 hover:text-white text-white"
                          : status === "Packed"
                            ? "bg-green-700 hover:bg-green-700 hover:text-white text-white"
                            : status === "Delivered"
                              ? "bg-superbase hover:bg-superbase hover:text-white text-white"
                              : status === "Cancelled"
                                ? "bg-destructive hover:bg-destructive hover:text-white text-white"
                                : "bg-gray-300"
                        : "bg-gray-100"
                    }`}
                    variant={"ghost"}
                  >
                    {opt.icon} {opt.name}
                  </Button>
                ))}
              </div>
            </div>
            {errors.status && status === data.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
            <Button
              type="submit"
              className="flex-1 mt-3 bg-black/80 text-white hover:bg-black w-full focus:bg-black shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderBtn loadertext="Updating ..." />
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>

        {/*3 - ✅ Hidden close button */}
        <DialogClose asChild>
          <button type="button" className="hidden" ref={closeRef}></button>
        </DialogClose>
        {/* <DevTool control={control} /> */}
      </Form>
    </FormWrapper>
  );
};

export default FormStateChange;
