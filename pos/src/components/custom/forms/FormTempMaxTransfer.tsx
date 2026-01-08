"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FieldPath, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { StepLine } from "./StepLine";
import SingleImageInput from "../inputs/SingleImageInput";
import { Plus } from "lucide-react";
import ComplexPriceInput from "../inputs/ComplexPriceInput";
import { ToggleInput } from "../inputs/ToogleInput";
import ComplexVariations from "../inputs/ComplexVariations";
import { HorizontalMultiSelectInput } from "../inputs/HorizontalMultiSelectInput";
import { MetricTypes, productMedia, TMetric } from "@/data";
import { ProductCoreSchema } from "@/utils/validations/product";
import { BasicDataFetch, CategoryWrapper } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  cachedb,
  ensureClientInit,
  getBusinessMeta,
  saveCategory,
  saveOneProductWithVariants,
} from "@/data/dbcache";
import { singleImageSubmission, deleteSingleImage } from "@/firebase/helpers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ICacheProduct } from "@/app/(screens)/core/pos/page";
import { singlishToUnicode } from "sinhala-unicode-coverter";
import SelectInput from "../inputs/SelectInput";
import { IProductVariant } from "./FormProductPrice";

// export interface IProductCore {
//   complex: boolean;
//   barcode?: string;
//   searchQuery: string;
//   metric: TMetric;
//   name: string;
//   brand?: string;
//   description?: string;
//   shortDescription?: string;
//   categories: { value: string }[];
//   images?: string;
//   tags?: { value: string }[];
//   prices: { set: number; reg: number; sel: number }[];
//   variation: { key: string; value: string }[];
// }

