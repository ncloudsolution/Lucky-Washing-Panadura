"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { TipWrapper } from "../wrapper/TipWrapper";

export function AddNewDialog({
  triggerBtn,
  triggerText = "New Product",
  form,
  mini,
}: {
  triggerBtn?: React.ReactNode;
  triggerText: string;
  form: React.ReactNode;
  mini?: boolean;
}) {
  return (
    <Dialog>
      <TipWrapper triggerText={triggerText}>
        <DialogTrigger asChild>
          {triggerBtn ? (
            triggerBtn
          ) : (
            <Button
              className={`${
                mini && "size-6 rounded-sm"
              } bg-superbase text-white hover:bg-superbase`}
            >
              <Plus />
            </Button>
          )}
        </DialogTrigger>
      </TipWrapper>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="hidden">{triggerText}</DialogTitle>
        {form}
      </DialogContent>
    </Dialog>
  );
}
