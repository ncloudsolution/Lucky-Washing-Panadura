// import { CredentialsSignin } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { posFrontend } from "@/data/frontendRoutes";
import { BaseUrl } from "@/data";

// export const runtime = "nodejs";
export const POST = async function POST(req: NextRequest) {
  const data = await req.json();
  const { mobile, pin } = data;

  if (!mobile || !pin) {
    return NextResponse.json(
      { message: "One or more credentials misssing" },
      { status: 400 }
    );
    //   throw new CredentialsSignin("One or more credentials misssing");
  }
  try {
    await signIn("credentials", {
      redirect: false,
      mobile,
      pin,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully logged in",
        data: { redirectUrl: posFrontend.pos },
      },

      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const errcause = error.cause as { err?: { message?: string } };
      const errmsg = errcause?.err?.message;

      const definedErrors = [
        "Mobile and Pin number are required.",
        "Validation failed",
        "User not found",
        "Invalid credentials.",
      ];
      const finalErrmsg = definedErrors.some((err) => err == errmsg)
        ? errmsg
        : "Something wrong with your connection";

      return NextResponse.json(
        {
          success: false,
          message: finalErrmsg,
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
};
