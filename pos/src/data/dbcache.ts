import { IProductCore } from "@/components/custom/forms/FormCoreProduct";
import { ISelectedVariation } from "@/components/custom/forms/FormProductOrder";
import {
  CategoryType,
  globalDefaultCustomer,
  IBranchMeta,
  IBusinessMeta,
  ICartItem,
  IClient,
  ICurrentCustomer,
  ICustomerMeta,
  ICustomerResidential,
  IGroupedCart,
  IHoldedCartItem,
  IOrderItem,
  IOrderMeta,
  IPriceVarient,
  IProductMeta,
  IProductVarient,
  IQueue,
  IStaff,
} from "@/data";
import { BasicDataFetch, focusBarcode, getVariationName } from "@/utils/common";

import { Dexie, Table } from "dexie";
import React from "react";
import { toast } from "sonner";
export const cachedb = new Dexie("cachedb");

declare module "dexie" {
  interface Dexie {
    staff: Table<IStaff, string>;
    productMeta: Table<IProductMeta, string>;
    productVarient: Table<IProductVarient, string>;
    customerMeta: Table<ICustomerMeta, string>;
    customerResidential: Table<ICustomerResidential, string>;
    orderMeta: Table<IOrderMeta, string>;
    orderItem: Table<IOrderItem, string>;
    branchMeta: Table<IBranchMeta, string>;
    businessMeta: Table<IBusinessMeta, string>;
    client: Table<IClient, string>;
    cartItem: Table<ICartItem, number>;
    holdedCartItem: Table<IHoldedCartItem, number>;
    currentCustomer: Table<ICurrentCustomer, number>;
    queue: Table<IQueue, string>;
  }
}

cachedb
  .version(2)
  .stores({
    staff: "id,name,branch,role,email,mobile,pin,createdAt,counterNo,order",
    productMeta:
      "id,searchQuery,metric,name,categories,brand,description,shortDescription,images,tags",
    productVarient: "id,metaId,barcode,variation,prices,createdAt",
    customerMeta: "id,mobile,name,createdAt",
    customerResidential: "id,customerId,email,billingAddress,city,postalCode",
    orderMeta:
      "id,invoiceId,customerId,status,branch,saleValue,deliveryfee,createdAt,shippingAddress,additionalMobile,customerIp,operator",
    orderItem: "id,orderId,unitPrice,quantity,productVarientId",
    branchMeta: "id,hotlines,address,createdAt,branch",
    businessMeta:
      "id,businessName,businessLogo,ownerName,ownerMobileNos,categories,sms",
    client:
      "id,lastProductFetch,lastOrderId,editMode,edCustomerMobile,edCustomerPaymentMethod,edDeliveryfee,edPaymentPortion,nextInvoiceIdSuffix",
    cartItem:
      "++id,name,variationName,priceVariation,image,productVarientId,unitPrice,quantity",
    holdedCartItem:
      "++id,customerMobile,time,cartId,name,variationName,priceVariation,image,productVarientId,unitPrice,quantity",
    currentCustomer: "id,name,mobile",
    queue: "id,payload,edit,createdAt",
  })
  .upgrade(async (tx) => {
    const tablesToClear = [
      "staff",
      "productMeta",
      "productVarient",
      "productStock",
      "customerMeta",
      "customerResidential",
      "orderMeta",
      "orderItem",
      "branchMeta",
      "businessMeta",
      "client",
      "cartItem",
      "holdedCartItem",
      "currentCustomer",
      "queue",
    ];

    for (const tableName of tablesToClear) {
      await tx.table(tableName).clear();
    }
  });

//centralize client pk
export const clientPrimaryKey = "pk-xxx";

export async function ensureClientInit() {
  const exists = await cachedb.client.get(clientPrimaryKey);
  if (!exists) {
    await cachedb.client.add({
      id: clientPrimaryKey,
      lastProductFetch: 0,
      lastOrderId: undefined,
      editMode: false,
      edCustomerMobile: globalDefaultCustomer.enable
        ? globalDefaultCustomer.mobile
        : null,
      edCustomerPaymentMethod: "Cash",
      edDeliveryfee: null, //new Prisma.Decimal(50),
      edPaymentPortion: "Full Payment",
      edPaymentPortionAmount: null,
      nextInvoiceIdSuffix: "notset",
    });
  }
}

