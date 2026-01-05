import NextAuth from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: string; // ✅ add role to the User types
    branch: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      branch: string;
    };
  }
}
