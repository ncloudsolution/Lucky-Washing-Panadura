import NewInvoice from "@/components/custom/cards/NewInvoice";
import { SkeletonPieChart } from "@/components/custom/charts/ChartPieLabel";
import { TestChart } from "@/components/custom/charts/TestChart";
import FormTemporary from "@/components/custom/forms/FormTemporary";
import InvoiceSkeleton from "@/components/custom/skeleton/InvoiceSkeleton";
import SuperCenterWrapper from "@/components/custom/wrapper/SuperCenterWrapper";

import React from "react";
const data = {
  baseData: {
    id: "cmihbgd7g0006ue2wycwakxky",
    invoiceId: 3,
    createdAt: "2025-11-27T10:54:16.540Z",
    saleValue: "6860",
    deliveryfee: 400,
    paymentMethod: "Bank",
    status: "Returned",
    business: "Jayani Go Mart",
    branch: "Ganemulla",
    address: "Batagama North, Ganemulla",
    hotlines: ["+94760967751"],
    operator: "Vishwa Jayakodi - dev ",
    counterNo: 1,
    customer: "Default",
    customerMobile: "+94777777777",
    customerCreatedAt: "2025-11-10T07:06:30.589Z",
  },
  items: [
    {
      metaId: "cmifyfop8000xue6wd3qyd4tc",
      name: "Hello",
      // name: "සේරා මිරිස් කුඩු",
      metric: "None",
      variations: [
        {
          id: "cmifyfp5u000zue6wo1siu2ea",
          variation: { Name: "50 ග්‍රැම්" },
          regularPrice: 40,
          sellingPrice: 30,
          quantity: 2,
        },
      ],
    },
    {
      metaId: "cmig1v0dv0010ue6wu26lkm0v",
      name: "නිව් අරලිය සුදු සම්බා ",
      metric: "None",
      variations: [
        {
          id: "cmig1v0u90012ue6wvck34f04",
          variation: { Name: "කිලෝ 5" },
          regularPrice: 1300,
          sellingPrice: 1200,
          quantity: 1,
        },
        {
          id: "cmig1z4fk0019ue6w0xn3hojt",
          variation: { Name: "කිලෝ 10" },
          regularPrice: 3000,
          sellingPrice: 2800,
          quantity: 2,
        },
      ],
    },
  ],
};

const Test = () => {
  return <InvoiceSkeleton title="Page Processing..." />;
};

export default Test;
