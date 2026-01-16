import { Prisma } from "@prisma/client";

import { BankDetailsCard } from "@/components/custom/cards/BankDetailsCard";

//change done by sohan
export const devMode = true;
export const BaseUrl = devMode
  ? "http://localhost:3000"
  : "https://lucky-washing-panadura.vercel.app/";

export const globalDefaultCustomer = {
  enable: true,
  name: "Default",
  mobile: "+94777777777",
};

export const defaultPrint = true;
export const productMedia = true;
export const sinhalaBill = false;

export const StaffRolesArray = [
  "System",
  "Uniter",
  "Director",
  "Manager",
  "Cashier",
  "Stockman",
];
export const ENUMStaffRolesArray = [
  "System",
  "Uniter",
  "Director",
  "Manager",
  "Cashier",
  "Stockman",
] as const;
export type TStaffRole = (typeof ENUMStaffRolesArray)[number];

export const orderStatus = [
  "Processing", //Order is being prepared or packed.
  "Shipped", //Order has been dispatched.
  "Delivered", // Customer received the order.
  "Cancelled", //Order cancelled by customer or seller.
  "Returned", //Customer returned the order.
];
export const ENUMOrderStatusArray = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;
export type TOrderStatus = (typeof ENUMOrderStatusArray)[number];

export const PaymentMethod = ["Cash", "Card", "Bank", "Credit"];
export const ENUMPaymentMethodArray = [
  "Cash",
  "Card",
  "Bank",
  "Credit",
] as const;
export type TPaymentMethod = (typeof ENUMPaymentMethodArray)[number];

export const period = ["Monthly", "Yearly"];
export const ENUMPeriodArray = ["Monthly", "Yearly"] as const;
export type TPeriod = (typeof ENUMPeriodArray)[number];

export const paymentStatus = ["Pending", "Approved", "Rejected"];
export const ENUMPaymentStatus = ["Pending", "Approved", "Rejected"] as const;
export type TPaymentStatus = (typeof ENUMPaymentStatus)[number];

export const MetricTypes = [
  "None",
  "kg",
  "L",
  "in",
  "ft",
  "yd",
  "m",
  "ft²",
  "m²",
  "cu",
];
export const ENUMMetricArray = [
  "None",
  "kg",
  "L",
  "in",
  "ft",
  "yd",
  "m",
  "ft²",
  "m²",
  "cu",
] as const;
export type TMetric = (typeof ENUMMetricArray)[number];

export const CONST_paymentObjectList = [
  {
    id: "onepay",
    label: "Onepay",
    value: "onepay",
    primaryImg: "/payments/logo-onepay.png",
    descriptiveImg: "/payments/des-onepay.png",
    description: "Pay by Visa, MasterCard, AMEX or Lanka QR via Onepay.",
    enable: true,
  },

  // {
  //   id: "mintpay",
  //   label: "Mintpay",
  //   value: "mintpay",
  //   primaryImg: "/payments/logo-mintpay.png",
  //   // descriptiveImg: mintpayDes,
  //   description:
  //     "Pay Now for Cashback | Pay Later in 3 Interest-Free Instalments",
  //   enable: true,
  // },

  // {
  //   id: "koko",
  //   label: "Koko",
  //   value: "koko",
  //   primaryImg: "/payments/logo-koko.png",
  //   description: "Pay in 3 interest free installments with Koko.",
  //   enable: true,
  // },

  {
    id: "payhere",
    label: "Payhere",
    value: "payhere",
    primaryImg: "/payments/logo-payhere.png",
    descriptiveImg: "/payments/des-payhere-blue.png",
    enable: true,
  },
  // {
  //   id: "webxpay",
  //   label: "Webxpay",
  //   value: "webxpay",
  //   primaryImg: "/payments/logo-webxpay.png",
  //   descriptiveImg: "/payments/des-webxpay.png",
  //   enable: true,
  // },
  // {
  //   id: "payzy",
  //   label: "Payzy",
  //   value: "payzy",
  //   primaryImg: "/payments/logo-payzy.png",
  //   description: "Pay in up to 4 interest-free installments with Payzy.",
  //   enable: true,
  // },

  // {
  //   id: "cashOnDelivery",
  //   label: "Cash on Delivery",
  //   value: "cashOnDelivery",
  //   primaryImg: "/payments/logo-cashondelivery.png",
  //   description: "Pay with cash upon delivery.",
  //   // descriptiveImg: payhereDesBlue,
  //   enable: true,
  // },
  {
    id: "bankTransfer",
    label: "Bank Transfer",
    value: "bankTransfer",
    primaryImg: "/payments/logo-bank.png",
    enable: true,
    components: BankDetailsCard,
  },
] as const;

