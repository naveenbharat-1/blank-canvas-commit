import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { videoUrl, lessonTitle, lessonId } = await req.json();

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract YouTube ID for context
    let youtubeId = "";
    if (videoUrl) {
      const m = videoUrl.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([^&\n?#]+)/
      );
      if (m) youtubeId = m[1];
    }

    const prompt = `You are an expert educational content summarizer for Naveen Bharat coaching platform.

Summarize this lecture in a structured, student-friendly format:

**Lecture Title:** ${lessonTitle || "Unknown"}
**Video ID:** ${youtubeId || "N/A"}
**Video URL:** ${videoUrl || "N/A"}

Generate a comprehensive summary with:
1. **📋 Key Topics Covered** — List main topics as bullet points
2. **📝 Important Concepts** — Explain 3-5 key concepts briefly
3. **💡 Memory Tips** — Include 1-2 mnemonics or memory tricks
4. **🎯 Quick Revision Points** — 5-7 one-liner revision points
5. **❓ Possible Exam Questions** — 2-3 questions that could be asked from this topic

Use Hindi/Hinglish where appropriate for Indian students. Use emojis for visual appeal.
Keep the response concise but informative (under 500 words).`;

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are Naveen Sarthi, the AI learning companion for Naveen Bharat. Summarize lectures clearly for Indian students preparing for NEET/JEE/Board exams." },
            { role: "user", content: prompt },
          ],
          max_tokens: 1200,
          temperature: 0.5,
        }),
      }
    );

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limited. Try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      throw new Error(`AI API error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const summary =
      aiData.choices?.[0]?.message?.content ||
      "Could not generate summary. Please try again.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
