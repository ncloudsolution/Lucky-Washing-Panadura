import { IGroupedCart } from "@/data";
import React, { useState } from "react";
import OptimizedImage from "../other/OptimizedImage";
import { Box, Trash2 } from "lucide-react";
import FormCartCounter from "../forms/FormCartCounter";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "../dialogs/DeleteDialog";
import { removeOneFromCacheCart } from "@/data/dbcache";
import { PriceDropDown } from "../other/PriceDropDown";

const CartProduct = (product: IGroupedCart) => {
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);

  console.log(product.variations, "vari");

  return (
    <div className="flex w-full border-b p-3 gap-2">
      <div className="size-[52px] rounded-sm overflow-hidden shadow">
        {product.img ? (
          <OptimizedImage alt="" src={product.img} />
        ) : (
          <Box className="size-[52px] border rounded-sm p-1" strokeWidth={1} />
        )}
      </div>

      <div className="flex flex-col flex-1">
        <div className="font-semibold leading-[20px] mb-1 line-clamp-1">
          {product.name}
        </div>

        <div className="flex flex-col gap-1 text-[14px]">
          {product.variations.map((vari, index) => (
            <div
              key={vari.productVarientId}
              className="flex items-center justify-between w-full gap-2 leading-[16px]"
            >
              <div
                className="text-muted-foreground cursor-pointer"
                onClick={() =>
                  setActiveDeleteId(
                    activeDeleteId === vari.productVarientId
                      ? null
                      : vari.productVarientId
                  )
                }
              >
                {/**id want full opject remove split**/}
                {vari.variationName.split(",")[0]}
              </div>

              <div className="flex gap-2 justify-end items-center relative">
                <DeleteDialog
                  triggerText="Remove Product"
                  data={`Affected product - ${vari.productVarientId}`}
                  onClick={async () =>
                    await removeOneFromCacheCart(vari.productVarientId)
                  }
                  triggerBtn={
                    <Button
                      className={` absolute z-50 left-0 size-[24px] rounded-sm bg-destructive/80 text-white hover:bg-destructive focus:bg-destructive shadow-lg transition-all duration-500 ${
                        activeDeleteId === vari.productVarientId
                          ? "opacity-100 -translate-x-8"
                          : "opacity-0 translate-x-0 pointer-events-none"
                      }`}
                    >
                      <Trash2 />
                    </Button>
                  }
                />

                <FormCartCounter
                  currentQuantity={vari.quantity}
                  productVarientId={vari.productVarientId}
                  unitPrice={vari.unitPrice}
                  metric={product.metric}
                  priceVariations={vari.priceVariation}
                />

                {/* <div className="w-[60px] text-right">{vari.unitPrice}</div> */}
                {/* <PriceDropDown
                  quantity={vari.quantity}
                  priceVariations={vari.priceVariation}
                  unitPrice={vari.unitPrice}
                  productVarientId={vari.productVarientId}
                /> */}

                <div className="min-w-[60px] flex justify-end items-center">
                  {(vari.unitPrice * vari.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartProduct;
