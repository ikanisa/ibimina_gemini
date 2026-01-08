export function requireEnv(name: string): string {
    const v = (import.meta as any).env?.[name];
    if (!v || typeof v !== "string" || !v.trim()) {
        throw new Error(`Missing required env: ${name}`);
    }
    return v.trim();
}

export function getOptionalEnv(name: string, fallback = ""): string {
    const v = (import.meta as any).env?.[name];
    return (typeof v === "string" && v.trim()) ? v.trim() : fallback;
}
