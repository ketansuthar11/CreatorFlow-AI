import ffmpeg from "@/lib/ffmpeg";
import path from "path";

export const extractFrame = (
    videoPath: string,
    outputImagePath: string
) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshots({
                count: 1,
                timemarks: ["1"],
                filename: path.basename(outputImagePath),
                folder: path.dirname(outputImagePath),
            })
            .on("end", () => {
                console.log("Frame Extracted");
                resolve(true);
            })
            .on("error", (err) => {
                console.error("Frame Extraction Error:", err);
                reject(err);
            });
    });
};