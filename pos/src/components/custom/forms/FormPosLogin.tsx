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
import { StaffLoginSchema } from "@/utils/validations/company";
import { BasicDataFetch } from "@/utils/common/index";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import PinInput from "@/components/custom/inputs/PinInput";

const FormPosLogin = () => {
  const router = useRouter();
  const { update: sessionUpdate } = useSession();
  type FormFields = z.infer<typeof StaffLoginSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(StaffLoginSchema),
    defaultValues: {
      mobile: "",
      pin: "",
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
      const res = await BasicDataFetch({
        // Added await here
        method: "POST",
        endpoint: "/api/auth/credential-signin",
        data: data,
      });

      // res already contains parsed JSON from BasicDataFetch
      toast.success(res.message);
      reset();
      //redirection
      await sessionUpdate();
      router.push(res.data.redirectUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  return (
    <FormWrapper
      variant="default"
      cardTitle="Pos Login"
      className="gap-1"
      cardDescription="It's time to loggin"
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-2 pb-4">
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
              big
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

export default FormPosLogin;
