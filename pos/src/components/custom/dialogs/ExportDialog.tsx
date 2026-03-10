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
import { toast } from "sonner";

export function ExportDialog({
  title,
  description,
  content,
  loading,
  handleExport,
  noofRecords,
  open = false,
  setOpen,
}: {
  title: string;
  description: string;
  loading: boolean;
  content: React.ReactNode;
  handleExport: () => void;
  noofRecords: number;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={loading}
          onClick={(e) => {
            if (noofRecords === 0) {
              e.preventDefault(); // prevent the dialog from opening
              toast.error("No data to export");
            }
          }}
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
