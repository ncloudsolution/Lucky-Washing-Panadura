import React, { Suspense } from "react";
import { hasPermission, T_Permission, T_Role } from "@/data/permissions";

const ViewAccessChecker = ({
  userRole,
  permission,
  resourceBranch,
  userBranch,
  component,
  skeleton = <div />,
}: {
  userRole: T_Role | undefined;
  permission: T_Permission;
  resourceBranch?: string;
  userBranch?: string;
  component: React.ReactNode;
  skeleton?: React.ReactNode;
}) => {
  // 1️⃣ Determine if we have enough data to check permission
  const isReady = userRole !== undefined; // add other conditions if needed

  if (!isReady) {
    // show skeleton while userRole / data is loading
    return <>{skeleton}</>;
  }

  const access = hasPermission({
    userRole,
    permission,
    resourceBranch,
    userBranch,
  });

  if (!access) {
    // no access → render nothing
    return null;
  }

  return <Suspense fallback={skeleton}>{component}</Suspense>;
};

export default ViewAccessChecker;

//make unauthorize content div

// import { hasPermission, T_Permission, T_Role } from "@/data/permissions";
// import React from "react";

// const ViewAccessChecker = ({
//   userRole,
//   permission,
//   resourceBranch,
//   userBranch,
//   component,
//   skeleton = <div />,
// }: {
//   userRole: T_Role | undefined;
//   permission: T_Permission;
//   resourceBranch?: string;
//   userBranch?: string;
//   component: React.ReactNode;
//   skeleton?: React.ReactNode;
// }) => {
//   return (
//     <>
//       {hasPermission({ userRole, permission, resourceBranch, userBranch })
//         ? component
//         : skeleton}
//     </>
//   );
// };

// export default ViewAccessChecker;
