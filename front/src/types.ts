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