const FormTempMaxTransfer = ({ data }: { data: IProductVariant }) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof ProductCoreSchema>;

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

  const transformedVariation = transformToKeyValue(data.variation);

  const { data: CategoryArray = [], isLoading: isLoadingCatagoryArray } =
    useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        await ensureClientInit();

        // 1️⃣ Try cache
        const meta = await getBusinessMeta();
        if (meta?.categories?.length) {
          return meta.categories;
        }

        // 2️⃣ Fetch API
        const response = await BasicDataFetch({
          method: "GET",
          endpoint: "/api/company/categories",
        });

        const apiCategories: string[] = response.data ?? [];

        // 3️⃣ Save ordered categories to cache
        await saveCategory(apiCategories, "product");

        return ["All", ...apiCategories, "Temporary"];
      },
      staleTime: 1000 * 60 * 5,
    });

  /* ---------------- Category Objects ---------------- */
  const FinalCategoryItems = useMemo(() => {
    return CategoryArray.map((name, index) => ({
      id: index === 0 ? "0" : name.toLowerCase().replace(/\s+/g, "-"),
      name,
    }));
  }, [CategoryArray]);

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(ProductCoreSchema),
    defaultValues: {
      id: data.id!,
      sinhalaMode: true,
      complex: true,
      barcode: data.barcode ?? "",
      searchQuery: "",
      metric: "None",
      name: "",
      brand: "",
      description: "",
      shortDescription: "",
      categories: [],
      images: undefined,
      tags: [], //[{ value: "" }]
      prices: data.prices,
      variation: transformedVariation, //[{ key: "", value: "" }]
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = formMethods;

  // console.log("Form Errors:", errors);

  const complexProduct = watch("complex");
  const sinhalaModeValue = watch("sinhalaMode");

  const searchQueryValue = watch("searchQuery");

  useEffect(() => {
    if (searchQueryValue) {
      setValue("name", singlishToUnicode(searchQueryValue), {
        shouldValidate: true,
      });
    } else {
      setValue("name", "");
    }
  }, [searchQueryValue, setValue]);

  useEffect(() => {
    if (!sinhalaModeValue) {
      setValue("searchQuery", "");
      setValue("name", "");
    }
  }, [sinhalaModeValue, setValue]);

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

  const onSubmit = async (data: FormFields) => {
    const start = performance.now();
    let uploadedImageUrl: string | undefined;
    let modifiedData = {
      ...data, //varient id on it
      searchQuery: sinhalaModeValue ? data.searchQuery : null,
    };

    try {
      if (data.images) {
        uploadedImageUrl = await singleImageSubmission(
          data.images as File,
          "products"
        );

        modifiedData = { ...data, images: uploadedImageUrl };
        console.log("chek im------------------------------------");
      }

      console.log(uploadedImageUrl, "Up");

      const res = await BasicDataFetch({
        // Added await here
        method: "PUT",
        endpoint: "/api/products/temporary?type=max",
        data: modifiedData,
      });

      const { id, ...rest } = res.data.createdVarient;

      await Promise.all([
        cachedb.productMeta.put(res.data.createdProductMeta),
        cachedb.productVarient.put({ id: data.id, ...rest }),
      ]);

      if (res.data.clearTemp) {
        await cachedb.productMeta
          .where("name")
          .equals("TEMPORARY PRODUCTS")
          .delete();
      }

      await queryClient.invalidateQueries({ queryKey: ["products"] });

      closeRef.current?.click();
      const end = performance.now();
      const responseTimeMs = end - start;

      // res already contains parsed JSON from BasicDataFetch
      toast.success(`${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`);
    } catch (err) {
      if (uploadedImageUrl) {
        await deleteSingleImage(uploadedImageUrl);
      }
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };
  const StepObject = [
    {
      id: 1,
      title: "Basic",
      fields: [
        "barcode",
        "name",
        "brand",
        "categories",
        "searchQuery",
        "complex",
        "sinhalaMode",
      ] as FieldPath<FormFields>[],
    },
    ...(productMedia
      ? [
          {
            id: 2,
            title: "Graphics",
            fields: ["images"] as FieldPath<FormFields>[],
          },
        ]
      : []),
    ...(complexProduct
      ? [
          {
            id: 3,
            title: "Variations",
            fields: ["variation"] as FieldPath<FormFields>[],
          },
        ]
      : []),
    {
      id: 4,
      title: "Metric & Price",
      fields: ["metric", "prices"] as FieldPath<FormFields>[],
    },
  ];

  const [step, setStep] = useState(1);
  console.log(step);

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const fields = StepObject[step - 1].fields;

    const isStepValid = await trigger(fields);

    if (!isStepValid) return;

    if (step < StepObject.length) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  // const {
  //   fields: tagFields,
  //   append: tagAppend,
  //   remove: tagRemove,
  // } = useFieldArray({
  //   control,
  //   name: "tags",
  // });

  const {
    fields: categoriesFields,
    append: appendCategories,
    remove: removeCategories,
  } = useFieldArray({
    control,
    name: "categories",
  });

  const {
    fields: priceFields,
    append: appendPrice,
    remove: removePrice,
  } = useFieldArray({
    control,
    name: "prices",
  });

  const handleAddPrices = async () => {
    const valid = await trigger("prices");
    if (valid) {
      appendPrice({ set: priceFields.length + 1, reg: 0, sel: 0 });
    }
  };

  const {
    fields: variationFields,
    append: appendVariation,
    remove: removeVariation,
  } = useFieldArray({
    control,
    name: "variation",
  });

  return (
    <FormWrapper
      variant="dialog"
      cardTitle="Move With Creating New"
      className="gap-1"
      cardDescription={`Moving temporary variant ${transformedVariation[0].value} `}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <StepLine step={step} setStep={setStep} stepObject={StepObject} />
          <div className="flex flex-col gap-2 w-full pt-4 pb-4">
            {step === 1 && (
              <>
                {/* <TextInput
                  placeholder="05"
                  labelName="Barcode Optional"
                  fieldName="barcode"
                  specialTag="Optional"
                  control={control}
                  hasError={!!errors.barcode}
                  disabled
                /> */}
                <div className="flex flex-col bg-black/20 text-sm p-2 rounded-sm ">
                  <div className="w-full flex gap-1">
                    <span className="font-semibold">Barcode</span>
                    <span>:</span>
                    <span className="flex-1 ml-2">{data.barcode}</span>
                  </div>
                </div>

                {sinhalaModeValue && (
                  <TextInput
                    placeholder="simenthi"
                    labelName="Search Query - Singlish"
                    fieldName="searchQuery"
                    control={control}
                    hasError={!!errors.searchQuery}
                  />
                )}

                <div className="relative">
                  <TextInput
                    pointerNone={sinhalaModeValue}
                    placeholder={
                      sinhalaModeValue
                        ? singlishToUnicode("simenthi")
                        : "Cement"
                    }
                    labelName="Display Name"
                    fieldName="name"
                    control={control}
                    hasError={!!errors.name}
                  />
                  <div className="absolute right-0 top-0">
                    <ToggleInput
                      name="sinhalaMode"
                      labelName="Sinhala Mode"
                      control={control}
                    />
                  </div>
                </div>

                <TextInput
                  placeholder="Ultratech"
                  labelName="Brand Optional"
                  fieldName="brand"
                  specialTag="Optional"
                  control={control}
                  hasError={!!errors.brand}
                />

                <HorizontalMultiSelectInput
                  control={control}
                  fieldName="categories"
                  labelName="Categories"
                  selections={CategoryWrapper(FinalCategoryItems)}
                  placeholder="Select Categories"
                  appendCategory={(cat: string) =>
                    appendCategories({ value: cat })
                  }
                  removeCategory={(index) => removeCategories(index)}
                  hasError={!!errors.categories}
                />
              </>
            )}

            {productMedia && step === 2 && (
              <SingleImageInput
                control={control}
                fieldName="images"
                labelName="Product or Brand Image Optional"
                hasError={!!errors.images}
                specialTag="Optional"
              />
            )}

            {!productMedia && complexProduct && step === 2 && (
              <>
                <ComplexVariations
                  control={control}
                  fields={variationFields}
                  removeField={removeVariation}
                  errors={errors.variation}
                  sinhalaMode={sinhalaModeValue}
                />
                {/* <Button
                  type="button"
                  onClick={handleAddVariation}
                  className={`mt-2 w-full  border-1 border-primary bg-transparent text-primary hover:bg-transparent`}
                >
                  <Plus size={18} /> Add More
                </Button> */}
              </>
            )}

            {step === StepObject.length && (
              <>
                <SelectInput
                  control={control}
                  fieldName="metric"
                  labelName="Metric"
                  selections={MetricTypes}
                  labelList={[
                    "",
                    "Kilogram",
                    "Liter",
                    "Inch",
                    "Foot",
                    "Yard",
                    "Meter",
                    "Square Foot",
                    "Square Meter",
                    "Cube",
                  ]}
                />

                <ComplexPriceInput
                  fields={priceFields}
                  removeField={removePrice}
                  control={control}
                  errors={errors.prices}
                />

                <Button
                  type="button"
                  onClick={handleAddPrices}
                  className={`mt-2 w-full  border-1 border-primary bg-transparent text-primary hover:bg-transparent`}
                >
                  <Plus size={18} /> Add More
                </Button>
              </>
            )}

            {/**hidden from initial upload**/}
            {/* {step === 2 && (
              <>
                <TextInput
                  type="texteditor"
                  placeholder=""
                  labelName="Description Optional"
                  specialTag="Optional"
                  fieldName="description"
                  control={control}
                />
                <TextInput
                  type="texteditor"
                  placeholder=""
                  labelName="Short Description Optional"
                  specialTag="Optional"
                  fieldName="shortDescription"
                  control={control}
                />
              </>
            )} */}
          </div>

          <div className="flex gap-3 w-full">
            <Button
              className="flex-1"
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
            >
              Back
            </Button>
            {step === StepObject.length ? (
              <Button
                type="submit"
                className="flex-1 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? <LoaderBtn loadertext="Moving ..." /> : "Move"}
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 text-white"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
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

export default FormTempMaxTransfer;
