import { Response } from 'express';

export type CacheControl = {
    // cacheability options
    public?: boolean,
    noStore?: boolean,

    // expiration options
    maxAge?: number, // seconds
    sMaxAge?: number,
    mustRevalidate?: boolean,
}

export function setCacheControl(res: Response, options: CacheControl): void {
    const directive = makeDirective(options);
    if(directive) {
        res.set('Cache-Control', directive);
    } else {
        console.error('Cache-Control headers were configured but could not be set.');
    }
}

const optionToName: Record<string, string> = {
    public: 'public',
    noStore: 'no-store',
    maxAge: 'max-age',
    sMaxAge: 's-maxage',
    mustRevalidate: 'must-revalidate',
};

const validCacheability: Array<keyof CacheControl> = ['public', 'noStore'];
const validDirectives: Array<keyof CacheControl> = ['maxAge', 'sMaxAge', 'mustRevalidate'];

export function makeDirective(options: CacheControl): string | undefined {
    const keys = Object.keys(options);
    const cacheability = validCacheability.filter((opt) => keys.includes(opt));
    const isValid = cacheability.length === 1;
    if (!isValid) return;

    // public, private, no-cache, or no-store
    const cacheSetting = optionToName[cacheability[0]];

    const directives = validDirectives.filter((opt) => keys.includes(opt))
        .map((directive: keyof CacheControl) => {
            const name = optionToName[directive];
            const value = options[directive];

            // satisfy typescript
            if (value == null) return;

            // directives like must-revalidate have no value
            if (value === true) {
                return `${name}`;
            }

            return `${name}=${value.toString()}`;
        }).filter(d => d != null);
    
    // public, max-age=60, another-one=20
    return `${cacheSetting}${directives.length ? ['', ...directives].join(', ') : ''}`;
}