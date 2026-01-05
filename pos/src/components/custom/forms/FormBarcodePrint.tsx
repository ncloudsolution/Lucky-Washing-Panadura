"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/custom/inputs/TextInput";
import FormWrapper from "@/components/custom/wrapper/FormWrapper";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { Printer } from "lucide-react";
import { MonoBarcodeSchema } from "@/utils/validations/product";
import { getCacheProductMetaOnlyByBarcode } from "@/data/dbcache";
import Barcode from "react-barcode";
import { useDebounce } from "@/hooks/useDebounce";
import { CustomDialog } from "../dialogs/CustomDialog";
import { useReactToPrint } from "react-to-print";

const FormBarcodePrint = () => {
  const dialogTriggerRef = React.useRef<HTMLDivElement | null>(null);
  const [dialogMessage, setDialogMessage] = useState("");
  type FormFields = z.infer<typeof MonoBarcodeSchema>;

  const printRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "New Invoice",
  });

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(MonoBarcodeSchema),
    defaultValues: {
      barcode: "",
      quantity: 1,
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = formMethods;

  const barcode = watch("barcode");
  const qty = watch("quantity");
  const debouncedQuery = useDebounce(barcode);

  const onSubmit = async (formValues: FormFields) => {
    //look cache and id have
    const productMeta = await getCacheProductMetaOnlyByBarcode(
      formValues.barcode
    );
    if (productMeta) {
      setDialogMessage(productMeta.name);
      return dialogTriggerRef.current?.click();
    }

    handlePrint();
  };

  return (
    <FormWrapper variant="headless" className="gap-1 bg-transparent" width="">
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* <div className="text-3xl font-semibold text-center w-full mb-2">
            Mono Type Barcode
          </div> */}
          <div className="w-full flex justify-center">
            <div ref={printRef}>
              <Barcode
                value={debouncedQuery || "barcode-1234"}
                className="w-full"
                background="transparent"
                lineColor={debouncedQuery ? "ffffff" : "#b8bbbf"}
                marginTop={20}
                marginBottom={20}
                height={65} // fixed height
                width={2} // sets bar width → keeps height visually stable
              />

              <div className="hidden print:flex print:flex-col">
                {Array.from({ length: Number(qty) - 1 }).map((_, idx) => (
                  <Barcode
                    key={idx}
                    value={debouncedQuery || "barcode-1234"}
                    className="w-full mb-4"
                    background="transparent"
                    lineColor={debouncedQuery ? "ffffff" : "#b8bbbf"}
                    height={65}
                    width={2}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full -mt-2 pb-4">
            <TextInput
              control={control}
              fieldName="barcode"
              labelName="Barcode Text"
              placeholder="barcode-1234"
              hasError={!!errors.barcode}
            />
            <TextInput
              type="number"
              control={control}
              fieldName="quantity"
              labelName="Barcode Quantity"
              placeholder="1"
              hasError={!!errors.quantity}
            />
            {/* <div className="absolute right-0 top-0">
                <ToggleInput
                  name="unique"
                  labelName="Unique"
                  control={control}
                />
              </div> */}

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
              {isSubmitting ? (
                <LoaderBtn loadertext="Checking ..." />
              ) : (
                <>
                  <Printer /> Print
                </>
              )}
            </Button>
          </div>
        </form>

        {/*3 - ✅ Hidden close button */}
        {/* <DialogClose asChild>
          <button type="button" className="hidden" ref={closeRef}></button>
        </DialogClose> */}
        {/* <DevTool control={control} /> */}
      </Form>

      <CustomDialog
        title="Are you absolutey sure?"
        description={"This barcode already exists in the system under product"}
        specialText={dialogMessage}
        loading={false}
        finalFireBtn={
          <Button variant={"destructive"} onClick={handlePrint}>
            <Printer /> It &apos; s okay i want to Print
          </Button>
        }
        triggerBtn={
          <div ref={dialogTriggerRef} className="hidden">
            trig
          </div>
        }
      />
    </FormWrapper>
  );
};

export default FormBarcodePrint;