export const paymentObjectList = [...CONST_paymentObjectList];

// m² (Square Meter)
// ft² (Square Foot)

// export const CategoryArray = [
//   { id: "1", name: "Bread & Loaves" },
//   { id: "2", name: "Buns & Rolls" },
//   { id: "3", name: "Cakes (Whole)" },
//   { id: "4", name: "Cake Pieces & Slices" },
//   { id: "5", name: "Pastries" },
//   { id: "6", name: "Short Eats" }, // patties, rolls, cutlets
//   { id: "7", name: "Sweet Items" }, // donuts, eclairs, cream buns
//   { id: "8", name: "Traditional Sri Lankan Sweets" }, // kavum, kokis, aluwa
//   { id: "9", name: "Biscuits & Cookies" },
//   { id: "10", name: "Desserts & Puddings" },
//   { id: "11", name: "Savory Items" }, // pies, quiche
//   { id: "12", name: "Birthday & Custom Cakes" },
//   { id: "13", name: "Bakery Combos & Packs" },
//   { id: "14", name: "Beverages" }, // tea, coffee, soft drinks
//   { id: "15", name: "Frozen & Ready-to-Bake Items" },
//   { id: "16", name: "Seasonal & Festival Items" }, // Avurudu, Christmas
//   { id: "17", name: "Wholesale Bakery Items" },
// ];

export const SoftwareOwner = {
  businessName: "nCloud solutions",
  websitite: "ncloud.lk",
  bankDetails: {
    payeeName: "nCloud Solutions",
    AccountNo: "105714024741",
    Bank: "Sampath Bank",
    Branch: "Horana",
  },
};

export const productData = {
  name: "UPOS",
  contact: {
    mobile: [""],
    email: "",
    web: "https://www.upos.lk",
    facebook: "",
    whatsapp: "",
    address: "Horana, Padukka, Sri Lanka",
  },
  logo: "https://drive.google.com/uc?export=view&id=1BmlAdw1QLbvO6sHd4ExX8l0XFApWaVtr",
};

// category.config.ts
export const CATEGORY_CONFIG = {
  income: {
    field: "incomeCategories",
    inUseCheck: async (category: string, prisma: any) =>
      prisma.income.findFirst({
        where: { category },
        select: { id: true },
      }),
  },
  expense: {
    field: "expenseCategories",
    inUseCheck: async (category: string, prisma: any) =>
      prisma.income.findFirst({
        where: { category },
        select: { id: true },
      }),
  },
  product: {
    field: "categories",
    inUseCheck: async (category: string, prisma: any) =>
      prisma.productMeta.findFirst({
        where: {
          categories: { has: category },
        },
        select: { id: true },
      }),
  },
} as const;

export type CategoryType = keyof typeof CATEGORY_CONFIG;

export interface IStaff {
  id?: string;
  name: string;
  branch: string;
  role: string;
  email: string;
  mobile: string;
  pin: string;
  createdAt: string | Date;
  counterNo?: number | null;
}

export interface IProductMeta {
  id?: string;
  searchQuery: string;
  metric: TMetric;
  name: string;
  categories: string[];
  brand?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  images?: string[] | null;
  tags?: string[] | null;
}

export interface IPriceVarient {
  set: number;
  reg: number;
  sel: number;
}

export interface IProductVarient {
  id?: string;
  metaId: string;
  barcode?: string | null;
  variation?: any | null; // Json type
  prices: IPriceVarient[]; // Json type
  createdAt: string | Date;
}

//dif in cache
// export interface IProductStock {
//   id: string;
//   in: boolean;
//   varientId: string;
//   branch: string;
//   operator: string;
//   quantity: Prisma.Decimal;
//   unitPrice?: number;
//   discount?: number;
//   supplier?: string;
//   remarks?: string;
//   createdAt: Date;
// }

