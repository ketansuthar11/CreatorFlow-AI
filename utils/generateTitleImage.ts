import { createCanvas } from "canvas";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export async function generateTitleImage(
    title: string,
    greenWords: string[],
    redWords: string[]
) {
    const canvas = createCanvas(1080, 220);
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 1080, 220);
    ctx.font = "bold 58px Arial";

    const words = title.split(" ");

    let totalWidth = 0;

    words.forEach((word) => {
        totalWidth += ctx.measureText(word + " ").width;
    });

    let x = (canvas.width - totalWidth) / 2;
    const y = 120;

    words.forEach((word) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9$]/g, "");

        let color = "white";

        if (greenWords.some((w) => w.toLowerCase() === cleanWord.toLowerCase())) {
            color = "#00ff00";
        }

        if (redWords.some((w) => w.toLowerCase() === cleanWord.toLowerCase())) {
            color = "#ff0000";
        }

        ctx.fillStyle = color;
        ctx.fillText(word + " ", x, y);
        x += ctx.measureText(word + " ").width;
    });

    // Create folder if it doesn't exist
    const outputDir = path.join(process.cwd(), "generated");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(
        outputDir,
        `${randomUUID()}.png`
    );
    console.log("Saved to:", outputPath);
    console.log("Exists:", fs.existsSync(outputPath));
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

    return outputPath;
}