import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Grid, List, Star, Film, ChevronLeft, ChevronRight, Loader2, X, Calendar, Filter } from 'lucide-react';
import { DashboardData, MovieInfo, PageResult, MovieSearchParams } from '../types';
import { cn } from '../lib/utils';
import { MovieService } from '../services/api';
import MoviePoster from '../components/MoviePoster';

interface DiscoveryViewProps {
    data: DashboardData;
    onSelectMovie?: (movie: MovieInfo) => void;
}

function formatCurrency(value: number): string {
    if (!value) return '$0';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ data, onSelectMovie }) => {
    const [movies, setMovies] = useState<MovieInfo[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(18);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeGenre, setActiveGenre] = useState('全部');
    const [isLoading, setIsLoading] = useState(false);
    const [isCountLoading, setIsCountLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);
    const [filters, setFilters] = useState({
        minRating: '' as string | undefined,
        maxRating: '' as string | undefined,
        minYear: '' as string | undefined,
        maxYear: '' as string | undefined,
        minBudget: '' as string | undefined,
        maxBudget: '' as string | undefined,
        orderBy: 'revenue' as string,
        orderDir: 'DESC' as 'ASC' | 'DESC'
    });

    if (!data) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-natural-muted">
                正在加载探索数据...
            </div>
        );
    }

    const genreOptions = ['全部', ...(data?.genres?.slice(0, 12).map(g => g.genreName) ?? [])];

    // 构建搜索参数
    const buildSearchParams = (skipCount?: boolean): MovieSearchParams => {
        return {
            title: searchQuery || undefined,
            genre: activeGenre === '全部' ? undefined : activeGenre,
            minRating: filters.minRating !== undefined && filters.minRating !== '' ? parseFloat(filters.minRating) : undefined,
            maxRating: filters.maxRating !== undefined && filters.maxRating !== '' ? parseFloat(filters.maxRating) : undefined,
            year: filters.minYear !== undefined && filters.minYear !== '' ? parseInt(filters.minYear) : undefined,
            minBudget: filters.minBudget !== undefined && filters.minBudget !== '' ? parseFloat(filters.minBudget) * 1_000_000 : undefined,
            maxBudget: filters.maxBudget !== undefined && filters.maxBudget !== '' ? parseFloat(filters.maxBudget) * 1_000_000 : undefined,
            orderBy: filters.orderBy || 'revenue',
            orderDir: filters.orderDir || 'DESC',
            page: currentPage,
            pageSize: pageSize,
            skipCount
        };
    };

    // 1. 独立防抖拉取：列表数据（受所有条件+页码驱动）
    useEffect(() => {
        const handler = setTimeout(async () => {
            try {
                setIsLoading(true);
                const params = buildSearchParams(true);
                const result: PageResult<MovieInfo> = await MovieService.searchMovies(params);
                setMovies(result.records);
            } catch (error) {
                console.error('Failed to fetch movies:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery, activeGenre, currentPage, pageSize, filters]);

    // 2. 独立防抖拉取：总数统计（仅受过滤条件驱动，与页码无关）
    useEffect(() => {
        const handler = setTimeout(async () => {
            try {
                setIsCountLoading(true);
                const params = buildSearchParams();
                delete (params as Partial<MovieSearchParams>).page;
                delete (params as Partial<MovieSearchParams>).pageSize;
                delete (params as Partial<MovieSearchParams>).skipCount;
                const totalCount = await MovieService.searchMoviesCount(params);
                setTotal(totalCount);
            } catch (error) {
                console.error('Failed to fetch count:', error);
            } finally {
                setIsCountLoading(false);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery, activeGenre, filters]);

    // 3. 当搜索条件改变时，自动重置页码回第一页
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeGenre, filters]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const handleResetFilters = () => {
        setFilters({
            minRating: undefined,
            maxRating: undefined,
            minYear: undefined,
            maxYear: undefined,
            minBudget: undefined,
            maxBudget: undefined,
            orderBy: 'revenue',
            orderDir: 'DESC'
        });
    };

    const getMovieDetail = async (movieId: number) => {
        try {
            const movie = await MovieService.getMovieDetail(movieId);
            setSelectedMovie(movie);
            onSelectMovie?.(movie);
        } catch (error) {
            console.error('Failed to fetch movie detail:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-10 pb-20"
        >
            {/* 电影类型筛选 */}
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

                {/* 高级筛选 */}
                <div className="flex flex-col gap-6">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-3 text-xs font-bold text-natural-muted hover:text-natural-primary transition-colors self-start"
                    >
                        <Filter className="w-4 h-4" />
                        <span>高级筛选</span>
                        {showFilters && <X className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-4 border-t border-natural-border">
                                    {/* 评分范围 */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">最低评分</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={filters.minRating || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value || undefined }))}
                                            className="w-full px-4 py-3 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">最高评分</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={filters.maxRating || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, maxRating: e.target.value || undefined }))}
                                            className="w-full px-4 py-3 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                            placeholder="10"
                                        />
                                    </div>

                                    {/* 年份范围 */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">起始年份</label>
                                        <input
                                            type="number"
                                            min="1900"
                                            max="2025"
                                            value={filters.minYear || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, minYear: e.target.value || undefined }))}
                                            className="w-full px-4 py-3 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                            placeholder="1900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">结束年份</label>
                                        <input
                                            type="number"
                                            min="1900"
                                            max="2025"
                                            value={filters.maxYear || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, maxYear: e.target.value || undefined }))}
                                            className="w-full px-4 py-3 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                            placeholder="2025"
                                        />
                                    </div>

                                    {/* 预算范围（百万美元） */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">最低预算（$M）</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={filters.minBudget || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, minBudget: e.target.value || undefined }))}
                                            className="w-full px-4 py-3 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">最高预算（$M）</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={filters.maxBudget || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: e.target.value || undefined }))}
                                            className="w-full px-4 py-3 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                            placeholder="1000"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-natural-border">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">排序方式</span>
                                        <select
                                            value={filters.orderBy}
                                            onChange={(e) => setFilters(prev => ({ ...prev, orderBy: e.target.value }))}
                                            className="px-4 py-2 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                        >
                                            <option value="revenue">票房收入</option>
                                            <option value="voteAverage">评分</option>
                                            <option value="popularity">人气</option>
                                            <option value="releaseDate">上映日期</option>
                                        </select>
                                        <select
                                            value={filters.orderDir}
                                            onChange={(e) => setFilters(prev => ({ ...prev, orderDir: e.target.value as 'ASC' | 'DESC' }))}
                                            className="px-4 py-2 bg-natural-sidebar/30 rounded-xl text-xs text-natural-text border border-natural-border focus:border-natural-primary outline-none transition-colors"
                                        >
                                            <option value="DESC">降序</option>
                                            <option value="ASC">升序</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleResetFilters}
                                        className="px-6 py-2 text-xs font-bold text-natural-muted hover:text-natural-primary transition-colors"
                                    >
                                        重置筛选
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                        ) : movies.length > 0 ? (
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
                                        onClick={() => getMovieDetail(movie.id)}
                                        className="group cursor-pointer flex flex-col"
                                    >
                                        <div className="aspect-[3/4] relative rounded-[32px] overflow-hidden shadow-soft mb-6 border border-natural-border/50 group-hover:border-natural-primary/30 transition-all duration-500">
                                            <MoviePoster
                                                posterPath={movie.posterPath}
                                                title={movie.title}
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

                                            {/* 点击提示 */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-natural-primary/0 group-hover:bg-natural-primary/10 transition-colors duration-500">
                                                <span className="text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity px-6 py-3 bg-natural-primary/80 rounded-full shadow-soft">
                                                    查看详情
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
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <Film className="w-20 h-20 text-natural-muted/30 mb-6" />
                                <p className="text-lg font-bold text-natural-muted mb-2">未找到相关影片</p>
                                <p className="text-xs text-natural-muted/60">请尝试调整搜索条件</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 电影详情弹窗 */}
                <AnimatePresence>
                    {selectedMovie && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-natural-primary/50 backdrop-blur-sm"
                            onClick={() => setSelectedMovie(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="relative">
                                    {/* 背景图 */}
                                    <div className="h-64 relative overflow-hidden">
                                        {selectedMovie.backdropPath ? (
                                            <img 
                                                src={`https://image.tmdb.org/t/p/w1280${selectedMovie.backdropPath}`} 
                                                alt={selectedMovie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-natural-sidebar" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                                        <button
                                            onClick={() => setSelectedMovie(null)}
                                            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-soft hover:bg-white transition-colors"
                                        >
                                            <X className="w-5 h-5 text-natural-primary" />
                                        </button>
                                    </div>

                                    {/* 内容 */}
                                    <div className="relative px-8 pb-8" style={{ marginTop: '-80px' }}>
                                        <div className="flex gap-8">
                                            {/* 海报 */}
                                            <div className="w-48 h-72 flex-shrink-0 rounded-[24px] overflow-hidden shadow-2xl border-4 border-white">
                                                <MoviePoster
                                                    posterPath={selectedMovie.posterPath}
                                                    title={selectedMovie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* 信息 */}
                                            <div className="flex-1 space-y-6">
                                                <div>
                                                    <h2 className="font-serif text-4xl italic font-light text-natural-primary leading-none">
                                                        {selectedMovie.title}
                                                    </h2>
                                                    {selectedMovie.originalTitle && selectedMovie.originalTitle !== selectedMovie.title && (
                                                        <p className="text-sm text-natural-muted mt-2">
                                                            {selectedMovie.originalTitle}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    <span className="px-4 py-2 bg-natural-sidebar rounded-full text-xs font-bold text-natural-primary">
                                                        {selectedMovie.genres}
                                                    </span>
                                                    <span className="px-4 py-2 bg-natural-secondary/20 rounded-full text-xs font-bold text-natural-secondary flex items-center gap-2">
                                                        <Star className="w-4 h-4 fill-current" />
                                                        {selectedMovie.voteAverage.toFixed(1)}
                                                    </span>
                                                    <span className="px-4 py-2 bg-natural-sidebar rounded-full text-xs font-bold text-natural-muted flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).getFullYear() : 'N/A'}
                                                    </span>
                                                </div>

                                                <p className="text-natural-text leading-relaxed">
                                                    {selectedMovie.overview || '暂无简介'}
                                                </p>

                                                <div className="grid grid-cols-4 gap-6 pt-4 border-t border-natural-border">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">导演</span>
                                                        <span className="text-sm font-bold text-natural-text">{selectedMovie.director || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">编剧</span>
                                                        <span className="text-sm font-bold text-natural-text">{selectedMovie.writers || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">主演</span>
                                                        <span className="text-sm font-bold text-natural-text">{selectedMovie.cast || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">时长</span>
                                                        <span className="text-sm font-bold text-natural-text">{selectedMovie.duration || '-'}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-6 pt-4">
                                                    <div className="bg-natural-sidebar rounded-[20px] p-4">
                                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">预算</span>
                                                        <span className="font-serif text-2xl italic text-natural-primary">{formatCurrency(selectedMovie.budget)}</span>
                                                    </div>
                                                    <div className="bg-natural-sidebar rounded-[20px] p-4">
                                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">票房</span>
                                                        <span className="font-serif text-2xl italic text-natural-secondary">{formatCurrency(selectedMovie.revenue)}</span>
                                                    </div>
                                                    <div className="bg-natural-sidebar rounded-[20px] p-4">
                                                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">ROI</span>
                                                        {selectedMovie.roi != null ? (
                                                            <span className="font-serif text-2xl italic text-natural-accent">
                                                                {selectedMovie.roi.toFixed(2)}x
                                                            </span>
                                                        ) : (
                                                            <span className="font-serif text-xl italic text-natural-muted">无</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedMovie.profit != null && selectedMovie.profit !== 0 && (
                                                    <div className="pt-4">
                                                        <div className={selectedMovie.profit > 0 ? "bg-emerald-50 rounded-[20px] p-4" : "bg-red-50 rounded-[20px] p-4"}>
                                                            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">净利润</span>
                                                            <span className={`font-serif text-2xl italic ${selectedMovie.profit > 0 ? "text-emerald-700" : "text-red-600"}`}>
                                                                {selectedMovie.profit > 0 ? '+' : ''}{formatCurrency(selectedMovie.profit)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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