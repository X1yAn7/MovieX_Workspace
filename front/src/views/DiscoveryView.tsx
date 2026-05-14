import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Grid, List, Star, Film, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DashboardData, MovieInfo, PageResult } from '../types';
import { cn, getTmdbImageSources } from '../lib/utils';
import { MovieService } from '../services/api';

interface DiscoveryViewProps {
    data: DashboardData;
}

function formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
}

const PosterImage: React.FC<{ path: string | null; alt: string; className?: string }> = ({ path, alt, className }) => {
    const sources = [...getTmdbImageSources(path, 'w300'), '/default-movie-poster.png'];
    const [sourceIndex, setSourceIndex] = useState(0);

    return (
        <img
            src={sources[sourceIndex]}
            alt={alt}
            className={className}
            onError={() => {
                if (sourceIndex < sources.length - 1) {
                    setSourceIndex(prev => prev + 1);
                }
            }}
        />
    );
};

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ data }) => {
    const [movies, setMovies] = useState<MovieInfo[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(18);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeGenre, setActiveGenre] = useState('全部');
    const [isLoading, setIsLoading] = useState(false);
    const [isCountLoading, setIsCountLoading] = useState(false);

    const genreOptions = ['全部', ...data.genres.slice(0, 12).map(g => g.genreName)];

    // 1. 独立防抖拉取：列表数据（受所有条件+页码驱动）
    useEffect(() => {
        const handler = setTimeout(async () => {
            try {
                setIsLoading(true);
                const result: PageResult<MovieInfo> = await MovieService.searchMovies({
                    title: searchQuery || undefined,
                    genre: activeGenre === '全部' ? undefined : activeGenre,
                    page: currentPage,
                    pageSize: pageSize,
                    orderBy: 'revenue',
                    orderDir: 'DESC',
                    skipCount: true // 核心指令：跳过耗时的 Count
                });
                setMovies(result.records);
            } catch (error) {
                console.error('Failed to fetch movies:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery, activeGenre, currentPage, pageSize]);

    // 2. 独立防抖拉取：总数统计（仅受过滤条件驱动，与页码无关）
    useEffect(() => {
        const handler = setTimeout(async () => {
            try {
                setIsCountLoading(true);
                const totalCount = await MovieService.searchMoviesCount({
                    title: searchQuery || undefined,
                    genre: activeGenre === '全部' ? undefined : activeGenre
                });
                setTotal(totalCount);
            } catch (error) {
                console.error('Failed to fetch count:', error);
            } finally {
                setIsCountLoading(false);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery, activeGenre]);

    // 3. 当搜索条件改变时，自动重置页码回第一页
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeGenre]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-10 pb-20"
        >
            <div className="bg-white glass border border-natural-border shadow-soft rounded-[48px] p-10 flex flex-col gap-8">
                <div className="flex gap-10 items-start">
                    <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] w-24 pt-2 shrink-0 opacity-40">
                        电影类型
                    </span>
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                        {genreOptions.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setActiveGenre(opt)}
                                className={cn(
                                    "text-[12px] font-bold py-1.5 transition-all whitespace-nowrap relative",
                                    activeGenre === opt ? "text-natural-primary" : "text-natural-muted hover:text-natural-primary"
                                )}
                            >
                                {opt}
                                {activeGenre === opt && (
                                    <motion.div
                                        layoutId="genre-indicator"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-natural-primary rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
                    <div>
                        <h2 className="font-serif text-4xl italic font-light text-natural-primary leading-none">影片库探索</h2>
                        <div className="flex items-center gap-3 mt-4">
                            <p className="text-[11px] text-natural-muted font-bold uppercase tracking-[0.2em] opacity-60">
                                共发现 {total.toLocaleString()} 部相关影片
                            </p>
                            {isCountLoading && <Loader2 className="w-3 h-3 text-natural-primary animate-spin opacity-50" />}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center">
                                <Search className="w-5 h-5 text-natural-muted opacity-40" />
                            </div>
                            <input
                                type="text"
                                placeholder="键入影片名称开始搜索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 pr-8 py-4 bg-natural-sidebar/30 rounded-full text-xs text-natural-text border border-natural-border focus:border-natural-primary focus:bg-white outline-none transition-all w-80 shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-10 bg-natural-bg/50 backdrop-blur-sm rounded-[32px]"
                            >
                                <Loader2 className="w-10 h-10 text-natural-primary animate-spin" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-10"
                            >
                                {movies.map((movie, i) => (
                                    <motion.div
                                        key={movie.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (i % 6) * 0.05 }}
                                        className="group cursor-pointer flex flex-col"
                                    >
                                        <div className="aspect-[3/4] relative rounded-[32px] overflow-hidden shadow-soft mb-6 border border-natural-border/50 group-hover:border-natural-primary/30 transition-all duration-500">
                                            <PosterImage
                                                path={movie.posterPath}
                                                alt={movie.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                            />

                                            <div className="absolute top-4 right-4">
                                                <div className="px-3 py-1 rounded-full text-[9px] font-black text-white shadow-soft backdrop-blur-md bg-natural-primary/80">
                                                    {movie.voteAverage.toFixed(1)}
                                                </div>
                                            </div>

                                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-natural-primary/90 via-natural-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end">
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                                                    {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
                                                </span>
                                                <span className="text-xs font-bold text-white/90 truncate block">
                                                    票房 {formatCurrency(movie.revenue)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 px-2">
                                            <h4 className="text-sm font-bold text-natural-text group-hover:text-natural-primary transition-colors truncate">
                                                {movie.title}
                                            </h4>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-natural-muted font-medium truncate flex-1 mr-2">
                                                    {movie.genres}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-10">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="w-12 h-12 rounded-full border border-natural-border flex items-center justify-center text-natural-primary hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="font-serif italic text-lg text-natural-primary">{currentPage}</span>
                            <span className="text-natural-muted font-bold text-[10px] uppercase tracking-widest mx-2">OF</span>
                            {isCountLoading ? (
                                <Loader2 className="w-4 h-4 text-natural-primary animate-spin mx-1" />
                            ) : (
                                <span className="font-serif italic text-lg text-natural-primary">{totalPages}</span>
                            )}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || isLoading}
                            className="w-12 h-12 rounded-full border border-natural-border flex items-center justify-center text-natural-primary hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DiscoveryView;