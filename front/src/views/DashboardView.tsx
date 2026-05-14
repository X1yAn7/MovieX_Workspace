import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Target, RotateCw, BarChart3, DollarSign, Film, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Pie, PieChart as RePieChart, Cell
} from 'recharts';
import { cn, getTmdbImageSources } from '../lib/utils';
import { DashboardData } from '../types';

interface DashboardViewProps {
    data: DashboardData;
}

const COLORS = ['#4A5D4E', '#A3B18A', '#588157', '#3A5A40', '#DAD7CD', '#D4A373', '#8A8A82', '#6B705C'];

function formatCurrency(value: number): string {
    if (!value) return '$0';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

const MoviePoster: React.FC<{ posterPath: string | null, title: string }> = ({ posterPath, title }) => {
    const sources = getTmdbImageSources(posterPath, 'w92');
    const [errorCount, setErrorCount] = useState(0);

    // 根据当前失败次数，智能选择加载的 CDN 节点。如果全部失败，就使用本地占位图
    const currentSrc = errorCount < sources.length
        ? sources[errorCount]
        : '/default-movie-poster.png';

    return (
        <img
            src={currentSrc}
            alt={title}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={(e) => {
                // 防止连本地默认图也加载失败引发的死循环崩溃
                if (errorCount >= sources.length) {
                    e.currentTarget.onerror = null;
                    return;
                }
                // 触发状态更新，切换到下一个备用 CDN 节点
                setErrorCount(prev => prev + 1);
            }}
        />
    );
};

const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
    const {
        metrics = { totalMovies: 0, totalRevenue: 0, totalBudget: 0, averageRating: 0 },
        roiMovies = [],
        genres = [],
        ratings = []
    } = data || {};

    const topGenres = genres.slice(0, 8);
    const genrePieData = topGenres.map(g => ({ name: g.genreName, value: g.movieCount }));
    const top10Roi = roiMovies.slice(0, 10);

    const [currentSlide, setCurrentSlide] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const carouselVideos = [
        { src: '/videos/video1.mp4', title: '消失的人', subtitle: '关于消失' },
        { src: '/videos/video2.mp4', title: '飞驰人生3', subtitle: '关于人生' },
        { src: '/videos/video3.mp4', title: '熊出没', subtitle: '关于回忆' },
    ];

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVideoEnd = () => {
            setCurrentSlide((prev) => (prev + 1) % carouselVideos.length);
        };

        video.addEventListener('ended', handleVideoEnd);

        return () => {
            video.removeEventListener('ended', handleVideoEnd);
        };
    }, [currentSlide, carouselVideos.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselVideos.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselVideos.length) % carouselVideos.length);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="relative w-full overflow-hidden rounded-[40px] border border-natural-border shadow-soft">
                <div className="relative w-full" style={{ height: 'calc(65vh)' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0"
                        >
                            <video
                                ref={videoRef}
                                src={carouselVideos[currentSlide].src}
                                autoPlay
                                muted
                                playsInline
                                onEnded={nextSlide}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                            <div className="absolute bottom-20 left-16 right-16 text-white">
                                <h2 className="font-serif text-5xl italic mb-3">{carouselVideos[currentSlide].title}</h2>
                                <p className="text-lg text-white/90">{carouselVideos[currentSlide].subtitle}</p>
                            </div>

                            <button
                                onClick={prevSlide}
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>

                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                                {carouselVideos.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            index === currentSlide ? 'w-12 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                                        }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-4 gap-8">
                {[
                    { label: '电影总数', value: metrics.totalMovies.toLocaleString(), icon: Film, accent: 'bg-natural-primary' },
                    { label: '历史总票房', value: formatCurrency(metrics.totalRevenue), icon: DollarSign, accent: 'bg-natural-secondary' },
                    { label: '历史总投资', value: formatCurrency(metrics.totalBudget), icon: TrendingUp, accent: 'bg-natural-accent' },
                    { label: '全局平均评分', value: (metrics.averageRating || 0).toFixed(2), icon: Star, accent: 'bg-natural-primary' },
                ].map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white glass rounded-[32px] p-8 border border-natural-border shadow-soft flex flex-col gap-6 group hover:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{card.label}</span>
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-soft", card.accent)}><card.icon className="w-5 h-5" /></div>
                        </div>
                        <span className="font-serif text-4xl italic text-natural-primary leading-none">{card.value}</span>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-5 bg-white glass rounded-[40px] p-10 shadow-soft border border-natural-border flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest">类型分布</h3>
                        <RotateCw className="w-4 h-4 text-natural-muted opacity-40" />
                    </div>
                    <div className="h-64 relative w-full overflow-hidden">
                        <ResponsiveContainer width="99%" height="100%" minWidth={1}>
                            <RePieChart>
                                <Pie data={genrePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                                    {genrePieData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid #E5E5DE' }} />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">核心类型</span>
                            <span className="font-serif italic text-2xl text-natural-primary">{topGenres[0]?.genreName || '-'}</span>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {topGenres.map((g, i) => (
                            <div key={g.genreName || i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{g.genreName} {g.movieCount}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-7 bg-white glass rounded-[40px] p-10 shadow-soft border border-natural-border flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest">评分分布</h3>
                        <BarChart3 className="w-4 h-4 text-natural-muted opacity-40" />
                    </div>
                    <div className="h-64 relative w-full overflow-hidden">
                        <ResponsiveContainer width="99%" height="100%" minWidth={1}>
                            <BarChart data={ratings}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5DE" />
                                <XAxis dataKey="ratingRange" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8A82', fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8A82', fontWeight: 600 }} />
                                <Tooltip cursor={{ fill: 'rgba(74, 93, 78, 0.05)' }} contentStyle={{ borderRadius: '20px', border: '1px solid #E5E5DE' }} />
                                <Bar dataKey="movieCount" name="电影数量" fill="#4A5D4E" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ROI 排行榜 */}
            <div className="bg-white glass rounded-[40px] p-12 shadow-soft border border-natural-border">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="font-serif text-4xl font-light italic text-natural-primary leading-none">投资回报排行</h3>
                        <p className="text-[10px] text-natural-muted font-bold uppercase tracking-[0.3em] mt-3">高 ROI 电影 TOP 排行榜</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-natural-secondary" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                        <tr className="border-b border-natural-border">
                            <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">排名</th>
                            <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">影片名称</th>
                            <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">预算</th>
                            <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">票房</th>
                            <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">净利润</th>
                            <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">ROI</th>
                        </tr>
                        </thead>
                        <tbody>
                        {top10Roi.map((movie, index) => (
                            <motion.tr key={movie.movieId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="group hover:bg-natural-sidebar/40 transition-all duration-300 border-b border-natural-border/50">
                                <td className="py-8 px-4"><span className="font-serif text-2xl font-light italic text-natural-muted/60">{index + 1}</span></td>
                                <td className="py-8 px-4">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-18 rounded-xl overflow-hidden shadow-soft border border-natural-border flex-shrink-0 bg-natural-sidebar relative">
                                            {/* 🎬 直接调用我们新写的 React 专属图片组件 */}
                                            <MoviePoster posterPath={movie.posterPath} title={movie.title} />
                                        </div>
                                        <p className="text-sm font-bold text-natural-text group-hover:text-natural-primary transition-colors">{movie.title}</p>
                                    </div>
                                </td>
                                <td className="py-8 px-4"><span className="text-xs font-medium text-natural-muted">{formatCurrency(movie.budget)}</span></td>
                                <td className="py-8 px-4"><span className="text-xs font-bold text-natural-text">{formatCurrency(movie.revenue)}</span></td>
                                <td className="py-8 px-4"><span className={cn("text-xs font-bold", movie.profit > 0 ? "text-emerald-600" : "text-red-500")}>{formatCurrency(movie.profit)}</span></td>
                                <td className="py-8 px-4"><span className="text-sm font-black text-natural-secondary">{(movie.roiRatio || 0).toFixed(1)}x</span></td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardView;