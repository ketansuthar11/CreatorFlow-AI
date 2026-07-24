export const cleanTitle = (
    filePath: string
) => {
    const fileName =
        filePath
            .split("\\")
            .pop()
            ?.replace(/\.[^/.]+$/, "") || "";

    return fileName
        .replace(/#\S+/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};