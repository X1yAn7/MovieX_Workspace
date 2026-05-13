import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * 拼接完整的 TMDB 图片地址
 * @param path 数据库中保存的相对路径
 * @param size 图片尺寸，默认为 w500 (常用尺寸: w200, w300, w400, w500, original)
 */
export function getTmdbImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) {
        // 如果数据库里没有海报，可以返回一个本地 public 目录下的默认占位图
        return '/default-movie-poster.png';
    }
    return `https://image.tmdb.org/t/p/${size}${path}`;
}