import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Menu } from "lucide-react";

export function DataDialog({
  title,
  description,
  content,
  isLoading,
}: {
  title: string;
  description: string;
  content: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger disabled={isLoading}>
        <Menu
          className={`${
            isLoading ? "bg-gray-400" : "bg-superbase"
          } text-white rounded-[3px] shadow p-1`}
          size={30}
        />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
