import { DashboardData, GlobalMetrics, MovieRoi, GenreDist, RatingDist, MovieInfo, PageResult, MovieSearchParams, Review } from '../types';

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

    /**
     * 独立的获取查询总数接口，供前端静默加载使用
     */
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

export const ReviewService = {
    getByMovieId: async (movieId: number, page = 1, pageSize = 10): Promise<PageResult<Review>> => {
        return fetchApi<PageResult<Review>>(`/api/reviews/movie/${movieId}?page=${page}&pageSize=${pageSize}`);
    },
    create: async (payload: Omit<Review, 'id' | 'userName' | 'userAvatar' | 'movieTitle' | 'createTime'>): Promise<Review> => {
        return fetchApi<Review>('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },
    update: async (id: number, payload: Omit<Review, 'id' | 'userName' | 'userAvatar' | 'movieTitle' | 'createTime'>): Promise<Review> => {
        return fetchApi<Review>(`/api/reviews/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },
    delete: async (id: number): Promise<boolean> => {
        return fetchApi<boolean>(`/api/reviews/${id}`, {
            method: 'DELETE'
        });
    },
    getLatest: async (limit = 10): Promise<Review[]> => {
        return fetchApi<Review[]>(`/api/reviews/latest?limit=${limit}`);
    },
    getHotReviews: async (limit = 5): Promise<Review[]> => {
        return fetchApi<Review[]>(`/api/reviews/hot?limit=${limit}`);
    }
};