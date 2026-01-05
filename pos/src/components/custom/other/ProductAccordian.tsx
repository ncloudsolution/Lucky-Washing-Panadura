import { ICacheProduct } from "@/app/(screens)/core/pos/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import OptimizedImage from "./OptimizedImage";
import { Box, FolderInput, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { BasicDataFetch, formatDate, getVariationName } from "@/utils/common";
import ViewAccessChecker from "./AccessChecker";
import { AddNewDialog } from "../dialogs/AddNewDialog";
import FormVariation from "../forms/FormVariation";
import { Skeleton } from "@/components/ui/skeleton";
import { T_Role } from "@/data/permissions";
import { DeleteDialog } from "../dialogs/DeleteDialog";
import { toast } from "sonner";
import { cachedb } from "@/data/dbcache";
import { useQueryClient } from "@tanstack/react-query";
import FormBase from "../forms/FormBase";
import FormTempMiniTransfer from "../forms/FormTempMiniTransfer";
import FormTempMaxTransfer from "../forms/FormTempMaxTransfer";

export function ProductAccordian({
  products,
  role,
  branch,
  unfilterdProducts,
}: {
  products: ICacheProduct[];
  unfilterdProducts: any;
  role: T_Role;
  branch: string;
}) {
  const queryClient = useQueryClient();
  const prodNameAndMetaIdList = unfilterdProducts
    .filter((p) => p.name !== "TEMPORARY PRODUCTS")
    .map((p) => ({
      label: `${p.name} ${p.searchQuery ? ` - ${p.searchQuery}` : ""}`,
      value: p.id!,
    }));
  return (
    <Accordion type="single" collapsible className="w-full flex flex-col gap-2">
      {products.map((pro, index) => (
        <AccordionItem
          key={pro.id}
          value={pro.name}
          className="p-4 group hover:bg-muted flex flex-col gap-2 bg-background shadow rounded-md border border-transparent hover:border-gray-400"
        >
          {/* <AccordionTrigger className="items-center p-0 ">
            {pro.images && pro.images.length > 0 ? (
              <div className="flex items-center gap-4 w-full ">
                <div className="size-[40px] rounded-md overflow-hidden">
                  <OptimizedImage src={pro.images[0]} />
                </div>
                <TopRow product={pro} role={role} />
              </div>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <Box className="size-[40px]" strokeWidth={1} />
                <TopRow product={pro} role={role} />
              </div>
            )}
          </AccordionTrigger> */}
          <div className="flex items-center gap-4 w-full">
            {pro.images && pro.images.length > 0 ? (
              <div className="size-[40px] rounded-md overflow-hidden">
                <OptimizedImage src={pro.images[0]} />
              </div>
            ) : (
              <Box className="size-[40px]" strokeWidth={1} />
            )}

            <div className="flex flex-col w-full">
              <AccordionTrigger className="items-center justify-between p-0">
                <div className="flex items-center gap-3 w-full">
                  <div>{pro.name}</div>
                  {pro.name !== "TEMPORARY PRODUCTS" && (
                    <ViewAccessChecker
                      permission="edit:product"
                      userRole={role}
                      userBranch={branch}
                      component={
                        <AddNewDialog
                          form={<FormBase data={pro} />}
                          triggerText="Edit Base"
                          mini
                          triggerBtn={<Pencil className="p-1" />}
                        />
                      }
                      skeleton={
                        <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                      }
                    />
                  )}
                </div>
              </AccordionTrigger>

              {/* Put TopRow OUTSIDE the trigger */}
              <TopRow product={pro} role={role} />
            </div>
          </div>

          <AccordionContent className="flex flex-col ml-[56px] pb-0 text-balance">
            <Accordion
              type="single"
              collapsible
              className="w-full flex flex-col gap-2"
            >
              {pro.varients.map((va) => {
                const [date, time] = formatDate(va.createdAt.toLocaleString());
                const data = {
                  name: pro.name,
                  id: va.id ?? "",
                  metaId: va.metaId ?? null,
                  prices: va.prices,
                  barcode: va.barcode ?? "",
                  variation: va.variation,
                  sinhalaMode: !!(pro.searchQuery && pro.name),
                };
                return (
                  <AccordionItem
                    key={va.id}
                    value={va.id!}
                    className="p-2 group  flex flex-col gap-2 bg-gray-200 hover:bg-gray-300 shadow rounded-md"
                  >
                    <div className="flex justify-between w-full items-center">
                      <AccordionTrigger className="flex-1 p-0 text-left">
                        {getVariationName(va.variation)}
                      </AccordionTrigger>

                      <div className="flex gap-2 items-center">
                        <ViewAccessChecker
                          permission="edit:product"
                          userRole={role}
                          userBranch={branch}
                          component={
                            <AddNewDialog
                              form={<FormVariation data={data} type="edit" />}
                              triggerText="Edit Variant"
                              mini
                              triggerBtn={<Pencil className="p-1" />}
                            />
                          }
                          skeleton={
                            <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                          }
                        />

                        {pro.name === "TEMPORARY PRODUCTS" && (
                          <ViewAccessChecker
                            permission="move:temporary-product"
                            userRole={role}
                            userBranch={branch}
                            component={
                              <AddNewDialog
                                form={
                                  <FormTempMiniTransfer
                                    data={data}
                                    nameAndMetaList={prodNameAndMetaIdList}
                                  />
                                }
                                triggerText="Move to Existing Base product"
                                mini
                                triggerBtn={
                                  <FolderInput className="p-1 bg-superbase size-6 rounded-[4px] text-white" />
                                }
                              />
                            }
                            skeleton={
                              <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                            }
                          />
                        )}

                        {pro.name === "TEMPORARY PRODUCTS" && (
                          <ViewAccessChecker
                            permission="move:temporary-product"
                            userRole={role}
                            userBranch={branch}
                            component={
                              <AddNewDialog
                                form={<FormTempMaxTransfer data={data} />}
                                triggerText="Create New Base product and move"
                                mini
                                triggerBtn={
                                  <FolderPlus className="p-1 size-6 rounded-[4px] bg-gray-400 text-white" />
                                }
                              />
                            }
                            skeleton={
                              <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                            }
                          />
                        )}

                        {/* {pro.varients.length > 1 && ( */}
                        {pro.varients.length > 0 &&
                          pro.name !== "TEMPORARY PRODUCTS" && (
                            <ViewAccessChecker
                              permission="delete:product"
                              userBranch={branch}
                              userRole={role}
                              component={
                                <DeleteDialog
                                  mini
                                  triggerText="Delete Variant"
                                  data={`Affected product - ${getVariationName(
                                    va.variation
                                  )}`}
                                  onClick={async () => {
                                    try {
                                      const res = await BasicDataFetch({
                                        method: "DELETE",
                                        endpoint: "/api/products/variant",
                                        data: { id: va.id, metaId: va.metaId },
                                      });

                                      if (pro.varients.length === 1) {
                                        cachedb.productMeta.delete(va.metaId!);
                                        queryClient.setQueryData(
                                          ["products"],
                                          (oldData?: ICacheProduct[]) => {
                                            if (!oldData) return []; // <--- prevent .map on undefined

                                            // remove the entire product if it has only one variant
                                            const newArray = oldData.filter(
                                              (d) => d.id !== va.metaId
                                            );
                                            return newArray;
                                          }
                                        );
                                      } else {
                                        cachedb.productVarient.delete(va.id!);
                                        queryClient.setQueryData(
                                          ["products"],
                                          (oldData?: ICacheProduct[]) => {
                                            if (!oldData) return []; // <--- prevent .map on undefined

                                            return oldData.map((product) => {
                                              if (product.id !== va.metaId)
                                                return product;

                                              return {
                                                ...product,
                                                varients:
                                                  product.varients.filter(
                                                    (variant) =>
                                                      variant.id !== va.id
                                                  ),
                                              };
                                            });
                                          }
                                        );
                                      }

                                      toast.success(res.message);
                                    } catch (err) {
                                      const errorMessage =
                                        err instanceof Error
                                          ? err.message
                                          : "An error occurred";
                                      toast.error(errorMessage);
                                    }
                                  }}
                                />
                              }
                              skeleton={
                                <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
                              }
                            />
                          )}

                        <div className="font-normal">{`${date} ${time}`}</div>
                      </div>
                    </div>

                    <AccordionContent className="flex flex-col border-t-2 border-primary py-2">
                      {/* <DataRow keyName="Variant Id" value={va.id} /> */}
                      <div className="flex flex-col gap-1">
                        {va.barcode && (
                          <div className="flex gap-2 mb-2 text-xl">
                            <div>Barcode</div>
                            <span>:</span>
                            <div>{va.barcode}</div>
                          </div>
                        )}
                        {va.prices.map((pr) => (
                          <div className="flex gap-4" key={pr.set}>
                            <div>Set : {pr.set}</div>
                            <div>Regular : {pr.reg}</div>
                            <div>Selling : {pr.sel}</div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function TopRow({ product, role }: { product: ICacheProduct; role: T_Role }) {
  const data = {
    name: product.name,
    id: "",
    metaId: product.id ?? null,
    barcode: "",
    prices: [{ set: 1, reg: 0, sel: 0 }],
    variation: [{ key: "Name", value: "" }],
    sinhalaMode: !!(product.searchQuery && product.name),
  };
  return (
    // <div className="flex flex-col gap-1 w-full">
    //   <div>{product.name}</div>
    <div className="flex w-full justify-between mt-1">
      <div className="flex gap-2">
        {product.categories.map((cat, index) => (
          <div
            key={index}
            className="py-1 px-4 group-hover:bg-black group-hover:text-white bg-secondary rounded-sm text-xs font-normal shadow"
          >
            {cat}
          </div>
        ))}
      </div>
      {product.varients &&
        product.varients.length > 0 &&
        product.varients[0].variation && (
          <ViewAccessChecker
            permission="create:product"
            userRole={role}
            component={
              <AddNewDialog
                form={<FormVariation data={data} type="new" />}
                triggerText="Add Variant"
                mini
              />
            }
            skeleton={
              <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
            }
          />
        )}
    </div>
    // </div>
  );
}
