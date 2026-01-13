import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function BasicHoverCard({
  title,
  description,
  triggerBtn,
}: {
  triggerBtn: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{triggerBtn}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-md font-semibold">{title}</h4>
            <p className="text-sm">{description}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
