"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Repeat, ShoppingCart } from "lucide-react";
import { TipWrapper } from "../wrapper/TipWrapper";
import { CustomDialog } from "../dialogs/CustomDialog";
import { AlertDialogAction } from "@/components/ui/alert-dialog";
import { LoaderBtn } from "../buttons/LoaderBtn";
import { switchHeldtoCurrentCart } from "@/data/dbcache";
import { toast } from "sonner";

export function HoldedCardDropDown({
  carts,
}: {
  carts: { customerMobile: string; time: string }[];
}) {
  const [loading, setLoading] = React.useState(false);
  return (
    <DropdownMenu>
      <TipWrapper triggerText="Held Carts">
        <DropdownMenuTrigger asChild>
          <Button>
            <ShoppingCart />
          </Button>
        </DropdownMenuTrigger>
      </TipWrapper>
      <DropdownMenuContent align="start">
        {carts.map((cus, index) => (
          <CustomDialog
            key={index}
            loading={loading}
            title="Confirm Cart Replacement"
            description="You are about to replace all items in your current cart with the selected held cart. Once you confirm, the current cart items will be completely removed and cannot be recovered. If you wish to keep your current cart, click Cancel. Otherwise, click Confirm to proceed and replace the cart"
            specialText={`Current Cart Replace With ${cus.customerMobile} 's Cart`}
            triggerBtn={
              <Button
                variant="ghost"
                className="w-full flex justify-between px-2 font-normal"
              >
                <div className="font-semibold">{cus.customerMobile}</div>
                <div className="text-muted-foreground">{cus.time}</div>
              </Button>
            }
            finalFireBtn={
              <AlertDialogAction
                className="bg-black text-white flex"
                onClick={async () => {
                  await switchHeldtoCurrentCart(cus.customerMobile, cus.time);
                  toast.success("Cart switched successfully!");
                  // simulate a real user click on the document
                  document.body.dispatchEvent(
                    new MouseEvent("pointerdown", {
                      bubbles: true, // important: must bubble
                      cancelable: true,
                      composed: true, // important for Shadow DOM (Radix uses it internally)
                    })
                  );
                }}
                disabled={loading}
              >
                {loading ? (
                  <LoaderBtn loadertext="Deleting ..." />
                ) : (
                  <>
                    Replace
                    <Repeat size={16} className="size-[16px] text-secondary" />
                  </>
                )}
              </AlertDialogAction>
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
