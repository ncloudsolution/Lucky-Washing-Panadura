"use client";
import React, { JSX, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { toast } from "sonner";
import { BasicDataFetch } from "@/utils/common/index";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";

import { DialogClose } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { isEqual } from "lodash";
import PriceInput from "../inputs/PriceInput";
import { ExpenseSchema } from "@/utils/validations/company";
import { TPaymentMethod } from "@/data";
import {
  CircleDollarSign,
  CircleQuestionMark,
  CreditCard,
  Landmark,
} from "lucide-react";
import SelectInput from "../inputs/SelectInput";

export interface IExpense {
  id?: string;
  category: string;
  amount: number;
  paymentMethod: TPaymentMethod;
  remarks: string;
  createdAt: Date;
}

const payOptions: { name: TPaymentMethod; icon: JSX.Element }[] = [
  { name: "Cash", icon: <CircleDollarSign /> },
  { name: "Card", icon: <CreditCard /> },
  { name: "Bank", icon: <Landmark /> },
  { name: "Credit", icon: <CircleQuestionMark /> },
];

const FormExpense = ({
  data,
  type = "new",
  expenseArray,
}: {
  data?: IExpense;
  type?: "edit" | "new";
  expenseArray: string[];
}) => {
  //1 - ✅ set ref
  const [activeOption, setActiveOption] = useState<TPaymentMethod>("Cash");
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const queryClient = useQueryClient();

  type FormFields = z.infer<typeof ExpenseSchema>;
  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      id: data?.id ?? "",
      category: data?.category ?? "",
      amount: data?.amount ?? "",
      paymentMethod: data?.paymentMethod ?? activeOption,
      remarks: data?.remarks ?? "",
    },
    mode: "onSubmit",
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
    return console.log(formValues);
    if (type === "edit") {
      const set1 = {
        category: data!.category,
        amount: data!.amount,
        paymentMethod: data!.paymentMethod,
        remarks: data!.remarks,
      };

      const set2 = {
        category: formValues.category,
        amount: formValues.amount,
        paymentMethod: formValues.paymentMethod,
        remarks: formValues.remarks,
      };

      // console.log(
      //   "formValues.variation:",
      //   JSON.stringify(formValues.variation)
      // );

      if (isEqual(set1, set2)) {
        console.log("no chnages");
        return setError("root", {
          message: "No changes detected. Please modify at least one field.",
        });
      }

      // return console.log("changes detected");
    }
    try {
      const res = await BasicDataFetch({
        // Added await here
        method: type === "new" ? "POST" : "PUT",
        endpoint: "/api/company/expense",
        data: formValues,
      });

      // 2 - ✅ Close the dialog after submission
      closeRef.current?.click();

      if (type === "new") {
        queryClient.setQueryData(["expenses"], (oldData: any) => {
          const oldArray: IExpense[] = oldData?.data ?? [];

          const newData: IExpense = {
            ...formValues, // 👈 use API response if available
            amount: Number(formValues.amount),
            id: `x-${Date.now()}`,
            createdAt: new Date(),
          };

          return {
            ...oldData,
            data: [newData, ...oldArray],
          };
        });
      } else {
        queryClient.setQueryData(["expenses"], (oldData: any) => {
          const oldArray: IExpense[] = oldData?.data ?? [];
          const newArray = oldArray.map((i) =>
            i.id !== data?.id
              ? i
              : {
                  ...i,
                  category: formValues.category,
                  amount: formValues.amount,
                  paymentMethod: formValues.paymentMethod,
                  remarks: formValues.remarks,
                }
          );

          return {
            ...oldData,
            data: newArray,
          };
        });
      }

      // res already contains parsed JSON from BasicDataFetch
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
      cardTitle="Expense"
      className="gap-1"
      cardDescription={`${
        type === "new" ? "Create a Expense" : "Edit The Expense"
      }`}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-2 pb-4">
            <SelectInput
              placeholder="Select Category"
              control={control}
              fieldName="category"
              labelName="Category"
              selections={expenseArray}
              // labelList={[
              //   "",
              //   "Kilogram",
              //   "Liter",
              //   "Inch",
              //   "Foot",
              //   "Yard",
              //   "Meter",
              //   "Square Foot",
              //   "Square Meter",
              //   "Cube",
              // ]}
            />

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
                      if (activeOption !== opt.name) {
                        setActiveOption(opt.name);
                        setValue("paymentMethod", opt.name);
                      }
                    }}
                    key={index}
                    className={`flex flex-1 bg-secondary rounded-sm  hover:shadow-md ${
                      activeOption === opt.name &&
                      "bg-subbase text-white hover:bg-subbase hover:text-white"
                    }`}
                    variant={"ghost"}
                  >
                    {opt.icon} {opt.name}
                  </Button>
                ))}
              </div>
            </div>

            <TextInput
              placeholder="Reason or explanation"
              labelName="Remarks Optional"
              specialTag="Optional"
              fieldName={`remarks`}
              control={control}
              hasError={!!errors.remarks}
              type="textarea"
            />
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

export default FormExpense;
