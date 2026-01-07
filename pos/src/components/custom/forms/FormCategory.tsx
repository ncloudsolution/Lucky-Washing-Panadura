"use client";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";

import { BasicDataFetch, capitalizeFirstLetter } from "@/utils/common";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";

import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import MultiInput from "../inputs/MultiInput";
import { Plus } from "lucide-react";
import { CategorySchema } from "@/utils/validations/company";
import { cachedb } from "@/data/dbcache";
import { CategoryType } from "@/data";

const FormCategory = ({ type }: { type: CategoryType }) => {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  type FormFields = z.infer<typeof CategorySchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      categories: [{ value: "" }],
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

  const queryClient = useQueryClient();

  const onSubmit = async (data: FormFields) => {
    const start = performance.now();

    try {
      const res = await BasicDataFetch({
        // Added await here
        method: "POST",
        endpoint: `/api/company/categories/${type}`,
        data: data,
      });

      closeRef.current?.click();
      const end = performance.now();
      const responseTimeMs = end - start;

      // 1️⃣ Get existing meta
      const meta = await cachedb.businessMeta.toCollection().first();

      switch (type) {
        case "product": {
          if (meta) {
            // Remove "All" and "Temporary" from existing cache
            const existingCategories = meta.categories.filter(
              (c) => c !== "All" && c !== "Temporary"
            );

            // Get new categories from form, reverse so last entered comes first
            const newCategories = data.categories
              .map((c) => c.value)
              .filter(Boolean) // ignore empty
              .reverse();

            // Merge new categories at the front of existing ones, remove duplicates
            const mergedCategories = [
              ...newCategories,
              ...existingCategories.filter((c) => !newCategories.includes(c)),
            ];

            // Final order: All -> merged -> Temporary
            const updatedCategories = ["All", ...mergedCategories, "Temporary"];

            await cachedb.businessMeta.put({
              ...meta,
              categories: updatedCategories,
            });
          }

          await queryClient.invalidateQueries({
            queryKey: ["categories"],
          });
          return toast.success(
            `${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`
          );
        }
        case "income": {
          if (meta) {
            // Remove "All" and "Temporary" from existing cache
            const existingCategories = meta.incomeCategories.filter(
              (c) =>
                c !== "Full Payment" &&
                c !== "Advance Payment" &&
                c !== "Partial Payment" &&
                c !== "Balance Payment"
            );

            // Get new categories from form, reverse so last entered comes first
            const newCategories = data.categories
              .map((c) => c.value)
              .filter(Boolean) // ignore empty
              .reverse();

            // Merge new categories at the front of existing ones, remove duplicates
            const mergedCategories = [
              ...newCategories,
              ...existingCategories.filter((c) => !newCategories.includes(c)),
            ];

            // Final order: All -> merged -> Temporary
            const updatedCategories = [
              ...mergedCategories,
              "Full Payment",
              "Advance Payment",
              "Partial Payment",
              "Balance Payment",
            ];

            await cachedb.businessMeta.put({
              ...meta,
              incomeCategories: updatedCategories,
            });
          }

          await queryClient.invalidateQueries({
            queryKey: ["income-categories"],
          });

          return toast.success(
            `${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`
          );
        }
        case "expense": {
          if (meta) {
            // Remove "All" and "Temporary" from existing cache
            const existingCategories = meta.expenseCategories;

            // Get new categories from form, reverse so last entered comes first
            const newCategories = data.categories
              .map((c) => c.value)
              .filter(Boolean) // ignore empty
              .reverse();

            // Merge new categories at the front of existing ones, remove duplicates
            const mergedCategories = [
              ...newCategories,
              ...existingCategories.filter((c) => !newCategories.includes(c)),
            ];

            await cachedb.businessMeta.put({
              ...meta,
              expenseCategories: mergedCategories,
            });
          }

          await queryClient.invalidateQueries({
            queryKey: ["expense-categories"],
          });
          // res already contains parsed JSON from BasicDataFetch
          return toast.success(
            `${res.message} in ${(responseTimeMs / 1000).toFixed(2)}s`
          );
        }
      }

      //update dexie
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "categories",
  });

  const handleAddHotline = async () => {
    const valid = await trigger("categories");
    if (valid) {
      append({ value: "" });
    }
  };

  return (
    <FormWrapper
      variant="dialog"
      cardTitle={`${capitalizeFirstLetter(type)} Categories`}
      className={`gap-1 relative`}
      cardDescription={`Add New ${capitalizeFirstLetter(type)} Category`}
      width="xxs:w-[350px] w-full"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <>
            <MultiInput
              fieldName="categories"
              labelName="Categories"
              fields={fields}
              control={control}
              removeField={remove}
              type="text"
              placeholder=""
            />
            <Button
              type="button"
              onClick={handleAddHotline}
              className="mt-5 w-full border border-primary bg-transparent text-primary hover:bg-transparent"
            >
              <Plus size={18} /> Add More Categories
            </Button>
          </>
          <div className="flex pt-4 pb-2 w-full">
            <Button
              type="submit"
              className="flex-1 bg-superbase/80 text-white hover:bg-superbase w-full focus:bg-superbase shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderBtn loadertext="Inserting ..." />
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

export default FormCategory;
