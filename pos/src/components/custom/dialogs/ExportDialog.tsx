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
import { Button } from "@/components/ui/button";
import { Sheet } from "lucide-react";
import { useState } from "react";

export function ExportDialog({
  title,
  description,
  content,
  loading,
  handleExport,
}: {
  title: string;
  description: string;
  loading: boolean;
  content: React.ReactNode;
  handleExport: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={loading}
          className="flex gap-2 disabled:bg-gray-500 bg-green-700 hover:bg-green-700 text-white rounded-sm w-[150px]"
        >
          <Sheet /> Export
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="gap-0">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {content}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="flex-1">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              handleExport();
              setOpen(false);
            }}
            className="flex flex-1 gap-2 disabled:bg-gray-500 bg-green-700 hover:bg-green-700 text-white rounded-sm"
          >
            <Sheet /> Export
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
