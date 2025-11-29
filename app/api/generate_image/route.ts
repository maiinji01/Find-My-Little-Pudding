// app/api/generate_image/route.ts
import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

export async function POST(req: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = body?.prompt as string | undefined;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    };

    const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini API error:", res.status, data);
      return NextResponse.json(
        { error: data.error?.message || "Gemini API request failed." },
        { status: res.status }
      );
    }

    const partWithImage =
      data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    const base64Data = partWithImage?.inlineData?.data;

    if (!base64Data) {
      return NextResponse.json(
        { error: "No image data returned from Gemini." },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageBase64: base64Data }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in /api/generate_image:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
