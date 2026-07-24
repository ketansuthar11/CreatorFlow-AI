import { createCanvas } from "canvas";
import fs from "fs";

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

    // total width calculate
    let totalWidth = 0;

    words.forEach((word) => {
        totalWidth += ctx.measureText(
            word + " "
        ).width;
    });

    // center start point
    let x =
        (canvas.width - totalWidth) / 2;

    const y = 120;

    words.forEach((word) => {
        const cleanWord = word.replace(
            /[^a-zA-Z0-9$]/g,
            ""
        );

        let color = "white";

        if (
            greenWords.some(
                (w) =>
                    w.toLowerCase() ===
                    cleanWord.toLowerCase()
            )
        ) {
            color = "#00ff00";
        }

        if (
            redWords.some(
                (w) =>
                    w.toLowerCase() ===
                    cleanWord.toLowerCase()
            )
        ) {
            color = "#ff0000";
        }

        ctx.fillStyle = color;

        ctx.fillText(
            word + " ",
            x,
            y
        );

        x += ctx.measureText(
            word + " "
        ).width;
    });

    fs.writeFileSync(
        "generated/title.png",
        canvas.toBuffer("image/png")
    );
}