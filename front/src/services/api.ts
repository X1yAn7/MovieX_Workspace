import { DashboardData, GlobalMetrics, MovieRoi, GenreDist, RatingDist, MovieInfo, PageResult, MovieSearchParams } from '../types';

interface ApiResult<T> {
    code: number;
    msg: string;
    data: T;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const result: ApiResult<T> = await response.json();
    if (result.code !== 200) throw new Error(result.msg);
    return result.data;
}

export const MovieService = {
    getGlobalMetrics: () => fetchApi<GlobalMetrics>('/api/dashboard/metrics'),
    getTopRoiMovies: () => fetchApi<MovieRoi[]>('/api/dashboard/roi'),
    getGenreDistribution: () => fetchApi<GenreDist[]>('/api/dashboard/genres'),
    getRatingDistribution: () => fetchApi<RatingDist[]>('/api/dashboard/ratings'),

    getDashboardData: async (): Promise<DashboardData> => {
        const [metrics, roiMovies, genres, ratings] = await Promise.all([
            MovieService.getGlobalMetrics(),
            MovieService.getTopRoiMovies(),
            MovieService.getGenreDistribution(),
            MovieService.getRatingDistribution(),
        ]);
        return { metrics, roiMovies, genres, ratings };
    },

    /**
     * 搜索与筛选电影列表（支持分页与排序）
     * @param params 电影搜索参数对象
     * @returns 包含电影列表及分页信息的 Promise
     */
    searchMovies: async (params: MovieSearchParams): Promise<PageResult<MovieInfo>> => {
        const queryParams = new URLSearchParams();

        // 动态构建查询字符串
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        const queryString = queryParams.toString();
        const endpoint = `/api/movies${queryString ? `?${queryString}` : ''}`;

        return fetchApi<PageResult<MovieInfo>>(endpoint);
    },
};