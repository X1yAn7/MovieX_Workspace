import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const getCleanPath = (path: string) => path.startsWith('/') ? path : `/${path}`;

export function getTmdbImageSources(path: string | null | undefined, size: string = 'w500'): string[] {
    if (!path || path === 'null') {
        return ['/default-movie-poster.png'];
    }

    const cleanPath = getCleanPath(path);

    return [

        `/tmdb-proxy/t/p/${size}${cleanPath}`,

        `https://tmdb-image-prod.b-cdn.net/t/p/${size}${cleanPath}`,

        `https://image.tmdb.org/t/p/${size}${cleanPath}`
    ];
}