// app/api/save_image/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 반드시 service role
);

export async function POST(req: Request) {
  try {
    const { profileId, base64 } = await req.json();

    if (!profileId || !base64) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // base64 → binary 변환
    const imageBuffer = Buffer.from(base64, "base64");

    const fileName = `puddings/${profileId}.png`;

    // Storage 업로드
    const { error: uploadError } = await supabase.storage
      .from("puddings")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Public URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("puddings").getPublicUrl(fileName);

    // DB 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ pudding_image_url: publicUrl })
      .eq("id", profileId);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { error: "DB update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
