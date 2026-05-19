import React, { useState } from 'react';

interface MoviePosterProps {
    posterPath?: string | null;
    title: string;
    className?: string;
    /** 小尺寸模式：用于 ROI 排行等列表场景 */
    small?: boolean;
}

function TextPoster({ title, className }: { title: string; className?: string }) {
    // 取首字母大写作为装饰
    const initial = title.charAt(0).toUpperCase();

    return (
        <div className={`flex flex-col items-center justify-center bg-white select-none border border-natural-border/30 ${className || ''}`}>
            {/* 装饰性首字母 */}
            <span className="font-serif italic text-[min(6em,28vw)] leading-none text-natural-border/70 select-none">
                {initial}
            </span>

            {/* 标题 */}
            <span
                className="font-serif italic text-center leading-tight px-3 text-natural-text break-words"
                style={{ fontSize: 'clamp(0.5rem, 0.8vw, 1rem)', maxWidth: '90%' }}
            >
                {title}
            </span>
        </div>
    );
}

export default function MoviePoster({ posterPath, title, className = '', small = false }: MoviePosterProps) {
    const [tryImg, setTryImg] = useState(true);

    const showText = !posterPath || posterPath === 'null' || posterPath === '' || !tryImg;

    if (showText) {
        return <TextPoster title={title} className={className} />;
    }

    const src = posterPath.startsWith('http')
        ? posterPath
        : posterPath.startsWith('/')
            ? `https://image.tmdb.org/t/p/${small ? 'w92' : 'w500'}${posterPath}`
            : posterPath;

    return (
        <img
            src={src}
            alt={title}
            className={className}
            loading="lazy"
            onError={() => setTryImg(false)}
        />
    );
}
