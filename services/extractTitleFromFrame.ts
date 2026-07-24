import fs from "fs";
import { hf } from "@/lib/huggingface";

export const extractTitleFromFrame = async (
    imagePath: string
) => {
    const imageBuffer =
        fs.readFileSync(imagePath);

    const result =
        await hf.chatCompletion({
            provider: "hf-inference",

            model:
                "Qwen/Qwen2.5-VL-7B-Instruct",

            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `
Look at this YouTube Shorts frame.

Find the MAIN title shown in the video.

Ignore:
- watermarks
- subtitles
- usernames
- logos
- channel names

Return ONLY the title text.
Do not explain anything.
                            `,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBuffer.toString(
                                    "base64"
                                )}`,
                            },
                        },
                    ],
                },
            ],
        });

    return (
        result.choices[0].message
            .content || ""
    );
};