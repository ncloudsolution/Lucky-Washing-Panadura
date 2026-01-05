import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import React from "react";

const SearchInput = ({
  type = "text",
  placeholder,
  onchange,
  value,
  icon = true,
}: {
  type: string;
  placeholder: string;
  onchange: (value: string) => void;
  value: string;
  icon?: boolean;
}) => {
  return (
    <Input
      type="number"
      className="border border-input b-0 h-[36px] w-full no-spinner"
      placeholder={placeholder}
      onChange={(e) => onchange(e.target.value)}
      value={value}
    />
  );
};

export default SearchInput;
