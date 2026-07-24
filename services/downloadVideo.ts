import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import ytDlp from "yt-dlp-exec";

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

    const isWindows = process.platform === "win32";
    const { stdout, stderr } = isWindows
        ? await execFileAsync(
            path.join(process.cwd(), "bin", "yt-dlp.exe"),
            [url, "-o", outputTemplate]
        )
        : await ytDlp.exec(url, {
            output: outputTemplate,
            noPlaylist: true,
        });

    console.log(`Using ${isWindows ? "the Windows" : "the Linux"} yt-dlp binary.`);

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
