"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { BasicDataFetch } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight } from "lucide-react";
import ComplexComboInput from "../inputs/ComplexComboInput";
import { MiniTempTransferSchema } from "@/utils/validations/product";
import { cachedb } from "@/data/dbcache";

export interface IProductVariant {
  name: string;
  metaId: string | null;
  barcode: string | null;
  id: string | null;
  prices: { set: number; reg: number; sel: number }[];
  variation: { key: string; value: string }[] | null;
}

const FormTempMiniTransfer = ({
  data,
  nameAndMetaList,
}: {
  data: IProductVariant;
  nameAndMetaList: { label: string; value: string }[];
}) => {
  function transformToKeyValue(
    variation: { key: string; value: string }[] | Record<string, string> | null
  ): { key: string; value: string }[] {
    if (!variation) return [];

    // If it's already an array, return it as is
    if (Array.isArray(variation)) {
      return variation;
    }

    // If it's an object, transform it to array
    return Object.entries(variation).map(([key, value]) => ({
      key,
      value,
    }));
  }
  console.log(nameAndMetaList, "n&id");
  const transformedVariation = transformToKeyValue(data.variation);

  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof MiniTempTransferSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(MiniTempTransferSchema),
    defaultValues: {
      metaId: "",
      varientId: data.id!,
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = formMethods;

  // const {
  //   data: branches = [],
  //   isLoading: branchesLoading,
  //   error,
  // } = useQuery({
  //   queryKey: ["branches"],
  //   queryFn: () =>
  //     BasicDataFetch({
  //       method: "GET",
  //       endpoint: `/api/company/branch`,
  //     }),
  //   select: (response) => response?.data as IBranch[],
  //   staleTime: 1000 * 60 * 5,
  // });

  const queryClient = useQueryClient();

  const onSubmit = async (formValues: FormFields) => {
    // return console.log(formValues);
    console.log(formValues);
    try {
      const res = await BasicDataFetch({
        method: "PUT",
        endpoint: "/api/products/temporary?type=min",
        data: formValues,
      });

      //to retriger products page queryfunction to hapen
      await cachedb.productVarient
        .where("id")
        .equals(formValues.varientId)
        .modify({
          metaId: formValues.metaId,
        });

      if (res.data.clearTemp) {
        await cachedb.productMeta
          .where("name")
          .equals("TEMPORARY PRODUCTS")
          .delete();
      }

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      closeRef.current?.click();

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
      cardTitle="Move to Existing"
      className="gap-1"
      cardDescription={`Moving temporary variant ${transformedVariation[0].value} `}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 w-full pt-4 pb-4">
            <div className="flex flex-col mb-2 bg-black/20 text-sm p-2 rounded-sm ">
              <div className="w-full flex gap-1">
                <span className="w-[100px] font-semibold">Varient name</span>
                <span>:</span>
                <span className="flex-1 ml-2">
                  {transformedVariation[0].value}
                </span>
              </div>

              <div className="w-full flex gap-1">
                <span className="w-[100px] font-semibold">Barcode</span>
                <span>:</span>
                <span className="flex-1 ml-2">{data.barcode}</span>
              </div>

              <div className="flex-1">
                {data.prices.map((p, index) => (
                  <div className="flex gap-5" key={index}>
                    <span>
                      <span className="font-semibold">Set</span> : {p.set}
                    </span>
                    <span>
                      <span className="font-semibold">Reg. Price</span> :{" "}
                      {p.reg}
                    </span>
                    <span>
                      {" "}
                      <span className="font-semibold">Sell. Price</span> :{" "}
                      {p.sel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-superbase/90 size-8 flex justify-center items-center rounded-sm text-white overflow-hidden absolute left-1/2 top-1/2 -translate-1/2 ">
                <ArrowLeftRight className="rotate-90 p-[2px]" />
              </div>
              <Input
                value={data.name}
                className="pointer-events-none text-center"
                readOnly
                tabIndex={-1}
              />

              <ComplexComboInput
                selections={nameAndMetaList}
                placeholder="Select Product"
                labelName=""
                fieldName="metaId"
                control={control}
                hasError={!!errors.metaId}
              />
            </div>

            {errors.root && (
              <p className="text-destructive text-sm mt-2">
                {errors.root.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <Button
              type="submit"
              className="flex-1 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoaderBtn loadertext="Moving ..." /> : "Move"}
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

export default FormTempMiniTransfer;
