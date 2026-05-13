package com.moviex.controller;

import com.moviex.common.PageResult;
import com.moviex.common.Result;
import com.moviex.entity.MovieInfo;
import com.moviex.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    /**
     * 获取电影详情
     * GET /api/movies/{id}
     */
    @GetMapping("/{id}")
    public Result<MovieInfo> getById(@PathVariable Integer id) {
        MovieInfo movie = movieService.getById(id);
        if (movie == null) {
            return Result.error("电影不存在");
        }
        return Result.success(movie);
    }

    /**
     * 搜索/筛选电影（支持分页）
     * GET /api/movies?title=xxx&genre=科幻&minRating=7&year=2023&page=1&pageSize=20&orderBy=popularity&orderDir=DESC
     */
    @GetMapping
    public Result<PageResult<MovieInfo>> search(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxRating,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Long minBudget,
            @RequestParam(required = false) Long maxBudget,
            @RequestParam(defaultValue = "popularity") String orderBy,
            @RequestParam(defaultValue = "DESC") String orderDir,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        PageResult<MovieInfo> result = movieService.search(title, genre, minRating, maxRating,
                year, minBudget, maxBudget, orderBy, orderDir, page, pageSize);
        return Result.success(result);
    }

    /**
     * 获取热门电影
     * GET /api/movies/popular?limit=10
     */
    @GetMapping("/popular")
    public Result<List<MovieInfo>> getPopular(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(movieService.getTopPopular(limit));
    }

    /**
     * 获取高分电影
     * GET /api/movies/top-rated?limit=10
     */
    @GetMapping("/top-rated")
    public Result<List<MovieInfo>> getTopRated(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(movieService.getTopRated(limit));
    }

    /**
     * 获取所有电影类型（去重）
     * GET /api/movies/genres
     */
    @GetMapping("/genres")
    public Result<List<String>> getAllGenres() {
        return Result.success(movieService.getAllGenres());
    }

    /**
     * 新增电影（管理员）
     * POST /api/movies
     */
    @PostMapping
    public Result<MovieInfo> create(@RequestBody MovieInfo movie) {
        return Result.success(movieService.create(movie));
    }

    /**
     * 更新电影（管理员）
     * PUT /api/movies/{id}
     */
    @PutMapping("/{id}")
    public Result<MovieInfo> update(@PathVariable Integer id, @RequestBody MovieInfo movie) {
        movie.setId(id);
        return Result.success(movieService.update(movie));
    }

    /**
     * 删除电影（管理员）
     * DELETE /api/movies/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Integer id) {
        boolean deleted = movieService.delete(id);
        return deleted ? Result.success(true) : Result.error("删除失败，电影不存在");
    }
}
