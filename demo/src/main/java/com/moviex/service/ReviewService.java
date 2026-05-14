package com.moviex.service;

import com.moviex.common.PageResult;
import com.moviex.entity.Review;
import com.moviex.mapper.ReviewMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewMapper reviewMapper;

    public Review getById(Integer id) {
        return reviewMapper.getById(id);
    }

    public PageResult<Review> getByMovieId(Integer movieId, Integer page, Integer pageSize) {
        int offset = (page - 1) * pageSize;
        List<Review> records = reviewMapper.getByMovieId(movieId, offset, pageSize);
        Long total = reviewMapper.countByMovieId(movieId);
        return PageResult.of(records, total, page, pageSize);
    }

    public PageResult<Review> getByUserId(Integer userId, Integer page, Integer pageSize) {
        int offset = (page - 1) * pageSize;
        List<Review> records = reviewMapper.getByUserId(userId, offset, pageSize);
        Long total = reviewMapper.countByUserId(userId);
        return PageResult.of(records, total, page, pageSize);
    }

    public List<Review> getLatest(Integer limit) {
        return reviewMapper.getLatest(limit == null ? 10 : limit);
    }

    public List<Review> getHotReviews(Integer limit) {
        return reviewMapper.getHotReviews(limit == null ? 5 : limit);
    }

    public Review create(Review review) {
        reviewMapper.insert(review);
        return reviewMapper.getById(review.getId());
    }

    public Review update(Review review) {
        reviewMapper.update(review);
        return reviewMapper.getById(review.getId());
    }

    public boolean delete(Integer id) {
        return reviewMapper.deleteById(id) > 0;
    }

    public Double getAverageRating(Integer movieId) {
        return reviewMapper.getAverageRating(movieId);
    }
}