export async function ensureBusinessInit(): Promise<IBusinessMeta> {
  const exists = await getBusinessMeta();

  if (exists) return exists;

  const response = await BasicDataFetch({
    method: "GET",
    endpoint: "/api/company/meta",
  });

  // Upsert / overwrite cachedb
  await cachedb.businessMeta.put(response.data);

  // Fetch again, guaranteed to exist
  const fresh = await getBusinessMeta();
  if (!fresh) throw new Error("Failed to fetch business meta after init");

  return fresh;
}

export async function getBusinessMeta(): Promise<IBusinessMeta | undefined> {
  return cachedb.businessMeta.toCollection().first();
}

export async function ensureBranchesInit() {
  const exists = await getBranchesMeta();

  // Only return if data exists
  if (exists.length > 0) return exists;

  const response = await BasicDataFetch({
    method: "GET",
    endpoint: "/api/company/branch",
  });

  // Save all branches
  console.log(response.data);
  await cachedb.branchMeta.bulkPut(response.data);

  return await getBranchesMeta();
}

export async function getBranchesMeta() {
  return cachedb.branchMeta.toArray();
}

export async function saveCategory(categories: string[], kind: CategoryType) {
  const existing = await getBusinessMeta();

  const baseMeta = existing ?? {
    id: "biz-01",
    businessName: "",
    businessLogo: "",
    ownerName: "",
    ownerMobileNos: [],
    sms: false,
    categories: [],
    incomeCategories: [],
    expenseCategories: [],
    plan: "",
    planCycle: "Monthly",
    createdAt: "",
  };

  switch (kind) {
    case "product": {
      const orderedCategories = [
        "All",
        ...categories.filter(
          (c) => c.toLowerCase() !== "all" && c.toLowerCase() !== "temporary",
        ),
        "Temporary",
      ];

      await cachedb.businessMeta.put({
        ...baseMeta,
        categories: orderedCategories,
      });
      break;
    }

    case "income": {
      await cachedb.businessMeta.put({
        ...baseMeta,
        incomeCategories: categories,
      });
      break;
    }

    case "expense": {
      await cachedb.businessMeta.put({
        ...baseMeta,
        expenseCategories: categories,
      });
      break;
    }
  }
}

export async function removeCategory(category: string, kind: CategoryType) {
  const meta = await getBusinessMeta();
  if (!meta) return;

  switch (kind) {
    case "income": {
      const updated = meta.incomeCategories.filter(
        (c) => c.toLowerCase() !== category.toLowerCase(),
      );

      await cachedb.businessMeta.update(meta.id!, {
        incomeCategories: updated,
      });
      break;
    }

    case "expense": {
      const updated = meta.expenseCategories.filter(
        (c) => c.toLowerCase() !== category.toLowerCase(),
      );

      await cachedb.businessMeta.update(meta.id!, {
        expenseCategories: updated,
      });
      break;
    }

    case "product": {
      const updated = meta.categories.filter(
        (c) => c.toLowerCase() !== category.toLowerCase(),
      );

      await cachedb.businessMeta.update(meta.id!, {
        categories: updated,
      });
      break;
    }
  }
}

export async function getCachedCategories(): Promise<string[]> {
  const meta = await getBusinessMeta();
  return meta?.categories ?? [];
}

export async function getOrderType() {
  const client = await cachedb.client.get(clientPrimaryKey);

  if (!client) return null;

  const { id, lastProductFetch, ...rest } = client;

  return rest;
}

export async function setClientEditMode(editMode: boolean) {
  const client = await cachedb.client.get(clientPrimaryKey);

  if (!client) return null; // client not found

  // update only editMode
  await cachedb.client.update(clientPrimaryKey, { editMode });

  return { ...client, editMode }; // return updated client object
}

export async function clientReset() {
  const client = await cachedb.client.get(clientPrimaryKey);

  if (!client) return null; // client not found

  // update only editMode
  const x = await cachedb.client.update(clientPrimaryKey, {
    editMode: false,
    edCustomerPaymentMethod: "Cash",
    edDeliveryfee: null, //new Prisma.Decimal(50),
    edPaymentPortion: "Full Payment",
    edPaymentPortionAmount: null,
  });

  return x; // return updated client object
}

