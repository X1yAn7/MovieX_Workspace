import { DashboardData, GlobalMetrics, MovieRoi, GenreDist, RatingDist } from '../types';

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

  searchMovies: async (_query: string): Promise<any> => {
    return [];
  },
};
