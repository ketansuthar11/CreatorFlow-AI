import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

export const downloadVideo = async (
    url: string
) => {
    const downloadDir = path.join(
        process.cwd(),
        "downloads"
    );

    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, {
            recursive: true,
        });
    }

    const outputTemplate = path.join(
        downloadDir,
        "%(title)s.%(ext)s"
    );

    const ytDlpPath = path.join(
        process.cwd(),
        "bin",
        "yt-dlp.exe"
    );

    console.log("Using:", ytDlpPath);

    const { stdout, stderr } =
        await execFileAsync(
            ytDlpPath,
            [
                url,
                "-o",
                outputTemplate
            ]
        );

    console.log(stdout);
    console.log(stderr);

    const files =
        fs.readdirSync(downloadDir);

    const latestFile = files
        .map((file) => ({
            file,
            time: fs.statSync(
                path.join(
                    downloadDir,
                    file
                )
            ).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time)[0];

    return path.join(
        downloadDir,
        latestFile.file
    );
};