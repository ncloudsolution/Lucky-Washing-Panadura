"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

export function DatePickerWithRange({
  isLoading,
  date,
  setDate,
  label = true,
}: {
  label?: boolean;
  isLoading: boolean;
  date: DateRange | undefined;
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}) {
  // const [date, setDate] = React.useState<DateRange | undefined>({
  //   from: new Date(new Date().getFullYear(), 0, 1),
  //   to: new Date(),
  //   // to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),  //(Jan 20 + 20 days)
  // });
  return (
    <Field
      className={`mx-auto w-full ${label && "gap-1.5"}  ${isLoading && "cursor-not-allowed"}`}
    >
      {label && (
        <FieldLabel htmlFor="date-picker-range">
          Search By Date Range
        </FieldLabel>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            id="date-picker-range"
            className="disabled:bg-gray-500 disabled:cursor-not-allowed min-w-[220px] justify-start px-2.5 font-normal bg-superbase hover:bg-superbase text-white hover:text-white rounded-sm"
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
