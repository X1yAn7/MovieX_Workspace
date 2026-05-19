import React from 'react';
import { motion } from 'motion/react';
import { DashboardData } from '../types';
import BoxOfficeQuadrantChart from '../components/BoxOfficeQuadrantChart';
import RatingsVsTmdbPanel from '../components/RatingsVsTmdbPanel';
import ResidualAnalysisPanel from '../components/ResidualAnalysisPanel';
import GenrePerformance from '../components/GenrePerformance';
import DirectorLeaderboard from '../components/DirectorLeaderboard';

interface AnalysisViewProps {
    data: DashboardData;
}

const AnalysisView: React.FC<AnalysisViewProps> = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft relative overflow-hidden">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-4">
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                                商业回报 × 口碑四象限
                            </h3>
                            <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest max-w-xl">
                                横轴 log₁₀(票房/预算)，纵轴 TMDB 均分；气泡≈评分数；虚线为样本中位数
                            </p>
                        </div>
                    </div>
                    <BoxOfficeQuadrantChart />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft relative overflow-hidden">
                    <div className="mb-2">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                            用户评分 vs TMDB 均分偏差
                        </h3>
                        <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest max-w-3xl">
                            Δ = 用户均分 × 2 − TMDB vote_average（5 分制对齐到 10 分制）
                        </p>
                    </div>
                    <RatingsVsTmdbPanel />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft relative overflow-hidden">
                    <div className="mb-2">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                            评分–票房异常（残差排行与归因）
                        </h3>
                        <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest max-w-4xl">
                            控制预算、口碑、热度等后的 log 票房残差；归因占比为相对解释用，非因果
                        </p>
                    </div>
                    <ResidualAnalysisPanel />
                </div>
            </div>

            {/* 新增：类型表现分析 */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft">
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                            类型表现分析
                        </h3>
                        <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest">
                            按类型统计平均票房、评分、ROI，支持年份筛选和排序切换
                        </p>
                    </div>
                    <GenrePerformance />
                </div>
            </div>

            {/* 新增：导演排行 */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft">
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                            导演 ROI 排行榜
                        </h3>
                        <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest">
                            按平均投资回报率排名的导演榜单
                        </p>
                    </div>
                    <DirectorLeaderboard />
                </div>
            </div>
        </motion.div>
    );
};

export default AnalysisView;
