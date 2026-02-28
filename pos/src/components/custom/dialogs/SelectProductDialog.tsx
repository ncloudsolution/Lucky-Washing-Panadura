"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import OptimizedImage from "../other/OptimizedImage";
import { Box } from "lucide-react";
import { useMemo, useState } from "react";
import FormProductOrder, {
  ISelectedVariation,
} from "../forms/FormProductOrder";
import { addtoCacheCart } from "@/data/dbcache";
import { getVariationName } from "@/utils/common";

export function SelectProductDialog({
  data,
  buttonLess = false,
  onDialogClose,
}: {
  data: any;
  buttonLess?: boolean;
  onDialogClose?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Set<string>>(
    new Set(),
  );

  const variationCount = data?.varients?.length || 0;
  const hasMultipleVariations = variationCount > 1;

  const handleVariationSelect = (variationId: string) => {
    setSelectedVariations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(variationId)) {
        newSet.delete(variationId);
      } else {
        newSet.add(variationId);
      }
      return newSet;
    });
  };

  const isVariationSelected = (variationId: string) => {
    return selectedVariations.has(variationId);
  };

  const getSelectedVariationData = (): ISelectedVariation[] => {
    if (!data?.varients) return [];
    return data.varients
      .filter((v: any) => selectedVariations.has(v.id))
      .map((v: any) => ({
        variationId: v.id,
        variationName: getVariationName(v.variation),
        prices: v.prices || [],
        quantity: 1,
      }));
  };

  const handleFormSubmit = async (formData: any) => {
    await addtoCacheCart(formData);
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedVariations(new Set());
    onDialogClose?.();
  };

  const handleButtonClick = () => {
    if (!hasMultipleVariations && data?.varients?.[0]) {
      const singleVariation = data.varients[0];
      const formData = {
        variations: [
          {
            variationId: singleVariation.id,
            variationName: getVariationName(singleVariation.variation),
            quantity: 1,
            prices: singleVariation.prices,
          },
        ],
      };
      handleFormSubmit(formData.variations);
    } else {
      setIsOpen(true);
    }
  };

  const computedVariations = useMemo(
    () => getSelectedVariationData(),
    [selectedVariations, data],
  );

  return (
    <>
      {!buttonLess && (
        <Button
          onClick={handleButtonClick}
          className="flex flex-col gap-1 overflow-hidden shadow-lg size-[150px] rounded-md p-0 text-wrap"
          variant="secondary"
        >
          {data?.images?.length > 0 ? (
            <div className="relative size-full">
              <div className="bg-gradient-to-t from-superbase from-5% to-transparent to-30% size-full absolute z-10" />
              <div className="w-full px-2 font-normal absolute bottom-3 z-20 text-white break-words whitespace-normal line-clamp-2">
                {data.name}
              </div>
              <OptimizedImage alt="" src={data.images[0]} />
            </div>
          ) : (
            <>
              <Box className="size-[80px]" strokeWidth={1} />
              <div className="text-sm text-center px-2 font-normal leading-tight break-words whitespace-normal line-clamp-2">
                {data.name}
              </div>
            </>
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent
          className="min-w-5xl max-h-[90vh] overflow-y-auto gap-4"
          autoFocus={false}
        >
          <DialogTitle className="leading-[20px]">{data?.name}</DialogTitle>

          <div className="flex flex-col">
            <div className="flex gap-5 items-start">
              <div className="size-[120px] xxs:size-[150px] flex items-center justify-center rounded-sm overflow-hidden border border-border-sidebar flex-shrink-0">
                {data?.images?.length > 0 ? (
                  <OptimizedImage alt="" src={data.images[0]} />
                ) : (
                  <Box className="size-[80px]" strokeWidth={1} />
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {data?.varients?.map((item: any, index: number) => (
                    <div
                      key={item.id || index}
                      className={`border ${
                        isVariationSelected(item.id)
                          ? "bg-superbase text-white"
                          : "border-border-sidebar"
                      } ${
                        variationCount === 2 && "h-[120px] xxs:h-[150px]"
                      } rounded-md flex flex-col flex-1 border-superbase justify-center items-center xxs:p-3 p-2 cursor-pointer transition-colors`}
                      onClick={() => handleVariationSelect(item.id)}
                    >
                      <span className="text-sm flex items-center text-center">
                        <div className="flex flex-col gap-0">
                          {getVariationName(item.variation)
                            .split(",")
                            .map((it: any, idx: number) => (
                              <span key={idx}>{it}</span>
                            ))}
                        </div>
                      </span>
                      <span className="text-xs mt-1">
                        LKR {item.prices?.[0]?.sel || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedVariations.size > 0 && (
              <div className="mt-0 pt-4 border-t">
                <div className="text-sm text-gray-600 mb-3">
                  {selectedVariations.size === 1
                    ? "Selected variation"
                    : `Selected ${selectedVariations.size} variations`}
                </div>
                <FormProductOrder
                  selectedVariations={computedVariations}
                  onSubmission={handleFormSubmit}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
