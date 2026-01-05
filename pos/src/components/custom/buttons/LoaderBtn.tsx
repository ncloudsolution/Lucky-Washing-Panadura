import { LoaderCircle } from "lucide-react";

export const LoaderBtn = ({ loadertext }: { loadertext?: string }) => {
  const isCentered = !loadertext;

  return (
    <div
      className={`flex items-center ${
        isCentered ? "justify-center w-full" : " "
      }`}
    >
      {!isCentered && <div className="pr-2 truncate">{loadertext}</div>}
      <LoaderCircle className="animate-spin" />
    </div>
  );
};
