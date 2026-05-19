import { DashboardData, GlobalMetrics, MovieRoi, GenreDist, RatingDist, MovieInfo, PageResult, MovieSearchParams } from '../types';

interface ApiResult<T> {
    code: number;
    msg: string;
    data: T;
}

async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const response = await fetch(endpoint, init);
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
    getPopular: (limit = 10) => fetchApi<MovieInfo[]>(`/api/movies/popular?limit=${limit}`),

    getDashboardData: async (): Promise<DashboardData> => {
        const [metrics, roiMovies, genres, ratings] = await Promise.all([
            MovieService.getGlobalMetrics(),
            MovieService.getTopRoiMovies(),
            MovieService.getGenreDistribution(),
            MovieService.getRatingDistribution(),
        ]);
        return { metrics, roiMovies, genres, ratings };
    },

    searchMovies: async (params: MovieSearchParams): Promise<PageResult<MovieInfo>> => {
        const response = await fetch('/api/movies/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const result = await response.json();
        if (result.code !== 200) throw new Error(result.msg);
        return result.data;
    },

    searchMoviesCount: async (params: MovieSearchParams): Promise<number> => {
        const response = await fetch('/api/movies/search/count', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const result = await response.json();
        if (result.code !== 200) throw new Error(result.msg);
        return result.data;
    },

    getMovieDetail: async (movieId: number): Promise<MovieInfo> => {
        const response = await fetch(`/api/movies/${movieId}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const result = await response.json();
        if (result.code !== 200) throw new Error(result.msg);
        return result.data;
    }
};
