# customer creation -- create:customer

| Auth User Role | Expected | Actual --| Status

| System -- with all combination ---- | 🚨 403 --| 🚨 403 --| ✅
| Director -------------------------- | 🚨 403 --| 🚨 403 --| ✅
| Manager --------------------------- | 🚨 403 --| 🚨 403 --| ✅
| Cashier --------------------------- | 201 -----| 201 -----| ✅
| Uniter ---------------------------- | 201 -----| 201 -----| ✅

# payloads

const data = {
"customerMobile": "xx",
orderMeta: {
"operator":"xx" ,
"branch": "xx",
"paymentMethod":"xx" ,
"saleValue":"xx" ,
...(remoteOrder ? { deliveryfee } : {}),
status: remoteOrder ? "Processing" : "Delivered",
},
orderItems: products,
};
