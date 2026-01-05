# branch creation -- create:core

| Auth User Role | Expected | Actual --| Status

| System -- with all combination ---- | 201 -----| 201 -----| ✅  
| Director -------------------------- | 201 -----| 201 -----| ✅
| Manager --------------------------- | 🚨 403 --| 🚨 403 --| ✅
| Cashier --------------------------- | 🚨 403 --| 🚨 403 --| ✅
| Uniter ---------------------------- | 201 -----| 201 -----| ✅

# payloads

base:{
"branch": "xxx",
"address": "xxx",
"hotlines": [{value:"xxx"},{value:"xxx"}],
}
