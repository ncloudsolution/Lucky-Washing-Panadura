"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  BasicDataFetch,
  //   formatDate,
} from "@/utils/common/index";
import { Label } from "@/components/ui/label";
// import DateBox from "../cards/DateBox";
// import { FormDialog } from "../forms/formElements/dialogs/FormDialog";
import { Lock, Pencil } from "lucide-react";
import SignOutBtn from "@/components/custom/buttons/SignOutBtn";
import { posFrontend } from "@/data/frontendRoutes";
import { User } from "next-auth";
import { TipWrapper } from "../wrapper/TipWrapper";
// import EditProfileForm from "../forms/fullForms/EditProfileForm";

// import PasswordResetForm from "../forms/fullForms/authForms/PasswordResetForm";

export type Profile = {
  name: string;
  authId: string;
  createdAt: string;
  redirectTo: "core" | "portal";
} & ({ email: string; mobile?: never } | { mobile: string; email?: never });

export function ProfileBtn({ user }: { user: User }) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  //   const isMerchant = session?.user.role === "merchant";
  //   console.log(isMerchant, "ismerch");
  //   const {
  //     data: profile,
  //     isLoading,
  //     error,
  //   } = useQuery({
  //     queryKey: ["profile"],
  //     queryFn: () => {
  //       const identifier = session?.user.email
  //         ? session?.user.email
  //         : session?.user.mobile;

  //       return BasicDataFetch({
  //         method: "GET",
  //         endpoint: isMerchant
  //           ? `/api/merchant/profile?authid=${session?.user.authId}`
  //           : `/api/masters/profile?identifier=${identifier}`,
  //       });
  //     },
  //     enabled: popoverOpen, // only run once popover clicked
  //     select: (response) => response?.data as Profile,
  //     staleTime: 1000 * 60 * 5,
  //   });

  //   console.log(profile, "my profile");
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <TipWrapper triggerText="Profile">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="cursor-pointer flex items-center justify-center leading-none size-[34px] md:size-[42px] rounded-full bg-secondary  border-2 border-white shadow-md"
          >
            {user?.name?.trim()?.[0]?.toUpperCase()}
          </Button>
        </PopoverTrigger>
      </TipWrapper>
      <PopoverContent className="xs:w-80 w-70" align="end">
        <div className="grid gap-5">
          <div className="space-y-1">
            <h4 className="font-medium text-[18px] leading-none">
              Profile Details
            </h4>
            <p className="text-sm text-muted-foreground">
              Populated from your last update.
            </p>
          </div>
          {/* 
          {!isLoading && profile ? (
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4 ">
                <Label>Name</Label>
                <div className="col-span-2  w-full rounded-sm flex items-center text-sm text-muted-foreground">
                  {profile.name}
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>{profile.email ? "Email" : "Mobile"} </Label>
                <div className="col-span-2  w-full rounded-sm flex items-center text-sm text-muted-foreground">
                  {profile.email ? profile.email : profile.mobile}
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                {isMerchant ? (
                  <>
                    <Label>Auth Id</Label>
                    <div className="col-span-2  w-full rounded-sm flex items-center text-sm text-muted-foreground">
                      {profile.authId}
                    </div>
                  </>
                ) : (
                  <>
                    <Label>Role</Label>
                    <div className="col-span-2  w-full rounded-sm flex items-center text-sm text-muted-foreground">
                      {session?.user.role}
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Created At</Label>
                <div className="col-span-2  w-full rounded-sm flex items-center text-sm">
                  <DateBox model={profile} />
                </div>
              </div>
              <FormDialog
                miniScreenTextHide={false}
                triggerText="Reset Password"
                editmodeClassName="mt-2
                 text-white bg-black/75 hover:bg-black dark:text-black hover:dark:bg-white dark:bg-white/75 relative h-10 mt-2 p-0 rounded-sm duration-500 transition-all hover:shadow-2xl w-full"
                btnIcon={
                  <Lock
                    size={28}
                    className="size-[30px] text-white dark:text-black"
                  />
                }
                form={
                  <PasswordResetForm
                    credentialData={
                      profile.email ? profile.email : (profile.mobile as string)
                    }
                    role={session?.user.role as string}
                  />
                }
              />
             
              <FormDialog
                miniScreenTextHide={false}
                triggerText="Edit Details"
                editmodeClassName="text-white relative h-10 p-0 bg-primary rounded-sm duration-500 transition-all hover:shadow-2xl w-full"
                btnIcon={
                  <Pencil size={28} className="size-[30px] text-white" />
                }
                form={
                  <EditProfileForm
                    dataBundle={{
                      oldName: profile.name,
                      isMerchant: isMerchant,
                      provider: profile.email
                        ? (profile.email as string)
                        : (profile.mobile as string),
                    }}
                  />
                }
              />

              <SignOutBtn redirectTo={isMerchant ? "portal" : "core"} />
            </div>
          ) : (
            <DetailsSkeleton />
          )} */}
          <SignOutBtn callbackPath={posFrontend.landing} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DetailsSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid grid-cols-3 items-center">
          <Skeleton className="h-5 w-[70px] rounded-sm" />
          <Skeleton className="col-span-2 h-5 w-full rounded-sm" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-sm mt-2" />
      <Skeleton className="h-10 w-full rounded-sm mt-2" />
    </div>
  );
}
