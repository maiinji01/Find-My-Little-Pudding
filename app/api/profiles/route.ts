// app/api/profiles/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

type MatchRequestBody = {
  nickname: string;
  instagramId?: string | null;
  gender: "male" | "female";
  lovePriority: string;
  dateFrequency: string;
  conflictStyle: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MatchRequestBody;

    // 1) 프로필 DB 저장
    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        nickname: body.nickname,
        instagram_id: body.instagramId ?? null,
        gender: body.gender,
        love_priority: body.lovePriority,
        date_frequency: body.dateFrequency,
        conflict_style: body.conflictStyle,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    // 2) 이상형 성별
    const targetGender = body.gender === "male" ? "female" : "male";

    // 3) DB에서 후보 불러오기
    const { data: candidates, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("gender", targetGender);

    if (selectError || !candidates) {
      console.error("Select error:", selectError);
      return NextResponse.json(
        { error: "Failed to fetch candidates" },
        { status: 500 }
      );
    }

    // 4) 점수 계산 → 상위 3명
    const scored = candidates
      .filter((p) => p.id !== inserted.id)
      .map((p) => {
        let score = 0;
        if (p.love_priority === body.lovePriority) score += 3;
        if (p.date_frequency === body.dateFrequency) score += 2;
        if (p.conflict_style === body.conflictStyle) score += 1;
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const idealMatches = scored.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      puddingName: "Mystery Pudding Partner 💞🍮",
      gender: p.gender,
      lovePriority: p.love_priority,
      dateFrequency: p.date_frequency,
      conflictStyle: p.conflict_style,
      shareInstagram: !!p.instagram_id,
      instagramId: p.instagram_id,
    }));

    return NextResponse.json({ idealMatches });
  } catch (err) {
    console.error("profiles API error:", err);
    return NextResponse.json(
      { error: "Server error in profiles API" },
      { status: 500 }
    );
  }
}
