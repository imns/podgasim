export function qs(params: { [key: string]: any }): string {
    return Object.keys(params)
        .map((key) => {
            const enkey = encodeURIComponent(key);
            const envalue = encodeURIComponent(params[key]);
            return `${enkey}=${envalue}`;
        })
        .join("&");
}
