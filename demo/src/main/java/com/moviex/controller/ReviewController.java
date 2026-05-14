package com.moviex.controller;

import com.moviex.common.PageResult;
import com.moviex.common.Result;
import com.moviex.entity.Review;
import com.moviex.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /**
     * 获取电影评论（分页）
     * GET /api/reviews/movie/{movieId}?page=1&pageSize=10
     */
    @GetMapping("/movie/{movieId}")
    public Result<PageResult<Review>> getByMovie(
            @PathVariable Integer movieId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(reviewService.getByMovieId(movieId, page, pageSize));
    }

    /**
     * 获取用户评论（分页）
     * GET /api/reviews/user/{userId}?page=1&pageSize=10
     */
    @GetMapping("/user/{userId}")
    public Result<PageResult<Review>> getByUser(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(reviewService.getByUserId(userId, page, pageSize));
    }

    /**
     * 获取最新评论
     * GET /api/reviews/latest?limit=10
     */
    @GetMapping("/latest")
    public Result<List<Review>> getLatest(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(reviewService.getLatest(limit));
    }

    /**
     * 获取热门热评
     * GET /api/reviews/hot?limit=5
     */
    @GetMapping("/hot")
    public Result<List<Review>> getHotReviews(@RequestParam(defaultValue = "5") Integer limit) {
        return Result.success(reviewService.getHotReviews(limit));
    }

    /**
     * 获取电影平均评分
     * GET /api/reviews/movie/{movieId}/rating
     */
    @GetMapping("/movie/{movieId}/rating")
    public Result<Double> getAverageRating(@PathVariable Integer movieId) {
        return Result.success(reviewService.getAverageRating(movieId));
    }

    /**
     * 发表评论
     * POST /api/reviews
     */
    @PostMapping
    public Result<Review> create(@RequestBody Review review) {
        return Result.success(reviewService.create(review));
    }

    /**
     * 更新评论
     * PUT /api/reviews/{id}
     */
    @PutMapping("/{id}")
    public Result<Review> update(@PathVariable Integer id, @RequestBody Review review) {
        review.setId(id);
        return Result.success(reviewService.update(review));
    }

    /**
     * 删除评论
     * DELETE /api/reviews/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Integer id) {
        boolean deleted = reviewService.delete(id);
        return deleted ? Result.success(true) : Result.error("删除失败");
    }
}
