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

export interface PageResult<T> {
    records: T[];
    total: number;
    page: number;
    pageSize: number;
}

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
    skipCount?: boolean;
}