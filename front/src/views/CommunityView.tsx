import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Bookmark, Send, User, Edit3, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Comment, MovieInfo, DashboardData, Review } from '../types';
import { MovieService, ReviewService } from '../services/api';

interface CommunityViewProps {
  data: DashboardData;
  selectedMovie?: MovieInfo | null;
  onSelectMovie?: (movie: MovieInfo | null) => void;
}

const CURRENT_USER_ID = 2;

const mapReviewToComment = (review: Review, posterPath: string | null = null): Comment => ({
  id: review.id.toString(),
  userId: review.userId.toString(),
  userName: review.userName || '匿名用户',
  userAvatar: review.userAvatar || '',
  movieId: review.movieId,
  movieTitle: review.movieTitle || '未知电影',
  moviePoster: review.moviePoster || posterPath,
  content: review.content,
  likes: 0,
  isLiked: false,
  favorites: 0,
  isFavorited: false,
  createdAt: review.createTime,
  rating: review.rating,
  sentiment: review.sentiment,
});

const CommunityView: React.FC<CommunityViewProps> = ({ data, selectedMovie: selectedFromDiscovery, onSelectMovie }) => {
  const [movieOptions, setMovieOptions] = useState<MovieInfo[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(selectedFromDiscovery || null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [hotIndex, setHotIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(8);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingRating, setEditingRating] = useState(8);
  const [showMovieSelector, setShowMovieSelector] = useState(false);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingHot, setIsLoadingHot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  const fetchMovies = async (query?: string) => {
    if (!query) {
      return MovieService.getPopular(10);
    }
    const params = {
      title: query,
      page: 1,
      pageSize: 20,
      orderBy: 'voteAverage',
      orderDir: 'DESC'
    };
    return MovieService.searchMovies(params);
  };

  useEffect(() => {
    const loadPopular = async () => {
      setIsLoadingMovies(true);
      try {
        const movies = await MovieService.getPopular(10);
        setMovieOptions(movies);
        if (!selectedMovie && movies.length > 0) {
          selectMovie(movies[0]);
        }
      } catch (error) {
        console.error('Failed to load popular movies:', error);
      } finally {
        setIsLoadingMovies(false);
      }
    };

    const loadHotReviews = async () => {
      setIsLoadingHot(true);
      try {
        const hot = await ReviewService.getHotReviews(5);
        setTopReviews(hot);
      } catch (error) {
        console.error('Failed to load hot reviews:', error);
      } finally {
        setIsLoadingHot(false);
      }
    };

    loadPopular();
    loadHotReviews();
  }, []);

  useEffect(() => {
    const handler = setTimeout(async () => {
      setIsSearchingMovies(true);
      setSearchError(null);
      try {
        if (!movieSearchQuery.trim()) {
          const popular = await MovieService.getPopular(10);
          setMovieOptions(popular);
          return;
        }

        const result = await MovieService.searchMovies({
          title: movieSearchQuery.trim(),
          page: 1,
          pageSize: 20,
          orderBy: 'voteAverage',
          orderDir: 'DESC'
        });
        setMovieOptions(result.records);
        if (result.records.length === 0) {
          setSearchError('未找到匹配的电影');
        }
      } catch (error) {
        console.error('Failed to search movies:', error);
        setSearchError('搜索失败，请稍后重试');
        setMovieOptions([]);
      } finally {
        setIsSearchingMovies(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [movieSearchQuery]);

  useEffect(() => {
    if (selectedFromDiscovery && selectedFromDiscovery.id !== selectedMovie?.id) {
      selectMovie(selectedFromDiscovery);
    }
  }, [selectedFromDiscovery]);

  useEffect(() => {
    if (hotIndex >= topReviews.length) {
      setHotIndex(0);
    }
  }, [topReviews, hotIndex]);

  useEffect(() => {
    if (!selectedMovie) return;
    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        const result = await ReviewService.getByMovieId(selectedMovie.id, page, 10);
        setTotalComments(result.total);
        setComments(result.records.map((review) => mapReviewToComment(review, selectedMovie.posterPath)));
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };
    loadComments();
  }, [selectedMovie, page]);

  const selectMovie = (movie: MovieInfo) => {
    setSelectedMovie(movie);
    setPage(1);
    onSelectMovie?.(movie);
    setShowMovieSelector(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedMovie) return;
    
    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      const review = await ReviewService.create({
        userId: CURRENT_USER_ID,
        movieId: selectedMovie.id,
        rating: newRating,
        content: newComment.trim(),
        sentiment: 'Neutral'
      });
      const newEntry = mapReviewToComment(review, selectedMovie.posterPath);
      setComments((prev) => [newEntry, ...prev]);
      setTotalComments((prev) => prev + 1);
      setNewComment('');
      setNewRating(8);
      setEditingReviewId(null);
      setSubmitMessage({ type: 'success', text: '评论发布成功！' });
      setTimeout(() => setSubmitMessage(null), 3000);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      setSubmitMessage({ type: 'error', text: '发布失败，请稍后重试' });
      setTimeout(() => setSubmitMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingReviewId(Number(comment.id));
    setEditingText(comment.content);
    setEditingRating(comment.rating ?? 8);
  };

  const handleSaveEdit = async () => {
    if (editingReviewId === null || !selectedMovie) return;
    try {
      const updatedReview = await ReviewService.update(editingReviewId, {
        userId: CURRENT_USER_ID,
        movieId: selectedMovie.id,
        rating: editingRating,
        content: editingText.trim(),
        sentiment: 'Neutral'
      });
      setComments((prev) => prev.map((item) =>
        item.id === editingReviewId.toString()
          ? mapReviewToComment(updatedReview, selectedMovie.posterPath)
          : item
      ));
      setEditingReviewId(null);
      setEditingText('');
    } catch (error) {
      console.error('Failed to save comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditingText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await ReviewService.delete(Number(commentId));
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      setTotalComments((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12 pb-20"
    >
      <div className="bg-white glass rounded-[40px] border border-natural-border shadow-soft overflow-hidden">
        <div className="px-8 py-6 border-b border-natural-border flex items-center justify-between">
          <div>
            <h2 className="font-serif text-3xl italic font-light text-natural-primary">社区热评轮播</h2>
            <p className="text-[10px] text-natural-muted font-bold uppercase tracking-[0.3em] mt-2">展示前五条热评与电影海报</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHotIndex((prev) => (prev - 1 + topReviews.length) % topReviews.length)}
              disabled={topReviews.length === 0}
              className="w-12 h-12 rounded-full bg-natural-sidebar border border-natural-border text-natural-text flex items-center justify-center hover:bg-natural-primary/10 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setHotIndex((prev) => (prev + 1) % topReviews.length)}
              disabled={topReviews.length === 0}
              className="w-12 h-12 rounded-full bg-natural-sidebar border border-natural-border text-natural-text flex items-center justify-center hover:bg-natural-primary/10 transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="relative p-8">
          {isLoadingHot ? (
            <div className="flex items-center justify-center h-60">
              <div className="w-10 h-10 rounded-full border-4 border-natural-border border-t-natural-primary animate-spin" />
            </div>
          ) : topReviews.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-[340px_1fr] items-center">
              <div className="relative rounded-[32px] overflow-hidden h-80 bg-natural-sidebar border border-natural-border">
                <img
                  src={topReviews[hotIndex].moviePoster ? `https://image.tmdb.org/t/p/w780${topReviews[hotIndex].moviePoster}` : '/default-movie-poster.png'}
                  alt={topReviews[hotIndex].movieTitle || '热评电影'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/80">热评电影</p>
                  <h3 className="mt-3 text-3xl font-serif italic">{topReviews[hotIndex].movieTitle}</h3>
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 text-[10px] uppercase tracking-[0.3em]">
                    评分 {topReviews[hotIndex].rating?.toFixed(1) ?? '0.0'}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-natural-sidebar border border-natural-border flex items-center justify-center text-natural-primary">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-natural-text">{topReviews[hotIndex].userName || '匿名用户'}</p>
                    <p className="text-[10px] text-natural-muted">{topReviews[hotIndex].movieTitle}</p>
                  </div>
                </div>
                <div className="rounded-[32px] bg-natural-sidebar p-6 border border-natural-border">
                  <p className="text-sm leading-relaxed text-natural-text">{topReviews[hotIndex].content}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60">
              <p className="text-natural-muted">暂无热评</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8">
        <div className="bg-white glass rounded-[40px] border border-natural-border shadow-soft overflow-hidden">
          <div className="px-8 py-6 border-b border-natural-border">
            <h2 className="font-serif text-3xl italic font-light text-natural-primary">电影选择器</h2>
            <p className="text-[10px] text-natural-muted font-bold uppercase tracking-[0.3em] mt-2">从热门电影中选择或搜索</p>
          </div>
          <div className="p-8">
            <div className="relative mb-6">
              <input
                type="text"
                value={movieSearchQuery}
                onChange={(e) => setMovieSearchQuery(e.target.value)}
                placeholder="搜索电影..."
                className="w-full px-6 py-4 bg-natural-sidebar rounded-[24px] border-none outline-none text-natural-text placeholder-natural-muted"
              />
              {isSearchingMovies && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-natural-primary" />
                </div>
              )}
            </div>
            
            {searchError ? (
              <div className="p-8 text-center text-red-500">
                <p className="text-sm">{searchError}</p>
              </div>
            ) : movieOptions.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {movieOptions.slice(0, 8).map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => selectMovie(movie)}
                    className={cn(
                      'group relative overflow-hidden rounded-[32px] border border-natural-border bg-natural-sidebar transition hover:border-natural-primary',
                      selectedMovie?.id === movie.id && 'border-natural-primary shadow-soft'
                    )}
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                        alt={movie.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 text-left">
                      <p className="font-bold text-sm text-natural-text">{movie.title}</p>
                      <p className="text-[10px] text-natural-muted mt-2">评分 {movie.voteAverage.toFixed(1)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-natural-muted">
                <p className="text-sm">未找到匹配影片</p>
                <p className="text-[10px] mt-1">请尝试其它关键词</p>
              </div>
            )}
          </div>
        </div>

        {/* 发表评论区域 */}
        <div className="bg-white rounded-[40px] p-8 border border-natural-border shadow-soft">
          <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-6">发表想法</h3>
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-natural-sidebar border border-natural-border flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-natural-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="分享你对电影的看法..."
                  className="w-full h-24 px-6 py-4 bg-natural-sidebar rounded-[24px] border-none outline-none resize-none text-natural-text placeholder-natural-muted"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="relative">
                  <button
                    onClick={() => setShowMovieSelector(!showMovieSelector)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-full border transition-all",
                      selectedMovie 
                        ? "bg-natural-primary border-natural-primary text-white" 
                        : "bg-natural-sidebar border-natural-border text-natural-muted hover:border-natural-primary"
                    )}
                  >
                    <span className="text-xs font-bold">{selectedMovie ? selectedMovie.title : '选择电影'}</span>
                  </button>
                  
                  {showMovieSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-white rounded-[24px] border border-natural-border shadow-soft"
                    >
                      <div className="p-2">
                        {searchError ? (
                          <div className="p-8 text-center text-red-500">
                            <p className="text-sm">{searchError}</p>
                          </div>
                        ) : movieOptions.length > 0 ? (
                          movieOptions.map((movie) => (
                            <button
                              key={movie.id}
                              onClick={() => selectMovie(movie)}
                              className="w-full flex items-center gap-4 p-4 hover:bg-natural-sidebar transition-colors text-left"
                            >
                              <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                <img src={movie.posterPath ? `https://image.tmdb.org/t/p/w92${movie.posterPath}` : '/default-movie-poster.png'} alt={movie.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-natural-text truncate">{movie.title}</p>
                                <p className="text-[10px] text-natural-muted truncate">ID: {movie.id} · 评分: {movie.voteAverage.toFixed(1)}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center text-natural-muted">
                            <p className="text-sm">未找到匹配影片</p>
                            <p className="text-[10px] mt-1">请尝试其它关键词</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {submitMessage && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "text-xs font-bold px-4 py-2 rounded-full",
                        submitMessage.type === 'success' 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {submitMessage.text}
                    </motion.div>
                  )}
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || !selectedMovie || isSubmitting}
                    className={cn(
                      "flex items-center gap-2 px-8 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-soft transition-all",
                      newComment.trim() && selectedMovie && !isSubmitting
                        ? "bg-natural-primary text-white hover:bg-natural-primary/90" 
                        : "bg-natural-border text-natural-muted cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>发布中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>发布</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest">最新评论</h3>
          <span className="text-[10px] text-natural-muted">{comments.length} 条评论</span>
        </div>
        {isLoadingComments ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-natural-border border-t-natural-primary rounded-full animate-spin"></div>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[32px] p-6 border border-natural-border shadow-soft hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-natural-sidebar border border-natural-border flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-natural-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm text-natural-text">{comment.userName}</p>
                      <p className="text-[10px] text-natural-muted">{comment.movieTitle}</p>
                      <p className="text-[10px] text-natural-muted mt-1">{formatDate(comment.createdAt)}</p>
                    </div>
                    {comment.userId === CURRENT_USER_ID.toString() && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="p-2 rounded-full hover:bg-natural-sidebar transition-colors text-natural-muted hover:text-natural-text"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-2 rounded-full hover:bg-natural-sidebar transition-colors text-natural-muted hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingReviewId === Number(comment.id) ? (
                    <div className="mt-4 space-y-4">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-4 py-3 bg-natural-sidebar rounded-[16px] border-none outline-none resize-none"
                        rows={3}
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-natural-muted">评分:</span>
                          <select
                            value={editingRating}
                            onChange={(e) => setEditingRating(Number(e.target.value))}
                            className="px-3 py-2 bg-natural-sidebar rounded-full border-none outline-none text-xs"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-xs font-bold text-natural-muted hover:text-natural-text rounded-full"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 text-xs font-bold bg-natural-primary text-white rounded-full hover:bg-natural-primary/90"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm leading-relaxed text-natural-text">{comment.content}</p>
                      {comment.rating && (
                        <div className="mt-3 flex items-center gap-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-natural-sidebar text-[10px] font-bold">
                            评分 {comment.rating.toFixed(1)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-6 flex items-center gap-4">
                    <button
                      onClick={() => {}}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                        comment.isLiked ? "bg-red-50 text-red-500" : "hover:bg-natural-sidebar text-natural-muted hover:text-red-500"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", comment.isLiked && "fill-current")} />
                      <span className="text-xs font-bold">{comment.likes}</span>
                    </button>
                    <button
                      onClick={() => {}}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                        comment.isFavorited ? "bg-amber-50 text-amber-500" : "hover:bg-natural-sidebar text-natural-muted hover:text-amber-500"
                      )}
                    >
                      <Bookmark className={cn("w-4 h-4", comment.isFavorited && "fill-current")} />
                      <span className="text-xs font-bold">{comment.favorites}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-natural-muted">
            <p>暂无评论</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CommunityView;