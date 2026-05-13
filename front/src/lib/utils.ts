import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 1. 定义一个全局变量存储动态获取的 BaseURL，默认给个保底值
let globalTmdbBaseUrl = 'https://image.tmdb.org/t/p/';

// 2. 提供一个注入方法
export function setTmdbBaseUrl(url: string) {
    if (url) {
        globalTmdbBaseUrl = url;
        console.log("TMDB 动态 BaseURL 已更新为:", globalTmdbBaseUrl);
    }
}

/**
 * 拼接完整的 TMDB 图片地址
 * 采用全局动态 BaseURL + 国内网络防屏蔽代理
 */
export function getTmdbImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) {
        return '/default-movie-poster.png';
    }

    // 动态拼接：BaseURL + 尺寸 + 路径
    let fullUrl = `${globalTmdbBaseUrl}${size}${path}`;

    // wsrv.nl 的代理
    // 需要把 https:// 头部去掉再交给代理服务
    const urlWithoutProtocol = fullUrl.replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${urlWithoutProtocol}`;
}