// export interface IStockValueEntry {
//   entries: IProductStock[];
//   stockInCount: number;
//   stockOutCount: number;
//   soldCount: number | Prisma.Decimal;
// }

export interface ICustomerMeta {
  id?: string;
  mobile: string;
  name: string;
  createdAt: string | Date;
}

export interface ICustomerResidential {
  id?: string;
  customerId: string;
  email: string;
  billingAddress: string;
  city: string;
  postalCode: string;
}

export interface IOrderMeta {
  id?: string;
  invoiceId: number;
  customerId: string;
  status: string;
  branch: string;
  saleValue: Prisma.Decimal; // Decimal
  deliveryfee?: Prisma.Decimal | null; // Decimal
  createdAt: string | Date;
  shippingAddress?: string | null;
  additionalMobile?: string | null;
  customerIp?: string | null;
  operator: string;
  paymentAmount: number;
}

export interface IOrderItem {
  id?: string;
  orderId: string;
  unitPrice: Prisma.Decimal; // Decimal
  quantity: Prisma.Decimal;
  productVarientId: string;
}

export interface IBranchMeta {
  id?: string;
  hotlines: string[];
  address: string;
  createdAt: string | Date;
  branch: string;
}

export interface IBusinessMeta {
  id?: string;
  businessName: string;
  plan: string;
  planCycle: TPeriod;
  businessLogo: string;
  ownerName: string;
  ownerMobileNos: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  categories: string[];
  createdAt: string | Date;
  sms: boolean;
}

export interface IPlan {
  id: string;
  name: string;
  monthlyPrice: Prisma.Decimal;
  yearlyDiscountPercentage: Prisma.Decimal;
}

export interface IClient {
  id?: string;
  lastProductFetch: number;
  lastOrderId?: string;
  editMode: boolean;
  edCustomerMobile: string | null;
  edCustomerPaymentMethod: TPaymentMethod;
  edDeliveryfee: number | null;
  edPaymentPortion: string;
  edPaymentPortionAmount: number | null;
  nextInvoiceIdSuffix: string;
}

interface ICartVariation {
  variationName: string;
  productVarientId: string;
  priceVariation: IPriceVarient[]; // you can refine if you know exact structure
  quantity: number;
  unitPrice: number;
}

export interface ICartItem extends ICartVariation {
  id?: number;
  name: string;
  image: string | null;
  metric: TMetric;
}
//only need 2 feilds for orderItem Table (id,orderId)

export interface IHoldedCartItem extends ICartItem {
  customerMobile: string;
  cartId: number;
  time: string;
}

export interface IGroupedCart {
  name: string;
  img: string | null;
  metric: TMetric;
  variations: ICartVariation[];
}

export interface ICurrentCustomer {
  id?: number;
  name: string;
  mobile: string;
}

export type BreakdownItem = {
  type: string;
  count: number;
  saleValue: number;
};

export type BranchSummary = {
  branch: string;
  totalCount: number;
  totalSaleValue: number;
  // breakdown: BreakdownItem[];
};

export interface IAnalytics {
  orders: BranchSummary[];
  products: {
    branch: string;
    items: { productVarientId: string; count: number }[]; // count or quantity as number
  }[];
  // stocks: {
  //   stockInValue: number;
  //   stockOutValue: number;
  // };
  incomes: {
    branch: string; // ! tells TS this is definitely not null
    breakdown: { type: TPaymentMethod; count: number; amount: number }[];
  }[];
  expenses: {
    branch: string; // ! tells TS this is definitely not null
    breakdown: { type: TPaymentMethod; count: number; amount: number }[];
  }[];
}

export interface IPieChartData {
  label: string;
  value: number;
  fill: string;
}

export interface IDue {
  plan: string;
  planCycle: string;
  dueAmount: number;
  dueCycles: number;
  lastPaymentDate: Date;
  lastPaymentStatus: TPaymentStatus;
  paidThroughDate: Date;
  nextDueDate: Date;
}

export interface IPlan {
  name: string;
  id: string;
  monthlyPrice: Prisma.Decimal;
  yearlyDiscountPercentage: Prisma.Decimal;
}
