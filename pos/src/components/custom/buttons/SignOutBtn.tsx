"use client";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoaderBtn } from "@/components/custom/buttons/LoaderBtn";
import { cachedb } from "@/data/dbcache";

const SignOutBtn = ({ callbackPath }: { callbackPath: string }) => {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    await cachedb.delete();

    await signOut({ callbackUrl: callbackPath });

    await new Promise((resolve) => setTimeout(resolve, 500)); // 1/2 second delay
    setLoading(false);

    toast.success("Successfully logged out");
  };

  return (
    <Button
      variant="destructive"
      onClick={handleClick}
      type="button"
      className="w-full text-white"
    >
      {loading ? (
        <LoaderBtn loadertext="Signing Out ..." />
      ) : (
        <>
          <Power />
          Sign Out
        </>
      )}
    </Button>
  );
};

export default SignOutBtn;
