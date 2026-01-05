import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectOnSearch({
  icon,
  selections,
  value,
  onValueChange,
  isLoading,
}: {
  icon: React.ReactNode;
  selections: string[];
  value: string;
  onValueChange: (value: string) => void;
  isLoading: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger className="w-full bg-superbase text-white disabled:bg-gray-500">
        <div className="flex items-center gap-2">
          {icon}
          <SelectValue placeholder="Select a fruit" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {selections.map((i, index) => (
          <SelectItem key={index} value={i}>
            {i}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