export async function syncCacheProducts(queryClient: any) {
  await cachedb.productMeta.clear();
  await cachedb.productVarient.clear();
  await cachedb.client.clear();
  await getCacheProductsWithVariants();
  queryClient.invalidateQueries({ queryKey: ["products"] });
}
export async function getCacheProductsWithVariants(): Promise<{
  products: (IProductMeta & { varients: IProductVarient[] })[];
  expired: boolean;
}> {
  const client = await cachedb.client.get(clientPrimaryKey);
  const lastFetchTime = client?.lastProductFetch;

  if (!lastFetchTime) {
    return { products: [], expired: true };
  }

  const timeDifferenceInHrs = (Date.now() - lastFetchTime) / (1000 * 60 * 60);
  const expired = timeDifferenceInHrs > 12;

  const productMetas = await cachedb.productMeta.toArray();

  // Get products with their variants
  const productsWithVarients = await Promise.all(
    productMetas.map(async (product: IProductMeta) => {
      const varients = (
        await cachedb.productVarient
          .where("metaId")
          .equals(product.id as string)
          .sortBy("createdAt")
      ).reverse();

      // Get the most recent variant date (or 0 if none)
      const latestVarientDate =
        varients.length > 0 ? new Date(varients[0].createdAt).getTime() : 0;

      return { ...product, varients, latestVarientDate };
    }),
  );

  // Sort products by latest variant date (descending)
  const sortedProducts = productsWithVarients
    .sort((a, b) => b.latestVarientDate - a.latestVarientDate)
    .map(({ latestVarientDate, ...rest }) => rest);

  return { products: sortedProducts, expired };
}

export async function saveAllProductWithVariants({
  data,
  lastProductFetch,
}: {
  data: { productsMeta: IProductMeta[]; productsVarients: IProductVarient[] };
  lastProductFetch: number;
}) {
  await cachedb.transaction(
    "rw",
    [cachedb.productMeta, cachedb.productVarient],
    async () => {
      // Use bulkPut to add or update records
      await cachedb.productMeta.bulkPut(data.productsMeta);
      await cachedb.productVarient.bulkPut(data.productsVarients);
    },
  );

  // Update timestamp without wiping DB
  await cachedb.client.put({
    id: clientPrimaryKey,
    lastProductFetch,
    editMode: false,
    edCustomerMobile: globalDefaultCustomer.enable
      ? globalDefaultCustomer.mobile
      : null,
    edCustomerPaymentMethod: "Cash",
    edDeliveryfee: null,
    edPaymentPortion: "Full Payment",
    edPaymentPortionAmount: null,
    nextInvoiceIdSuffix: "notset",
  });
}

export async function updateBaseDataOfProduct(
  data: IProductMeta & { id: string },
) {
  return await cachedb.productMeta.where("id").equals(data.id).modify({
    name: data.name,
    metric: data.metric,
    searchQuery: data.searchQuery,
    brand: data.brand,
    categories: data.categories,
  });
}

export async function saveOneProductWithVariants({
  productsMeta,
  productsVarient,
}: {
  productsMeta: IProductMeta;
  productsVarient: IProductVarient;
}) {
  // Temporary product logic
  if (productsMeta.name === "TEMPORARY PRODUCTS") {
    const exists = await cachedb.productMeta
      .where("name")
      .equals("TEMPORARY PRODUCTS")
      .first();

    // If already exists → ONLY save variant
    if (exists) {
      return cachedb.productVarient.put(productsVarient);
    }

    // If not exists → save both
    return Promise.all([
      cachedb.productMeta.put(productsMeta),
      cachedb.productVarient.put(productsVarient),
    ]);
  }

  // Normal product → save both
  return Promise.all([
    cachedb.productMeta.put(productsMeta),
    cachedb.productVarient.put(productsVarient),
  ]);
}

export async function getCacheProductWithVariantsByBarcode(input: string) {
  const varient = await cachedb.productVarient
    .where("barcode")
    .equals(input)
    .first(); // ✅ returns IProductVarient | undefined

  if (!varient) {
    return null; // or throw new Error("Not found")
  }

  return {
    varients: [
      {
        variationId: varient.id,
        variationName: varient.variation,
        prices: varient.prices,
        quantity: 1,
      },
    ],
  };
}

