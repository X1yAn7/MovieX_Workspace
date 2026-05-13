/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import AnalysisView from './views/AnalysisView';
import DiscoveryView from './views/DiscoveryView';
import CommunityView from './views/CommunityView';
import { MovieService } from './services/api';
import type { DashboardData } from './types';
import { setTmdbBaseUrl } from './lib/utils'; // 引入动态设置 BaseURL 的方法

export default function App() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. 初始化获取 TMDB 全局配置
    useEffect(() => {
        fetch('/api/tmdb/config')
            .then(res => res.json())
            .then(result => {
                // 如果后端成功返回了 data (即 secure_base_url)
                if (result.code === 200 && result.data) {
                    setTmdbBaseUrl(result.data);
                }
            })
            .catch(err => console.error("TMDB 配置初始化失败, 将使用默认备用地址", err));
    }, []);

    // 2. 加载数据大屏核心数据
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const dashboardData = await MovieService.getDashboardData();
                setData(dashboardData);
            } catch (err) {
                setError('失去与数据中心的连接，请确保后端服务已启动。');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-natural-bg gap-6">
                <div className="w-16 h-16 border-4 border-natural-sidebar border-t-natural-primary rounded-full animate-spin"></div>
                <p className="font-serif italic text-xl text-natural-primary animate-pulse">正在初始化电影分析引擎...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-natural-bg gap-4">
                <p className="font-serif italic text-2xl text-red-800">{error || '数据缺失。'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-natural-primary text-white rounded-full text-xs font-bold uppercase tracking-widest"
                >
                    尝试重新同步
                </button>
            </div>
        );
    }

    const renderView = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView data={data} />;
            case 'analysis': return <AnalysisView data={data} />;
            case 'discovery': return <DiscoveryView data={data} />;
            case 'community': return <CommunityView data={data} />;
            default: return <DashboardView data={data} />;
        }
    };

    return (
        <div className="flex bg-natural-bg min-h-screen font-sans selection:bg-natural-secondary selection:text-white antialiased">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 p-10 overflow-y-auto overflow-x-hidden transition-all duration-500 custom-scrollbar">
                    {renderView()}
                </main>
            </div>
        </div>
    );
}