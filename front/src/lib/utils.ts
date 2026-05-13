import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * 更加健壮的 TMDB 图片加载器
 * 增加支持：原图访问、自动占位、CDN 代理
 */
export function getTmdbImageUrl(
    path: string | null | undefined,
    size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
    // 1. 处理空路径：直接返回本地 public 文件夹下的占位图
    if (!path || path === 'null' || path === '') {
        return '/default-movie-poster.png';
    }

    // 2. 清理路径：确保路径以 / 开头
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // 3. 构建 URL：使用 wsrv.nl 代理绕过国内网络封锁
    // 如果你有 API Key，可以直接请求 https://api.themoviedb.org/3/configuration 获取最新的 BaseURL
    const tmdbUrl = `image.tmdb.org/t/p/${size}${cleanPath}`;

    return `https://wsrv.nl/?url=${tmdbUrl}&af&il`; // 增加优化参数：自适应格式、渐进式加载
}