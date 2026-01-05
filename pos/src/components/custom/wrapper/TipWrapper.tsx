import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
export function TipWrapper({
  triggerText,
  children,
}: {
  triggerText: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <p>{triggerText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
