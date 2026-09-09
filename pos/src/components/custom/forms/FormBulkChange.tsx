"use client";
import React, { JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { toast } from "sonner";
import { BasicDataFetch } from "@/utils/common/index";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { DialogClose } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { SelectBulkParams } from "@/app/(screens)/core/(orders)/orders-all/page";
import { BulkStatusSchema } from "@/utils/validations/company";
import { TOrderStatus } from "@/data";
import { Check, CheckCheck, CircleX, RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";

type FormInput = z.input<typeof BulkStatusSchema>;
type FormOutput = z.output<typeof BulkStatusSchema>;

const FormBulkChange = ({
  data,
  selectBulk,
  dates,
  setBulkActive,
}: {
  data: SelectBulkParams[];
  selectBulk: (params: SelectBulkParams) => void;
  dates: DateRange | undefined;
  setBulkActive: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const ids = data.map((i) => i.orderId);
  //1 - ✅ set ref
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const queryClient = useQueryClient();

  type FormFields = z.infer<typeof BulkStatusSchema>;
  const formMethods = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(BulkStatusSchema),
    defaultValues: {
      ids: ids,
      status: undefined,
    },
    mode: "onSubmit",
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { isSubmitting, errors },
  } = formMethods;

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

  const onSubmit = async (formValues: FormFields) => {
    try {
      const res = await BasicDataFetch({
        // Added await here
        method: "PUT",
        endpoint: "/api/orders/status/bulk",
        data: formValues,
      });

      await queryClient.invalidateQueries({
        queryKey: ["all-orders", dates],
      });

      setBulkActive(false);

      // 2 - ✅ Close the dialog after submission
      closeRef.current?.click();

      toast.success(res.message);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Bulk Status Change"
      className="gap-1"
      cardDescription={`Select multiple orders and update their status in one action.`}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 py-1">
            <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
              Invoices
            </FormLabel>
            <div className="flex w-full gap-3">
              {data.map((i, index) => {
                const invoiceId = i.invoiceId.toString();
                const counterId = invoiceId.slice(0, 2);
                const invoiceIdOnly = invoiceId.slice(2);

                return (
                  <div
                    key={index}
                    className="rounded-[3px] bg-black px-2 py-1 text-xs text-white relative"
                  >
                    <span
                      className=" cursor-pointer text-[10px] size-4 rounded-full border border-white bg-black text-white flex justify-center items-center absolute -top-1.5 -right-1.5"
                      onClick={() =>
                        selectBulk({
                          invoiceId: String(i.invoiceId),
                          orderId: i.orderId as string,
                        })
                      }
                    >
                      X
                    </span>
                    {counterId}-{invoiceIdOnly}
                  </div>
                );
              })}
            </div>
            <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
              Status
            </FormLabel>
            <div className="flex w-full gap-3 justify-between">
              {statusArray.map((opt, index) => (
                <Button
                  // disabled={haveDue && opt.name === "Delivered"}
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
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}

          <Button
            type="submit"
            className="mt-2 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoaderBtn loadertext="Creating ..." /> : "Submit"}
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

export default FormBulkChange;
