import { SidebarTrigger } from "@/components/ui/sidebar";
import { User } from "next-auth";
import { ProfileBtn } from "../buttons/ProfileBtn";
import ScreenFullBtn from "../buttons/ScreenFullBtn";
import BarcodeSearchBar from "../inputs/BarcodeSearchBar";
import { SDK_VERSION } from "firebase/app";
import SyncBtn from "../buttons/SyncBtn";
import CharactorMapDialog from "../dialogs/CharactorMapDialog";

const TopCard = async ({ user }: { user: User }) => {
  return (
    <div className="flex bg-sidebar border border-sidebar-border justify-between items-center w-full p-4 rounded-md shadow-2xs">
      <div className="flex gap-3 items-center">
        <div className="flex gap-3 items-center w-full">
          <SidebarTrigger />
          {user && (
            <div className="flex bxs:flex-row flex-col md:items-start bxs:items-end items-start md:flex-col md:gap-[2px] bxs:gap-3 gap-[2px]">
              <span className="xl:text-[30px] bxs:text-[20px] text-[16px] xl:leading-[30px] bxs:leading-[20px] leading-[16px] font-bold italic">
                {user.name}
              </span>

              <span className="xl:text-sm bxs:text-[12px] text-[10px] xl:leading-[14px] bxs:leading-[12px] leading-[10px] h-fit italic text-muted-foreground">
                {user.role} Access ({user.branch})
              </span>
            </div>
          )}
        </div>
      </div>
      {/* <BarcodeSearchBar /> */}
      <div className="flex gap-2 items-center">
        <ProfileBtn user={user} />
        <CharactorMapDialog />
        <SyncBtn />
        <ScreenFullBtn />
      </div>

      {/* <div className="flex gap-3 w-fit">
     
        <ThemeTogglerBtn />
       
        <ProfileBtn
          letter={
            user ? (user?.name?.slice(0, 1).toUpperCase() as string) : "#"
          }
        />
      </div> */}
    </div>
  );
};

export default TopCard;