export async function getCacheProductMetaOnlyByBarcode(input: string) {
  const varient = await cachedb.productVarient
    .where("barcode")
    .equals(input)
    .first(); // ✅ returns IProductVarient | undefined

  if (!varient) {
    return null; // or throw new Error("Not found")
  }

  const meta = await cachedb.productMeta
    .where("id")
    .equals(varient.metaId)
    .first(); // ✅ returns IProductVarient | undefined

  return meta;
}

export async function addtoCacheCart(
  variations: ISelectedVariation[],
  edit: boolean = false,
) {
  let addedCount = 0; // track how many items got added

  for (const variation of variations) {
    const { variationId, prices, quantity, variationName, unitPrice } =
      variation;

    // check if already in cart
    const alreadyCartedProduct = await cachedb.cartItem
      .where("productVarientId")
      .equals(variationId)
      .first();

    if (alreadyCartedProduct) {
      toast.warning(
        React.createElement("div", { className: "flex flex-col" }, [
          React.createElement(
            "span",
            { className: "font-semibold", key: "1" },
            "Product Already Added",
          ),
          React.createElement(
            "span",
            { className: "text-[11px] text-muted-foreground", key: "2" },
            `Variant ID - ${variationId}`,
          ),
        ]),
      );
      continue;
    }

    const varientRow = await cachedb.productVarient
      .where("id")
      .equals(variationId)
      .first();

    if (!varientRow) continue;

    const metaRow = await cachedb.productMeta
      .where("id")
      .equals(varientRow.metaId!)
      .first();

    const data: ICartItem = {
      name: metaRow?.name ?? "Unknown Product",
      image: metaRow?.images?.[0] || null,
      metric: metaRow?.metric ?? "None",
      variationName,
      priceVariation: prices,
      productVarientId: variationId,
      unitPrice: prices[0].sel,
      quantity,
    };

    await cachedb.cartItem.add(data);
    addedCount++; // ✅ mark one successful add
  }

  // show success only if at least one was added
  if (addedCount > 0 && !edit) {
    toast.success(
      `${addedCount} Product${addedCount > 1 ? "s" : ""} Added Successfully`,
    );
  }
  focusBarcode();
}

export function transformCartData(products: ICartItem[]): IGroupedCart[] {
  const grouped: Record<string, IGroupedCart> = {};

  for (const p of products) {
    if (!grouped[p.name]) {
      grouped[p.name] = {
        name: p.name,
        img: p.image || null,
        metric: p.metric,
        variations: [],
      };
    }

    grouped[p.name].variations.push({
      variationName: p.variationName,
      productVarientId: p.productVarientId,
      priceVariation: p.priceVariation,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
    });
  }

  return Object.values(grouped);
}
export async function updateCacheCartQuantity(
  productVarientId: string,
  quantity: number,
) {
  return await cachedb.cartItem
    .where("productVarientId")
    .equals(productVarientId)
    .modify({ quantity });
}

export async function updateCacheCartUnitPrice(
  productVarientId: string,
  unitPrice: number,
) {
  return await cachedb.cartItem
    .where("productVarientId")
    .equals(productVarientId)
    .modify({ unitPrice });
}

export async function addNewProductPriceToTheVarientWithInCart(
  vid: string,
  priceSet: IPriceVarient,
) {
  const cleanPrice = {
    set: Number(priceSet.set),
    reg: Number(priceSet.reg),
    sel: Number(priceSet.sel),
  };

  // FOR CART MODIFY
  await cachedb.cartItem
    .where("productVarientId")
    .equals(vid)
    .modify((variant) => {
      if (!variant.priceVariation) variant.priceVariation = [];
      variant.priceVariation.push(cleanPrice);
    });

  // FOR PRODUCT GENERAL MODIFY
  await cachedb.productVarient
    .where("id")
    .equals(vid)
    .modify((variant) => {
      if (!variant.prices) variant.prices = [];
      variant.prices.push(cleanPrice);
    });
}

export async function removeOneFromCacheCart(productVarientId: string) {
  return await cachedb.cartItem
    .where("productVarientId")
    .equals(productVarientId)
    .delete();
}

export async function removeAllFromCacheCart() {
  await cachedb.cartItem.clear(); // deletes all rows, keeps schema
  await setClientEditMode(false);
  await cachedb.client.update(clientPrimaryKey, {
    edCustomerPaymentMethod: "Cash",
    edCustomerMobile: globalDefaultCustomer.mobile,
    edDeliveryfee: null,
  });
  await setCurrentCustomer(
    globalDefaultCustomer.name,
    globalDefaultCustomer.mobile,
  );
  focusBarcode();
}

