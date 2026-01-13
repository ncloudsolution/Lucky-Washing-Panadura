"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IPriceVarient, TMetric } from "@/data";
import { updateCacheCartUnitPrice } from "@/data/dbcache";
import ViewAccessChecker from "./AccessChecker";
import { AddNewDialog } from "../dialogs/AddNewDialog";
import FormProductPrice from "../forms/FormProductPrice";
import { Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
export function PriceDropDown({
  productVarientId,
  unitPrice,
  priceVariations,
  metric,
}: {
  metric: TMetric;
  productVarientId: string;
  unitPrice: number;
  priceVariations: IPriceVarient[];
}) {
  const { data: session, status } = useSession();
  const role = session?.user.role.toLowerCase();
  const branch = session?.user.branch.toLowerCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 justify-end h-[30px] px-2 rounded-sm selection:bg-transparent"
        >
          <span>{unitPrice}</span>
          {metric !== "None" && `(1 ${metric})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {priceVariations.map((vari, index) => (
          <DropdownMenuItem
            className="flex justify-end"
            key={index}
            onClick={async () => {
              await updateCacheCartUnitPrice(productVarientId, vari.sel);
            }}
          >
            {vari.sel}
          </DropdownMenuItem>
        ))}

        <ViewAccessChecker
          permission="edit:product"
          userRole={role}
          userBranch={branch}
          component={
            <AddNewDialog
              form={
                <FormProductPrice
                  vid={productVarientId}
                  nextSetNo={
                    priceVariations[priceVariations.length - 1].set + 1
                  }
                />
              }
              triggerText="Edit Variant"
              mini
              triggerBtn={
                <div className="flex justify-end text-superbase hover:text-superbase border border-superbase font-semibold py-1 px-2 rounded-sm cursor-pointer">
                  New
                </div>
              }
            />
          }
          skeleton={
            <Skeleton className="size-[25px] rounded-sm bg-gray-300 border-slate-400" />
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
