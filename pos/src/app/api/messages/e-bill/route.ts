import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

export const POST = async (req: NextRequest) => {
  const { customerName, customerMobile, businessName, ebillLink } =
    await req.json();

  const user_id = process.env.NOTIFY_SMS_USER_ID;
  const api_key = process.env.NOTIFY_SMS_API_KEY;
  const sender_id = process.env.NOTIFY_SMS_SENDER_ID;

  const message = `Hello ${customerName}, thank you for choosing ${businessName}. You can access your e-bill here: ${ebillLink}`;

  const mainUrl = `https://app.notify.lk/api/v1/send`;
  const urlWithParam = `${mainUrl}?user_id=${user_id}&api_key=${api_key}&sender_id=${sender_id}&to=${customerMobile}&message=${message}&contact_fname=${customerName}`;

  try {
    const response = await axios.post(urlWithParam);
    if (response.data.status === "success") {
      return NextResponse.json(
        { message: "Message sent successfully", data: response.data },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Request failed", data: response.data },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AxiosError) {
      return NextResponse.json(
        { message: error.response?.data || "Something went wrong" },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: `Unexpected error: ${error}` },
        { status: 500 }
      );
    }
  }
};
