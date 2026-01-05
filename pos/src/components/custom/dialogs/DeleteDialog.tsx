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
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { LoaderBtn } from "../buttons/LoaderBtn";
import { TipWrapper } from "../wrapper/TipWrapper";
import { Button } from "@/components/ui/button";
export function DeleteDialog({
  triggerBtn,
  triggerText = "Delete",
  onClick,
  data,
  mini,
}: {
  triggerText?: string;
  triggerBtn?: React.ReactNode;
  onClick: () => void;
  data: string;
  mini?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onClick(); // your delete logic

      setOpen(false); // manually close after deletion
    } catch (e) {
      console.error("Deletion failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <TipWrapper triggerText={triggerText}>
        <AlertDialogTrigger asChild>
          {triggerBtn ? (
            triggerBtn
          ) : (
            <Button
              className={`${
                mini && "size-6 rounded-[4px]"
              } bg-destructive text-white hover:bg-destructive`}
            >
              <Trash2 />
            </Button>
          )}
        </AlertDialogTrigger>
      </TipWrapper>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the entry
            and remove your data from our servers.
          </AlertDialogDescription>
          {data && (
            <AlertDialogDescription className="text-primary py-2 font-semibold">
              {data}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 flex"
            onClick={(e) => {
              e.preventDefault(); // ✅ Prevent default close behavior //instant close removed and wait untill async or sync action happens
              handleDelete();
            }}
            disabled={loading}
          >
            {loading ? (
              <LoaderBtn loadertext="Deleting ..." />
            ) : (
              <>
                Delete
                <Trash2 size={16} className="size-[16px] text-secondary" />
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
