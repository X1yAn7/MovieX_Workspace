package com.moviex.controller;

import com.moviex.common.PageResult;
import com.moviex.common.Result;
import com.moviex.entity.MovieInfo;
import com.moviex.service.MovieService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @Data
    public static class MovieSearchRequest {
        private String title;
        private String genre;
        private Double minRating;
        private Double maxRating;
        private Integer year;
        private Long minBudget;
        private Long maxBudget;
        private String orderBy = "revenue";
        private String orderDir = "DESC";
        private Integer page = 1;
        private Integer pageSize = 20;
        private Boolean skipCount = false;
    }

    @GetMapping("/{id}")
    public Result<MovieInfo> getById(@PathVariable("id") Integer id) {
        MovieInfo movie = movieService.getById(id);
        return movie == null ? Result.error("电影不存在") : Result.success(movie);
    }

    /**
     * 高速列表查询端点，配合 skipCount = true 可大幅降低响应时间
     */
    @PostMapping("/search")
    public Result<PageResult<MovieInfo>> searchMovies(@RequestBody MovieSearchRequest req) {
        PageResult<MovieInfo> result = movieService.search(
                req.getTitle(), req.getGenre(), req.getMinRating(), req.getMaxRating(),
                req.getYear(), req.getMinBudget(), req.getMaxBudget(),
                req.getOrderBy(), req.getOrderDir(), req.getPage(), req.getPageSize(), req.getSkipCount());
        return Result.success(result);
    }

    /**
     * 独立的耗时总数统计端点，供前端后台静默拉取
     */
    @PostMapping("/search/count")
    public Result<Long> searchMoviesCount(@RequestBody MovieSearchRequest req) {
        Long count = movieService.searchCount(
                req.getTitle(), req.getGenre(), req.getMinRating(), req.getMaxRating(),
                req.getYear(), req.getMinBudget(), req.getMaxBudget());
        return Result.success(count);
    }

    @GetMapping("/popular")
    public Result<List<MovieInfo>> getPopular(@RequestParam(value = "limit", defaultValue = "10") Integer limit) {
        return Result.success(movieService.getTopPopular(limit));
    }

    @GetMapping("/top-rated")
    public Result<List<MovieInfo>> getTopRated(@RequestParam(value = "limit", defaultValue = "10") Integer limit) {
        return Result.success(movieService.getTopRated(limit));
    }

    @GetMapping("/genres")
    public Result<List<String>> getAllGenres() {
        return Result.success(movieService.getAllGenres());
    }

    @PostMapping
    public Result<MovieInfo> create(@RequestBody MovieInfo movie) {
        return Result.success(movieService.create(movie));
    }

    @PutMapping("/{id}")
    public Result<MovieInfo> update(@PathVariable("id") Integer id, @RequestBody MovieInfo movie) {
        movie.setId(id);
        return Result.success(movieService.update(movie));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable("id") Integer id) {
        return movieService.delete(id) ? Result.success(true) : Result.error("删除失败");
    }
}