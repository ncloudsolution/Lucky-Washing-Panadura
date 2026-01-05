import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";
import { TipWrapper } from "../wrapper/TipWrapper";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import OptimizedImage from "../other/OptimizedImage";
import char from "@/images/char.jpg";

const CharactorMapDialog = () => {
  return (
    <Dialog>
      <TipWrapper triggerText="Charactor Map">
        <DialogTrigger asChild>
          <Button className="bg-superbase hover:bg-superbase text-white rounded-sm size-8 md:size-9 cursor-pointer">
            <Languages className="size-4 md:size-5" />
          </Button>
        </DialogTrigger>
      </TipWrapper>
      <DialogContent className="min-w-[65vw] h-[82vh]">
        <DialogTitle className="hidden">Charator Map</DialogTitle>
        <OptimizedImage src={char} />
      </DialogContent>
    </Dialog>
  );
};

export default CharactorMapDialog;
