import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { StaffLoginSchema } from "@/utils/validations/company";
import { backendDataValidation } from "@/utils/common";
import { reversedHashing } from "@/utils/hashing";
import prisma from "@/prisma/client";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        mobile: {
          type: "text",
          label: "Mobile",
          placeholder: "7XXXXXXXX",
        },
        pin: {
          type: "password",
          label: "Pin",
          placeholder: "****",
        },
      },
      authorize: async (credentials) => {
        if (!credentials?.mobile || !credentials?.pin) {
          throw new Error("Mobile and Pin number are required.");
        }

        const mobile = credentials.mobile as string;
        const pin = credentials.pin as string;

        const data = { mobile, pin };

        // Backend validation
        const { validationStatus } = backendDataValidation({
          schema: StaffLoginSchema,
          data,
        });

        if (!validationStatus) {
          throw new Error("Validation failed");
        }

        // Prisma query to find user
        const user = await prisma.staff.findUnique({
          where: { mobile },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Verify pin (assuming you have a password/pin field)
        const isMatch = await reversedHashing(pin, user.pin); // Make sure user has a 'pin' field
        if (!isMatch) {
          throw new Error("Invalid credentials.");
        }

        return user;
      },
    }),
  ],

  pages: {
    // signIn: "/core", // Your login page path
  },
  session: {
    strategy: "jwt",
    //  maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branch = user.branch;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.branch = token.branch;
      }
      return session;
    },
  },
});
