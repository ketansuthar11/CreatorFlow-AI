export const parseGroqResponse = (
    response: string
) => {
    try {
        return JSON.parse(response);
    } catch {
        return null;
    }
};