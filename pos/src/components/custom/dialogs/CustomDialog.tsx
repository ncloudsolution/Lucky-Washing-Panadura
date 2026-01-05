import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function CustomDialog({
  title,
  description,
  triggerBtn,
  specialText,
  finalFireBtn,
  loading,
}: {
  title: string;
  description: string;
  triggerBtn: React.ReactNode;
  loading: boolean;
  specialText?: string;
  finalFireBtn: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{triggerBtn}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {specialText && (
            <AlertDialogDescription className="text-primary py-2 font-semibold">
              {specialText}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {finalFireBtn}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
