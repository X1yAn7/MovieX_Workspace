package com.moviex.controller;

import com.moviex.service.KgCsvExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class KnowledgeGraphCsvController {

  private final KgCsvExportService kgCsvExportService;

  @GetMapping(value = "/api/kg/nodes", produces = "text/csv; charset=UTF-8")
  public String kgNodes() {
    return kgCsvExportService.nodesCsvUtf8WithBom();
  }

  @GetMapping(value = "/api/kg/edges", produces = "text/csv; charset=UTF-8")
  public String kgEdges() {
    return kgCsvExportService.edgesCsvUtf8WithBom();
  }
}
