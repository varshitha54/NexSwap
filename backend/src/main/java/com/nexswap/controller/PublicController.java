package com.nexswap.controller;

import com.nexswap.dto.publicapi.PublicStatsResponse;
import com.nexswap.service.PublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicService publicService;

    @GetMapping("/stats")
    public ResponseEntity<PublicStatsResponse> stats() {
        return ResponseEntity.ok(publicService.stats());
    }
}
