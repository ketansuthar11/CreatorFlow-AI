import { groq } from "@/lib/groq";

export const generateMetadata = async (
    originalTitle: string
) => {
    const response =
        await groq.chat.completions.create({
            model:
                "llama-3.3-70b-versatile",

            messages: [
                {
                    role: "system",
                    content: `You are an expert YouTube Shorts SEO specialist.

Generate ONLY valid JSON in the following format:

{
  "imageTitle": "",
  "youtubeTitle": "",
  "greenWords": [],
  "redWords": [],
  "description": "",
  "tags": []
}

Rules:

1. imageTitle:
- Maximum 80 characters.
- Emotional and clickable.
- NO hashtags.

2. youtubeTitle:
- Same as imageTitle.
- Add 1-2 relevant hashtags at the end.
- Always include #shorts.
- If it's a movie clip include #movie.

3. greenWords:
- Return an array of words from imageTitle that should be GREEN.
- Usually highlight positive words, names, heroes, important nouns.

4. redWords:
- Return an array of words from imageTitle that should be RED.
- Usually highlight emotional, action, danger, revenge, death, fight, villain or dramatic words.

5. Description:
- Write 2–3 engaging lines.
- End with 3–5 relevant hashtags.

6. Tags:
- Return 8–12 SEO-friendly tags.
Return ONLY valid JSON.
`,
                },
                {
                    role: "user",
                    content:
                        originalTitle,
                },
            ],
        });

    const content =
        response.choices[0].message
            .content;

    if (!content) {
        throw new Error(
            "Metadata generation failed"
        );
    }

    return JSON.parse(content);
};
