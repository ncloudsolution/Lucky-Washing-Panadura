import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DeleteDialog } from "../dialogs/DeleteDialog";
import { getAllHeldCartsMeta, removeAllFromCacheCart } from "@/data/dbcache";
import { HoldedCardDropDown } from "../other/HoldedCardDropDown";
import { useLiveQuery } from "dexie-react-hooks";
import { focusBarcode, playMusic } from "@/utils/common";

const CartTopBar = () => {
  const [time, setTime] = useState(new Date());

  // Update time every minute instead of every second for better performance
  useEffect(() => {
    // Update immediately to show current time
    setTime(new Date());

    // Calculate milliseconds until next minute
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // Set initial timeout to sync with the minute change
    const initialTimeout = setTimeout(() => {
      setTime(new Date());

      // Then update every minute
      const timer = setInterval(() => {
        setTime(new Date());
      }, 60000); // 60 seconds

      return () => clearInterval(timer);
    }, msUntilNextMinute);

    return () => clearTimeout(initialTimeout);
  }, []);

  // Format time without seconds
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGMTOffset = () => {
    const offset = -time.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? "+" : "-";
    return `GMT${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const heldCart = useLiveQuery(() => getAllHeldCartsMeta(), []);

  return (
    <div className="bg-card rounded-md shadow px-4 py-3 mb-2 flex justify-between">
      <div className="flex gap-2">
        <DeleteDialog
          triggerText="Clear Cart"
          triggerBtn={
            <Button variant={"destructive"}>
              Clear Cart <Trash2 />
            </Button>
          }
          data="Do you really want to clear the entire cart ?"
          onClick={async () => {
            await removeAllFromCacheCart();
            playMusic("/sounds/soft-clear-whoosh.mp3");
          }}
        />
        {heldCart && heldCart.length > 0 && (
          <HoldedCardDropDown carts={heldCart} />
        )}
      </div>

      <div className="flex flex-col justify-center items-end">
        <div className="flex gap-1 text-sm">
          <div className="text-gray-600">{formatDate(time)}</div>
          <div className="font-bold text-gray-900">{formatTime(time)}</div>
        </div>

        <div className="flex gap-1 text-xs">
          <div className="text-gray-500">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
          <div className="text-gray-500">({getGMTOffset()})</div>
        </div>
      </div>
    </div>
  );
};

export default CartTopBar;
