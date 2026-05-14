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

// 后端评论 / 评分实体
export interface Review {
    id: number;
    userId: number;
    movieId: number;
    rating: number;
    content: string;
    sentiment: string;
    createTime: string;
    userName?: string;
    userAvatar?: string;
    movieTitle?: string;
    moviePoster?: string | null;
}

// 评论相关类型
export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    movieId: number;
    movieTitle: string;
    moviePoster?: string | null;
    content: string;
    likes: number;
    isLiked: boolean;
    favorites: number;
    isFavorited: boolean;
    createdAt: string;
    rating?: number;
    sentiment?: string;
}

export interface HotMovie {
    movieId: number;
    title: string;
    posterPath: string | null;
    commentCount: number;
    topComment: Comment | null;
}