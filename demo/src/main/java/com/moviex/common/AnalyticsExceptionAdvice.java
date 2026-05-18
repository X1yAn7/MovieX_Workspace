package com.moviex.common;

import com.moviex.service.ResidualAnalysisService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AnalyticsExceptionAdvice {

  @ExceptionHandler(ResidualAnalysisService.BadRequestException.class)
  public ResponseEntity<Map<String, String>> badRequest(ResidualAnalysisService.BadRequestException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
  }

  @ExceptionHandler(ResidualAnalysisService.NotFoundException.class)
  public ResponseEntity<Map<String, String>> notFound(ResidualAnalysisService.NotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> serverError(Exception e) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "服务器错误"));
  }
}
