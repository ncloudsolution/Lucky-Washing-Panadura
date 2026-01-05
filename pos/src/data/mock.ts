export const products = [
  {
    id: "pmid-01",
    name: "Chicken Fried Rice With Grill Chicken",
    categories: ["Food"],
    brand: null,
    description: null,
    shortDescription: null,
    images: [
      "https://as2.ftcdn.net/v2/jpg/07/17/44/91/1000_F_717449146_SSz4cFevaC1qLGAu10qxjFKuHSzf661c.jpg",
    ],
    tags: [""],
    createdAt: "xxx",
    variants: [
      //ANOTHER TABLE
      {
        id: "pvid-01",
        barcode: null,
        variation: { size: "S" },
        prices: [{ set: 1, reg: 1200, sel: 1100 }],
      },
      {
        id: "pvid-02",
        barcode: null,
        variation: { size: "L" },
        prices: [{ set: 1, reg: 1300, sel: 1200 }],
      },
      {
        id: "pvid-03",
        barcode: null,
        variation: { size: "XL" },
        prices: [
          { set: 1, reg: 1200, sel: 1700 },
          { set: 2, reg: 1300, sel: 1800 },
        ],
      },
      {
        id: "pvid-04",
        barcode: null,
        variation: { size: "XXL" },
        prices: [{ set: 1, reg: 1300, sel: 1200 }],
      },
    ],
    productStock: [],
  },
  {
    id: "pmid-02",
    name: "Gents T Shirt",
    categories: ["Textile", "Fasion"],
    brand: "Emarald",
    description: "xx",
    shortDescription: "xx",
    images: [],
    tags: ["tshirt", "gents", "extra"],
    createdAt: "xxx",
    variants: [
      //ANOTHER TABLE
      {
        id: "pvid-05",
        barcode: "3456",
        variation: { color: "White", size: "S" },
        prices: [{ set: 1, reg: 3400, sel: 3000 }],
      },
      {
        id: "pvid-06",
        barcode: "3457",
        variation: { color: "Red", size: "S" },
        prices: [{ set: 1, reg: 4600, sel: 4600 }],
      },
    ],
    productStock: [
      //ANOTHER TABLE
      {
        id: "psid-01",
        branch: "Homagama",
        quantity: [{ set: 1, count: 30 }],
      },
      {
        id: "psid-02",
        branch: "Godagama",
        quantity: [{ set: 1, count: 45 }],
      },
    ],
  },
  {
    id: "pmid-03",
    name: "Sub Woofer Hello D4-990 Selmo Light",
    categories: ["Electronics"],
    brand: "JBL",
    description: null,
    shortDescription: null,
    images: [],
    tags: [""],
    createdAt: "xxx",
    variants: [
      //ANOTHER TABLE
      {
        id: "pvid-07",
        barcode: null,
        variation: null,
        prices: [{ set: 1, reg: 25000, sel: 22000 }],
      },
    ],
    productStock: [],
  },
];

// [
//   {
//     metaId: "pmid-01",
//     name: "Chicken Fried Rice With Grill Chicken",
//     variations: [
//       {
//         id: "pvid-01",
//         variation: {
//           size: "S",
//         },
//         regularPrice: 1200,
//         sellingPrice: 1100,
//         quantity: 3,
//       },
//       {
//         id: "pvid-02",
//         variation: {
//           size: "L",
//         },
//         name: "Chicken Fried Rice With Grill Chicken",
//         regularPrice: 1300,
//         sellingPrice: 1200,
//         quantity: 1,
//       },
//     ],
//   },

//   {
//     metaId: "pmid-04",
//     name: "Test Pro",
//     variations: [
//       {
//         id: "pvid-08",
//         variation: null,
//         regularPrice: 200,
//         sellingPrice: 110,
//         quantity: 1,
//       },
//     ],
//   },
// ];
