export interface GlobalMetrics {
    totalMovies: number;
    totalRevenue: number;
    totalBudget: number;
    averageRating: number;
}

export interface MovieRoi {
    movieId: number;
    title: string;
    budget: number;
    revenue: number;
    profit: number;
    roiRatio: number;
    posterPath: string | null;
}

export interface GenreDist {
    genreName: string;
    movieCount: number;
}

export interface RatingDist {
    ratingRange: string;
    movieCount: number;
}

export interface DashboardData {
    metrics: GlobalMetrics;
    roiMovies: MovieRoi[];
    genres: GenreDist[];
    ratings: RatingDist[];
}

/**
 * 电影详细信息实体
 * 严格映射后端 MovieInfo 实体类
 */
export interface MovieInfo {
    id: number;
    title: string;
    originalTitle: string;
    overview: string;
    genres: string;
    director: string;
    writers: string;
    cast: string;
    duration: string;
    releaseDate: string;
    regions: string;
    posterPath: string | null;
    backdropPath: string | null;
    voteAverage: number;
    voteCount: number;
    popularity: number;
    budget: number;
    revenue: number;
    status: string;
    keywords: string;
}

/**
 * 通用分页返回结构
 * 映射后端 PageResult 结构
 */
export interface PageResult<T> {
    records: T[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * 电影搜索请求参数接口
 */
export interface MovieSearchParams {
    title?: string;
    genre?: string;
    minRating?: number;
    maxRating?: number;
    year?: number;
    minBudget?: number;
    maxBudget?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
    page?: number;
    pageSize?: number;
}