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
import { BasicDataFetch } from "@/utils/common/index";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { CustomerSchema } from "@/utils/validations/customer";
import { DialogClose } from "@radix-ui/react-dialog";
import { setCurrentCustomer } from "@/data/dbcache";
import { useQueryClient } from "@tanstack/react-query";
import { isEqual } from "lodash";

export interface ICustomer {
  id: string;
  name: string;
  mobile: string;
  createdAt: Date;
}

const FormExpense = ({
  data,
  type = "new",
}: {
  data?: ICustomer;
  type?: "edit" | "new";
}) => {
  //1 - ✅ set ref
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const queryClient = useQueryClient();

  type FormFields = z.infer<typeof CustomerSchema>;
  const formMethods = useForm<FormFields>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      name: data?.name ?? "",
      mobile: data?.mobile ?? "",
    },
    mode: "onSubmit",
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, errors },
  } = formMethods;

  const onSubmit = async (formValues: FormFields) => {
    if (type === "edit") {
      const set1 = {
        name: data!.name,
        mobile: data!.mobile,
      };

      const set2 = {
        name: formValues.name,
        mobile: formValues.mobile,
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
        data:
          type === "new"
            ? formValues
            : { ...formValues, oldMobile: data?.mobile },
      });

      // 2 - ✅ Close the dialog after submission
      closeRef.current?.click();

      if (type === "new") {
        queryClient.setQueryData(["customers"], (oldData: any) => {
          const oldArray: ICustomer[] = oldData?.data ?? [];

          const newData: ICustomer = {
            ...formValues, // 👈 use API response if available
            id: `x-${Date.now()}`,
            createdAt: new Date(),
          };

          return {
            ...oldData,
            data: [newData, ...oldArray],
          };
        });
      } else {
        queryClient.setQueryData(["customers"], (oldData: any) => {
          const oldArray: ICustomer[] = oldData?.data ?? [];
          const newArray = oldArray.map((i) =>
            i.mobile !== data?.mobile
              ? i
              : { ...i, mobile: formValues.mobile, name: formValues.name }
          );

          return {
            ...oldData,
            data: newArray,
          };
        });
      }

      // res already contains parsed JSON from BasicDataFetch
      toast.success(res.message);

      //-------------------------------------------//
      //add the created one to selected customer
      await setCurrentCustomer(formValues.name, formValues.mobile);
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
            <TextInput
              placeholder="A.B Perera"
              labelName="Name"
              fieldName="name"
              control={control}
              hasError={!!errors.name}
            />

            <TextInput
              type="mobile"
              placeholder="+94712345678"
              labelName="Mobile"
              fieldName="mobile"
              control={control}
              hasError={!!errors.mobile}
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
