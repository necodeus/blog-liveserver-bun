declare module 'cookie' {
    export function parse(cookie: string): {
        [key: string]: string
    };
    export function serialize(key: string, value: string): string;
}
