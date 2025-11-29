import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=" +
      process.env.GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a cute pudding mascot character.
                Soft pastel tone, round shape, kawaii style.
                Theme: ${prompt}.
                Make the design adorable and expressive.`
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  const base64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  return NextResponse.json({
    url: `data:image/png;base64,${base64}`,
  });
}
