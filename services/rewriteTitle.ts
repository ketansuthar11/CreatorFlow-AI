import { groq } from "@/lib/groq";

export const rewriteTitle = async (
    originalTitle: string
) => {
    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `
You are a YouTube Shorts viral title expert.

Your job is to rewrite titles into emotional,
story-driven, curiosity-inducing titles.

Examples:

A Son's Revenge for His Father
The Ending Nobody Expected
One Decision Changed Everything
He Waited Years For This Revenge
The Dream Car Nobody Can Afford
Driving This Car Feels Unreal

Rules:

- Maximum 6 words
- Create curiosity
- Create emotion
- No clickbait spam
- Pick 1 green word
- Pick 1 red word

Return ONLY JSON:

{
  "title": "",
  "greenWords": [],
  "redWords": []
}
`,
            },
            {
                role: "user",
                content: originalTitle,
            },
        ],
    });

    return response.choices[0].message.content;
};