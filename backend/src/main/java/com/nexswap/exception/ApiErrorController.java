package com.nexswap.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Renders every request that falls through to "/error" in the same JSON envelope
 * produced by {@link GlobalExceptionHandler}, so the whole API returns one error shape.
 */
@RestController
public class ApiErrorController implements ErrorController {

    private static final String STATUS_ATTRIBUTE = "jakarta.servlet.error.status_code";
    private static final String MESSAGE_ATTRIBUTE = "jakarta.servlet.error.message";
    private static final String URI_ATTRIBUTE = "jakarta.servlet.error.request_uri";

    @RequestMapping("/error")
    public ResponseEntity<ApiError> handle(HttpServletRequest request) {
        Integer statusValue = (Integer) request.getAttribute(STATUS_ATTRIBUTE);
        HttpStatus status = statusValue == null
                ? HttpStatus.INTERNAL_SERVER_ERROR
                : HttpStatus.valueOf(statusValue);
        String message = messageFor(status, (String) request.getAttribute(MESSAGE_ATTRIBUTE));
        String path = (String) request.getAttribute(URI_ATTRIBUTE);
        return ResponseEntity.status(status)
                .body(ApiError.of(status.value(), status.getReasonPhrase(), message, path));
    }

    private String messageFor(HttpStatus status, String raw) {
        if (raw != null && !raw.isBlank()) {
            return raw;
        }
        if (status.is4xxClientError()) {
            return "The request could not be processed.";
        }
        return "Something went wrong. Please try again.";
    }
}
