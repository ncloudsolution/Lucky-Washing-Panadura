"use client";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { toast } from "sonner";
import { BranchSchema } from "@/utils/validations/company";
import { BasicDataFetch } from "@/utils/common/index";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import MultiInput from "@/components/custom/inputs/MultiInput";
import { Plus } from "lucide-react";

export interface IBranch {
  id: string;
  branch: string;
  address: string;
  hotlines: string[];
  createdAt: Date;
}

const FormBranch = () => {
  type FormFields = z.infer<typeof BranchSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      branch: "",
      address: "",
      hotlines: [{ value: "" }],
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { isSubmitting, errors },
  } = formMethods;

  const onSubmit = async (data: FormFields) => {
    try {
      const res = await BasicDataFetch({
        // Added await here
        method: "POST",
        endpoint: "/api/company/branch",
        data: data,
      });

      // res already contains parsed JSON from BasicDataFetch
      toast.success(res.message);
      reset();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "hotlines",
  });

  const handleAddHotline = async () => {
    const valid = await trigger("hotlines");
    if (valid) {
      append({ value: "" });
    }
  };

  return (
    <FormWrapper
      variant="default"
      cardTitle="Branch"
      className="gap-1"
      cardDescription="It's time to branching"
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-2 pb-4">
            <TextInput
              placeholder="Homagama"
              labelName="Branch"
              fieldName="branch"
              control={control}
              hasError={!!errors.branch}
            />

            <TextInput
              placeholder="123 Pitipana, Homagama"
              labelName="Address"
              fieldName="address"
              control={control}
              hasError={!!errors.address}
            />

            <>
              <MultiInput
                fieldName="hotlines"
                labelName="Hotlines"
                fields={fields}
                control={control}
                removeField={remove}
                type="mobile" // ← renders your MobileInput
                placeholder="7x xxx xxxx"
              />
              <Button
                type="button"
                onClick={handleAddHotline}
                className="mt-2 w-full border-1 border-primary bg-transparent text-primary hover:bg-transparent"
              >
                <Plus size={18} /> Add More Hotlines
              </Button>
            </>
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

export default FormBranch;
