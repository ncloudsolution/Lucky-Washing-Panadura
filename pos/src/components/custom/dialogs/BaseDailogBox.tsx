import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePaymentGatewayContext } from "@/context/PaymentContext";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dispatch, SetStateAction, useState } from "react";

interface IDialog {
  content: React.ReactNode;
  title?: string;
  description?: string;
  footer?: string | React.ReactNode;
  paddingLess?: boolean;
  borderLess?: boolean;
  extraStateSetter?: Dispatch<SetStateAction<boolean>>;
}

export function BaseDialogBox({
  content,
  title,
  description,
  footer,
  paddingLess = false,
  borderLess = false,
  extraStateSetter,
}: IDialog) {
  const [open, setOpen] = useState(true); //already action triggerd without click
  const { data, setData } = usePaymentGatewayContext();
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        if (open)
          setData((prevData) => ({
            ...prevData,
            gatewayUrl: "",
          })); //otherwise rend just only once in the ui even close and request new one
        setOpen;
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="invisible"
          variant="outline"
          onClick={() => {
            setOpen(true);
            if (extraStateSetter) extraStateSetter(true);
          }}
        >
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`xs:max-w-[430px] ${paddingLess ? "p-0" : "p-6"} ${
          borderLess ? "" : "border"
        }`}
      >
        {title || description ? (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        ) : (
          // Visually hidden title for accessibility compliance
          <VisuallyHidden>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden>
        )}

        {content}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
