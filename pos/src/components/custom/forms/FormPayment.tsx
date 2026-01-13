"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";

import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

import { usePaymentGatewayContext } from "@/context/PaymentContext";

import CustomAssetFile from "../inputs/CustomAssetFile";
import PaymentDailogBox from "../dialogs/PaymentDailogBox";
import FormWrapper from "../wrapper/FormWrapper";
import { LoaderBtn } from "../buttons/LoaderBtn";
import { AdvancedRadioInput } from "../inputs/AdvancedRadioInput";
import { handlePayHerePayment } from "@/utils/payments/payhereTrigger";
import { handleOnePayPayment } from "@/utils/payments/onepayTrigger";
import { paymentObjectList } from "@/data";
import { PaymentSchema, TCurrency } from "@/utils/validations/payment";

const FormPayment = ({
  amount,
  currency,
}: {
  amount: number;
  currency: TCurrency;
}) => {
  const router = useRouter();
  const { data, setData } = usePaymentGatewayContext();

  type FormFields = z.infer<typeof PaymentSchema>;

  const formMethods = useForm<FormFields>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      amount: amount,
      currency: currency,
      gateway: "onepay",
      paymentRecipt: undefined,
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
  } = formMethods;

  // Watch gateway changes
  const selectedGateway = watch("gateway");

  //manual feild management for image feild
  // useEffect(() => {
  //   if (selectedGateway !== "bankTransfer") {
  //     setValue("paymentRecipt", undefined);
  //
  //   }
  // }, [selectedGateway, setValue]);

  const onSubmit = async (data: FormFields) => {
    if (data.gateway === "payhere")
      return handlePayHerePayment({
        order_id: "ItemNo12345",
        amount: amount.toFixed(2),
        currency: "LKR",
      });

    if (data.gateway === "onepay") {
      // Await the async function to get the result
      const { gatewayUrl } = await handleOnePayPayment({
        orderReference: "ItemNo12345",
        amount: amount.toFixed(2),
        currency: "LKR",
      });

      // Set the data once the payment URL is available
      return setData({ gatewayUrl: gatewayUrl });
    }

    // await regularFormSubmisssion({
    //   apiPath: "api/..",
    //   data: data,
    //   extraFunction: (extraPayload) => {
    //     if (extraPayload?.redirectUrl) {
    //       router.push(extraPayload.redirectUrl); // ✅ Redirecting to the provided URL
    //     }
    //   },
    // });
  };

  return (
    <FormWrapper
      // cardTitle="Payments"
      variant="dialog"
      cardTitle={`LKR ${amount.toFixed(2)}`}
      cardDescription="proceed your payment"
    >
      <Form {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 mt-5">
            {/**pricing area**/}
            {/* <div className="flex justify-between text-[20px] mt-5">
              <div>Total</div>
              {`LKR ${amount.toFixed(2)}`}
            </div> */}

            <AdvancedRadioInput
              control={control}
              labelName="Payment Type"
              fieldName="gateway"
              radioList={paymentObjectList.filter((ob) => ob.enable)}
              seperator={true}
              // initialSelected={formMethods.getValues("gateway")}
            />

            {selectedGateway === "bankTransfer" && (
              <CustomAssetFile
                control={control}
                height="h-[100px]"
                fieldName="paymentRecipt"
                labelName="Payment Recipt"
                filetype=".pdf,.jpg,.jpeg,.png,.webp"
              />
            )}
          </div>

          <Button
            type="submit"
            className="w-full text-white mt-5"
            disabled={isSubmitting}
          >
            <div id="onepay-btn">
              {isSubmitting ? (
                <LoaderBtn loadertext="Processing ..." />
              ) : (
                "Pay Now"
              )}
            </div>
          </Button>
        </form>
      </Form>

      {data.gatewayUrl && <PaymentDailogBox gatwayLink={data.gatewayUrl} />}
    </FormWrapper>
  );
};

export default FormPayment;