export async function getTotalFromCacheCart() {
  const items = await cachedb.cartItem.toArray();
  const total = items.reduce((sum, item) => {
    return sum + item.unitPrice * item.quantity;
  }, 0);
  return total;
}

export async function addtoHoldCacheCart(customerMobile: string) {
  // get all active cart items
  const cartItems = await cachedb.cartItem.toArray();

  if (!cartItems.length) {
    throw new Error("No items in cart to hold"); // <--- trigger toast
  }

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // map them into holded cart structure
  const holdedItems = cartItems.map((item) => ({
    customerMobile,
    cartId: item.id!, // original cartItem
    time: time,
    name: item.name,
    metric: item.metric,
    variationName: item.variationName,
    priceVariation: item.priceVariation,
    image: item.image,
    productVarientId: item.productVarientId,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }));

  // bulk insert into holdedCartItem
  await cachedb.holdedCartItem.bulkAdd(holdedItems);

  await removeAllFromCacheCart();
  focusBarcode();
}

export async function getAllHeldCartsMeta() {
  const cartItems = await cachedb.holdedCartItem.toArray();

  // Track unique customerMobile + time combinations
  const seen = new Set<string>();
  const uniqueCarts: { customerMobile: string; time: string }[] = [];

  cartItems.forEach((item) => {
    const key = `${item.customerMobile}-${item.time}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCarts.push({
        customerMobile: item.customerMobile,
        time: item.time,
      });
    }
  });

  // Sort by time descending (latest first)
  uniqueCarts.sort((a, b) => {
    // Convert time to minutes for comparison
    const toMinutes = (timeStr: string) => {
      const [hourMin, period] = timeStr.split(" "); // "12:45 PM"
      const [hourStr, minuteStr] = hourMin.split(":"); // both as strings
      let hour = Number(hourStr); // hour may change
      const minute = Number(minuteStr); // minute never changes

      if (period?.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (period?.toUpperCase() === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    };

    return toMinutes(b.time) - toMinutes(a.time);
  });

  return uniqueCarts;
}

export async function switchHeldtoCurrentCart(
  customerMobile: string,
  time: string,
) {
  // Step 1: clear the current cart
  await removeAllFromCacheCart();

  // Step 2: get the matching held items
  const readyToSwitchitems = await cachedb.holdedCartItem
    .where("customerMobile")
    .equals(customerMobile)
    .filter((item) => item.time === time)
    .toArray();

  if (readyToSwitchitems.length === 0) return;

  // Step 3: map them into cart structure
  const goToCart = readyToSwitchitems.map((item) => ({
    id: item.cartId!,
    name: item.name,
    metric: item.metric,
    variationName: item.variationName,
    priceVariation: item.priceVariation,
    image: item.image,
    productVarientId: item.productVarientId,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }));

  // Step 4: bulk insert into cart
  await cachedb.cartItem.bulkAdd(goToCart);

  // Step 5: delete the transferred rows from holdedCartItem
  const idsToDelete = readyToSwitchitems
    .map((item) => item.id)
    .filter((id): id is number => id !== undefined); // type guard

  await cachedb.holdedCartItem.bulkDelete(idsToDelete);
}

//get pricesby varientId
export async function getPrices(id: string) {
  const obj = await cachedb.productVarient.get(id);
  return obj?.prices;
}

// edit cart
export async function editInvoice(data: any) {
  // Step 1: Clear the current cart
  await removeAllFromCacheCart();

  await setCurrentCustomer(
    data.baseData.customer,
    data.baseData.customerMobile,
  );

  await cachedb.client.update(clientPrimaryKey, {
    edPaymentPortionAmount: Number(data.baseData.paymentAmount),
    edPaymentPortion: data.baseData.incomeCategory,
    edCustomerPaymentMethod: data.baseData.paymentMethod,
    edCustomerMobile: data.baseData.customerMobile,
    edDeliveryfee: Number(data.baseData.deliveryfee),
    editMode: true,
  });

  // // Step 2: Prepare core data for UI
  // const coreData = {
  //   paymentMethod: data.baseData.paymentMethod,
  //   customerMobile: data.baseData.customerMobile,
  //   deliveryfee: data.baseData.deliveryfee,
  // };

  // Step 3: Flatten all variations from items
  const variations = data.items.flatMap((item) => item.variations);

  // Step 4: Map variations into selected cart format with async price fetching
  const final: ISelectedVariation[] = await Promise.all(
    variations.map(async (v) => ({
      variationId: v.id,
      variationName: getVariationName(v.variation),
      quantity: v.quantity,
      prices: await getPrices(v.id), // fetch cached price
      // Note: sellingPrice is handled separately
    })),
  );

  // Step 5: Add each variation to cache and update unit price
  await Promise.all(
    final.map(async (item, index) => {
      // Add as array because addtoCacheCart expects ISelectedVariation[]
      await addtoCacheCart([item], true);

      // Update the unit price using sellingPrice from original variations array
      await updateCacheCartUnitPrice(
        item.variationId,
        variations[index].sellingPrice,
      );
    }),
  );
  toast.success(`Cart Filled with Invoice No ${data.baseData.invoiceId} Items`);
}

// current customer operations -------------------------------- current customer operations

// export async function clearCurrentCustomer() {
//   await cachedb.currentCustomer.clear(); // deletes all rows, keeps schema
// }
export async function clearCurrentCustomer() {
  await cachedb.currentCustomer.put({
    id: 1,
    name: "",
    mobile: "",
  });
}

export async function setCurrentCustomer(name: string, mobile: string) {
  await cachedb.currentCustomer.put({
    id: 1, // 👈 FIXED ID (only one customer ever)
    name,
    mobile,
  });
}

export async function getCurrentCustomer() {
  return await cachedb.currentCustomer.get(1);
}

// current customer operations -------------------------------- current customer operations

export async function getExportReadyCacheCart() {
  const items = await cachedb.cartItem.toArray();

  // Return only selected fields
  return items.map(({ productVarientId, unitPrice, quantity }) => ({
    productVarientId,
    unitPrice,
    quantity,
  }));
}

export async function getReverseExportFormat() {
  // Step 1: get cart items
  const cartItems = await getExportReadyCacheCart();

  // Step 2: get all metas & variations (cached, fast)
  const productMetas = await cachedb.productMeta.toArray();
  const productVariations = await cachedb.productVarient.toArray();

  // Step 3: build lookup maps
  const variationMap = new Map(productVariations.map((v) => [v.id, v]));

  const metaMap = new Map(productMetas.map((m) => [m.id, m]));

  // Step 4: group by productMeta
  const resultMap = new Map<string, any>();

  for (const item of cartItems) {
    const variation = variationMap.get(item.productVarientId);
    if (!variation) continue;

    const meta = metaMap.get(variation.metaId);
    if (!meta) continue;

    // create meta group if not exists
    if (!resultMap.has(meta.id as string)) {
      resultMap.set(meta.id as string, {
        metaId: meta.id,
        name: meta.name,
        metric: meta.metric ?? "None",
        variations: [],
      });
    }

    resultMap.get(meta.id as string).variations.push({
      id: variation.id,
      variation: variation.variation ?? null,
      // regularPrice: variation.prices[0].reg,
      regularPrice: variation.prices.find((i) => i.sel === item.unitPrice)?.reg,
      sellingPrice: item.unitPrice,
      quantity: item.quantity,
    });
  }

  // Step 5: return as array
  return Array.from(resultMap.values());
}

export async function getLastEbillId() {
  const client = await cachedb.client.get(clientPrimaryKey);
  return client?.lastOrderId;
}

export async function updateLastEbillId(id: string) {
  return await cachedb.client.update(clientPrimaryKey, { lastOrderId: id });
}

//old way ----

// Save productMeta and productVarient to cache
//rw  Read-Write mode
//r read only

//Why use transactions?
//Atomicity: All operations succeed together or fail together (no partial saves)
//Consistency: Ensures data integrity across multiple tables
//Performance: Batches multiple operations efficiently

//  await cachedb.transaction(
//       "rw",
//       [cachedb.productMeta, cachedb.productVarient],
//       async () => {
//         for (const product of apiData) {
//           const { variants, ...productMeta } = product;

//           // Add product meta
//           await cachedb.productMeta.add(productMeta);

//           // Add variants if they exist
//           if (variants && variants.length > 0) {
//             await cachedb.productVarient.bulkAdd(variants);
//           }
//         }
//       }
//     );
