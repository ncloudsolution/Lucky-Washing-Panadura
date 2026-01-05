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
import { StaffSchema } from "@/utils/validations/company";
import { BasicDataFetch } from "@/utils/common/index";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import PinInput from "@/components/custom/inputs/PinInput";
import SelectInput from "@/components/custom/inputs/SelectInput";

import { IBranch } from "./FormBranch";
import { useQuery } from "@tanstack/react-query";
import { StaffRolesArray, TStaffRole } from "@/data";

export interface IStaff {
  id: string;
  name: string;
  branch: string;
  role: TStaffRole;
  counterNo?: number; // optional, matches Int?
  email: string;
  mobile: string;
  pin: string;
  createdAt: Date;
}

const FormStaff = () => {
  const router = useRouter();
  const { update: sessionUpdate } = useSession();
  type FormFields = z.infer<typeof StaffSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      name: "",
      branch: "",
      role: undefined,
      email: "",
      mobile: "",
      pin: "",
      confirmPin: "",
    },
    mode: "onSubmit",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = formMethods;

  const {
    data: branches = [],
    isLoading: branchesLoading,
    error,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: () =>
      BasicDataFetch({
        method: "GET",
        endpoint: `/api/company/branch`,
      }),
    select: (response) => response?.data as IBranch[],
    staleTime: 1000 * 60 * 5,
  });

  const onSubmit = async (data: FormFields) => {
    try {
      const res = await BasicDataFetch({
        // Added await here
        method: "POST",
        endpoint: "/api/company/staff",
        data: data,
      });

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
      variant="default"
      cardTitle="Staff"
      className="gap-1"
      cardDescription="Hello Dear"
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

            <SelectInput
              selections={branches.map((i) => i.branch)}
              placeholder="Select Branch"
              labelName="Branch"
              fieldName="branch"
              control={control}
              hasError={!!errors.branch}
              isLoading={branchesLoading}
            />

            <SelectInput
              selections={StaffRolesArray}
              placeholder="Select Role"
              labelName="Role"
              fieldName="role"
              control={control}
              hasError={!!errors.role}
            />

            <TextInput
              placeholder="exmaple@gmail.com"
              labelName="Email"
              fieldName="email"
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

            <PinInput
              control={control}
              labelName="Pin"
              fieldName="pin"
              hasError={!!errors.pin}
              count={4}
              password
            />
            <PinInput
              control={control}
              labelName="Confirm Pin"
              fieldName="confirmPin"
              hasError={!!errors.confirmPin}
              count={4}
              password
            />
          </div>

          <Button
            type="submit"
            className="mt-2 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoaderBtn loadertext="Authenticating ..." />
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </FormWrapper>
  );
};

export default FormStaff;
