import path from "path";
import ffmpeg from "@/lib/ffmpeg";

export const processVideo = async (
    inputPath: string,
    outputPath: string
) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .input(path.join(process.cwd(), "logos", "logo.png"))
            .input(path.join(process.cwd(), "generated", "title.png"))
            .complexFilter([
                "[1:v]scale=130:-1[logo]",
                "[2:v]scale=300:-1[title]",

                "[0:v][logo]overlay=20:150[temp]",
                "[temp][title]overlay=(main_w-overlay_w)/2:60"
            ])
            .output(outputPath)
            .on("start", (command) => {
                console.log("FFmpeg Started");
                console.log(command);
            })
            .on("end", () => {
                console.log("Video Processed");
                resolve(true);
            })
            .on("error", (err) => {
                console.error(err);
                reject(err);
            })
            .run();
    });
};