import path from "path";
import { mkdir } from "fs/promises";

import { downloadVideo } from "./downloadVideo";
import { rewriteTitle } from "./rewriteTitle";
import { processVideo } from "./processVideo";

import { cleanTitle } from "@/utils/cleanTitle";
import { generateTitleImage } from "@/utils/generateTitleImage";
import { generateMetadata } from "./generateMetadata";

export const processUrl = async (
    url: string,
    onProgress?: (message: string) => Promise<void>
) => {
    // Download
    console.log("1️⃣ Downloading...");
    await onProgress?.("⬇️ Downloading...");
    const filePath = await downloadVideo(url);
    console.log("✅ Downloaded:", filePath);
    console.log("2️⃣ Cleaning title...");

    // Clean filename
    const cleanedTitle =
        cleanTitle(filePath);
    console.log("✅", cleanedTitle);
    console.log("3️⃣ Rewriting...");
    await onProgress?.("🤖 Generating Metadata...");
    // Rewrite
    const metadata =
        await generateMetadata(
            cleanedTitle
        );

    console.log("✅ AI Response:", metadata);

    console.log("4️⃣ Generating image...");
    await onProgress?.("🖼️ Creating Title Image...");
    await generateTitleImage(
        metadata.imageTitle,
        metadata.greenWords,
        metadata.redWords
    );
    console.log("✅ Image Generated");

    // Processed folder
    const processedDir =
        path.join(
            process.cwd(),
            "processed"
        );

    await mkdir(processedDir, {
        recursive: true,
    });

    const outputPath =
        path.join(
            processedDir,
            `processed-${Date.now()}.mp4`
        );
    console.log("5️⃣ Processing video...");
    await onProgress?.("🎬 Processing Video...");
    // Process video
    await processVideo(
        filePath,
        outputPath
    );
    console.log("✅ Video Processed");
    await onProgress?.("⬆️ Uploading to YouTube...");
    return {
        outputPath,
        originalTitle: cleanedTitle,
        metadata,
    };
};