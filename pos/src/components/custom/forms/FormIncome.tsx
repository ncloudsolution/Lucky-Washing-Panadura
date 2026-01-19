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
import { isEqual } from "lodash";
import PriceInput from "../inputs/PriceInput";
import { IncomeSchema } from "@/utils/validations/company";
import { TPaymentMethod } from "@/data";
import { CircleDollarSign, CreditCard, Landmark } from "lucide-react";
import { useSession } from "next-auth/react";

export interface IIncome {
  id?: string;
  orderId: string;
  category: string;
  amount: number;
  paymentMethod: TPaymentMethod;
  createdAt: Date | string;
}

const payOptions: { name: TPaymentMethod; icon: JSX.Element }[] = [
  { name: "Cash", icon: <CircleDollarSign /> },
  { name: "Card", icon: <CreditCard /> },
  { name: "Bank", icon: <Landmark /> },
  // { name: "Credit", icon: <CircleQuestionMark /> },
];

const FormIncome = ({
  data,
  type = "new",
  due,
  orderId,
}: {
  data?: IIncome;
  type?: "edit" | "new";
  due: number;
  orderId: string;
}) => {
  const { data: session, status } = useSession();

  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const queryClient = useQueryClient();

  type FormFields = z.infer<ReturnType<typeof IncomeSchema>>;
  const formMethods = useForm<FormFields>({
    resolver: zodResolver(IncomeSchema(due)),
    defaultValues: {
      id: data?.id ?? "",
      orderId: data?.orderId ?? orderId,
      category: data?.category ?? "Balance Payment",
      amount: data?.amount ?? "",
      paymentMethod: data?.paymentMethod ?? "Cash",
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, errors },
    setValue,
  } = formMethods;

  const onSubmit = async (formValues: FormFields) => {
    if (type === "edit") {
      const set1 = {
        category: data!.category,
        amount: data!.amount,
        paymentMethod: data!.paymentMethod,
      };

      const set2 = {
        category: formValues.category,
        amount: formValues.amount,
        paymentMethod: formValues.paymentMethod,
      };

      //
      //   "formValues.variation:",
      //   JSON.stringify(formValues.variation)
      // );

      if (isEqual(set1, set2)) {
        return setError("root", {
          message: "No changes detected. Please modify at least one field.",
        });
      }
    }

    const modFormVal = {
      ...formValues,
      due: due,
      category:
        due === Number(formValues.amount)
          ? "Balance Payment"
          : "Partial Payment",
    };
    try {
      const res = await BasicDataFetch({
        // Added await here
        method: type === "new" ? "POST" : "PUT",
        endpoint: "/api/company/income",
        data: modFormVal,
      });

      // 2 - ✅ Close the dialog after submission
      closeRef.current?.click();

      if (type === "new") {
        queryClient.setQueryData(
          ["order-payment-breakdown", modFormVal.orderId],
          (oldData: any) => {
            const oldArray: IIncome[] = oldData?.data ?? [];
            const { due, ...rest } = modFormVal;

            const newData: IIncome = {
              ...rest,
              amount: Number(formValues.amount),
              id: res.data,
              createdAt: new Date(),
            };

            return {
              ...oldData,
              data: [...oldArray, newData],
            };
          },
        );

        await queryClient.invalidateQueries({
          queryKey: ["invoice", modFormVal.orderId],
        });
      } else {
        // queryClient.setQueryData(["recent-expenses"], (oldData: any) => {
        //   const oldArray: IIncome[] = oldData?.data ?? [];
        //   const newArray = oldArray.map((i) =>
        //     i.id !== data?.id
        //       ? i
        //       : {
        //           ...i,
        //           category: formValues.category,
        //           amount: formValues.amount,
        //           paymentMethod: formValues.paymentMethod,
        //         }
        //   );
        //   return {
        //     ...oldData,
        //     data: newArray,
        //   };
        // });
      }

      // res already contains parsed JSON from BasicDataFetch
      toast.success(res.message);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const paymentMethod = formMethods.watch("paymentMethod");

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Income"
      className="gap-1"
      cardDescription={`${
        type === "new" ? "Create a Income" : "Edit The Income"
      }`}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4 bg-[#ff00004d] border-1 border-[#ff00007a] mt-2 rounded-sm text-center font-semibold">
            Payment Due :{" "}
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(due)}
          </div>
          <div className="flex flex-col gap-2 w-full pt-2 pb-4">
            <PriceInput
              placeholder="5000"
              labelName="Amount"
              fieldName={`amount`}
              control={control}
              hasError={!!errors.amount}
              nonComplex
            />

            <div className="flex flex-col gap-2 py-1">
              {" "}
              <FormLabel className="font-semibold text-[12px] xxs:text-[14px] flex items-center">
                Payment Method
              </FormLabel>
              <div className="flex w-full gap-3 justify-between">
                {payOptions.map((opt, index) => (
                  <Button
                    type="button"
                    onClick={() => {
                      if (paymentMethod !== opt.name) {
                        setValue("paymentMethod", opt.name);
                      }
                    }}
                    key={index}
                    className={`flex flex-1 bg-secondary rounded-sm  hover:shadow-md ${
                      paymentMethod === opt.name &&
                      "bg-subbase text-white hover:bg-subbase hover:text-white"
                    }`}
                    variant={"ghost"}
                  >
                    {opt.icon} {opt.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {errors.root && (
            <p className="text-destructive text-sm mt-2">
              {errors.root.message}
            </p>
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

export default FormIncome;
