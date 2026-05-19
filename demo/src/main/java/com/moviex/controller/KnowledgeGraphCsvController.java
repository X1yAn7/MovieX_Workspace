package com.moviex.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class KnowledgeGraphCsvController {

    private final RestTemplate rest = new RestTemplate();

    @GetMapping(value = "/api/kg/nodes", produces = "text/csv; charset=UTF-8")
    public String kgNodes() {
        return rest.getForObject("http://localhost:8000/api/kg/nodes", String.class);
    }

    @GetMapping(value = "/api/kg/edges", produces = "text/csv; charset=UTF-8")
    public String kgEdges() {
        return rest.getForObject("http://localhost:8000/api/kg/edges", String.class);
    }
}
