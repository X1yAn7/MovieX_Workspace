import React from 'react';
import { motion } from 'motion/react';
import { DashboardData } from '../types';
import MovieKnowledgeGraph from '../components/MovieKnowledgeGraph';
import BoxOfficeQuadrantChart from '../components/BoxOfficeQuadrantChart';
import RatingsVsTmdbPanel from '../components/RatingsVsTmdbPanel';
import ResidualAnalysisPanel from '../components/ResidualAnalysisPanel';

interface AnalysisViewProps {
    data: DashboardData;
}

const AnalysisView: React.FC<AnalysisViewProps> = (_props: AnalysisViewProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* ========== 商业–口碑四象限（API + public CSV，后续可换数据库） ========== */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft relative overflow-hidden">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-4">
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                                商业回报 × 口碑四象限
                            </h3>
                            <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest max-w-xl">
                                GET /api/analysis/box-office-quadrant · 横轴 log₁₀(票房/预算)，纵轴 TMDB 均分；气泡≈评分数；虚线为样本中位数
                            </p>
                        </div>
                    </div>
                    <BoxOfficeQuadrantChart />
                </div>
            </div>

            {/* ========== 用户评分 vs TMDB 偏差榜 ========== */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft relative overflow-hidden">
                    <div className="mb-2">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                            用户评分 vs TMDB 均分偏差
                        </h3>
                        <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest max-w-3xl">
                            GET /api/ratings/vs-tmdb · 查询参数 limit、minCount；Δ = 用户均分×2 − TMDB vote_average（5 分制对齐到 10 分制）
                        </p>
                    </div>
                    <RatingsVsTmdbPanel />
                </div>
            </div>

            {/* ========== 票房残差：log 票房相对岭回归预测 ========== */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft relative overflow-hidden">
                    <div className="mb-2">
                        <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                            评分–票房异常（残差排行与归因）
                        </h3>
                        <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest max-w-4xl">
                            GET /api/analysis/residual-model · /residual-rankings · /residual-explain · 控制预算、口碑、热度等后的 log 票房残差；归因占比为相对解释用，非因果
                        </p>
                    </div>
                    <ResidualAnalysisPanel />
                </div>
            </div>

            {/* ========== 知识图谱（全宽） ========== */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">
                                影视知识图谱
                            </h3>
                            <p className="text-[10px] text-natural-muted font-medium uppercase tracking-widest">
                                MovieLens 实体网络 · 分层探索
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {['电影', '演员', '导演'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-natural-sidebar rounded-full text-[8px] font-bold text-natural-muted uppercase border border-natural-border">
                      {tag}
                    </span>
                            ))}
                        </div>
                    </div>

                    <div className="h-[min(78vh,860px)] min-h-[560px] bg-natural-sidebar/20 rounded-[32px] border border-natural-border relative overflow-hidden flex flex-col min-h-0">
                        <MovieKnowledgeGraph />
                    </div>

                    <div className="flex items-center gap-6 mt-8">
                        <div className="flex-1 p-6 bg-natural-sidebar/50 rounded-2xl border border-natural-border">
                            <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-3">图谱说明</h4>
                            <p className="text-[11px] text-natural-text leading-relaxed">
                                左侧为筛选与布局。顶层三个入口并列；节点颜色区分电影、演员、导演（Person）、类型与公司；评分边越粗表示星级越高（低分可为虚线）；在探索视图中点击节点会以该点为中心展示一跳关联并淡化其余。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== 情感相关性分析（保持不变） ========== */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft flex flex-col">
                    {/* ... 雷达图内容不变 ... */}
                </div>
            </div>
        </motion.div>
    );
};

export default AnalysisView;