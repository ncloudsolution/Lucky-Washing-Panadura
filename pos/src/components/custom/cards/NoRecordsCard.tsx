import { Card } from "@/components/ui/card";
import { TrafficCone } from "lucide-react";

const NoRecordsCard = ({ mini = false }: { mini?: boolean }) => {
  return (
    <Card
      className={`flex ${
        mini
          ? "border-none px-0 py-0 xs:p-0 shadow-none bg-transparent"
          : "border border-input py-10 px-5"
      } bg-white/80 flex-col gap-0 flex-1 size-full items-center justify-center rounded-sm`}
    >
      <TrafficCone
        strokeWidth={0.6}
        className={`w-full  ${
          mini ? "size-[80px]" : "size-[100px] lg:size-[200px]"
        }`}
      />
      <p
        className={`text-center ${
          mini ? "text-[20px]" : "lg:text-[30px] text-[20px]"
        } font-medium`}
      >
        No Records Available.
      </p>
    </Card>
  );
};

export default NoRecordsCard;
