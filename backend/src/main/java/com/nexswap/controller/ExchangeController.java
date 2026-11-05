package com.nexswap.controller;

import com.nexswap.dto.exchange.ExchangeCreateRequest;
import com.nexswap.dto.exchange.ExchangeResponse;
import com.nexswap.service.ExchangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exchanges")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeService exchangeService;

    @PostMapping
    public ResponseEntity<ExchangeResponse> create(
            @Valid @RequestBody ExchangeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(exchangeService.create(request));
    }

    @GetMapping("/received")
    public ResponseEntity<List<ExchangeResponse>> received() {
        return ResponseEntity.ok(exchangeService.received());
    }

    @GetMapping("/sent")
    public ResponseEntity<List<ExchangeResponse>> sent() {
        return ResponseEntity.ok(exchangeService.sent());
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<ExchangeResponse> accept(@PathVariable Long id) {
        return ResponseEntity.ok(exchangeService.accept(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ExchangeResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(exchangeService.reject(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ExchangeResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(exchangeService.cancel(id));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ExchangeResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(exchangeService.complete(id));
    }
}
