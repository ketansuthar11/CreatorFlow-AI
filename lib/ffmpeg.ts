import ffmpeg from "fluent-ffmpeg";

const ffmpegPath =
    process.platform === "win32"
        ? "C:/ffmpeg/ffmpeg-8.0.1-essentials_build/bin/ffmpeg.exe"
        : "ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath);
export default ffmpeg;