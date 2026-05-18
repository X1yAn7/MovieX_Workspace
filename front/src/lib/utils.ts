import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const normalizeTmdbFilePath = (path: string): string => {
    const p = path.trim();
    if (!p || p === 'null') return '';
    if (p.startsWith('http://') || p.startsWith('https://')) {
        try {
            const u = new URL(p);
            if (u.hostname.includes('tmdb.org') || u.hostname.includes('b-cdn.net')) {
                const idx = u.pathname.indexOf('/t/p/');
                if (idx >= 0) {
                    const after = u.pathname.slice(idx + '/t/p/'.length);
                    const slash = after.indexOf('/');
                    if (slash >= 0) {
                        const file = after.slice(slash);
                        return file.startsWith('/') ? file : `/${file}`;
                    }
                }
            }
        } catch {
            /* ignore */
        }
    }
    return p.startsWith('/') ? p : `/${p}`;
};

export function getTmdbImageSources(path: string | null | undefined, size: string = 'w500'): string[] {
    if (!path || path === 'null') {
        return ['/default-movie-poster.png'];
    }

    const cleanPath = normalizeTmdbFilePath(String(path));
    if (!cleanPath) {
        return ['/default-movie-poster.png'];
    }

    return [
        `https://tmdb-image-prod.b-cdn.net/t/p/${size}${cleanPath}`,
        `https://image.tmdb.org/t/p/${size}${cleanPath}`,
        `/tmdb-proxy/t/p/${size}${cleanPath}`,
    ];
}