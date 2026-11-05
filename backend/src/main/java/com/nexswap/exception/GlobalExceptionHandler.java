package com.nexswap.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(BusinessException exception, HttpServletRequest request) {
        return build(exception.getStatus(), exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception,
                                                     HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return build(HttpStatus.BAD_REQUEST, "Please correct the highlighted fields.",
                request.getRequestURI(), fields);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraint(ConstraintViolationException exception,
                                                     HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation ->
                fields.put(violation.getPropertyPath().toString(), violation.getMessage()));
        return build(HttpStatus.BAD_REQUEST, "Please correct the highlighted fields.",
                request.getRequestURI(), fields);
    }

    @ExceptionHandler({BadCredentialsException.class, AuthenticationException.class})
    public ResponseEntity<ApiError> handleAuthentication(Exception exception, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Invalid email or password.", request.getRequestURI(), null);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabled(DisabledException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "This account is disabled.", request.getRequestURI(), null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException exception,
                                                       HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "You do not have permission to perform this action.",
                request.getRequestURI(), null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException exception,
                                                     HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "The request body is malformed or contains an invalid value.",
                request.getRequestURI(), null);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ApiError> handleBadParameter(Exception exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Invalid request parameter.", request.getRequestURI(), null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleUploadSize(MaxUploadSizeExceededException exception,
                                                     HttpServletRequest request) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "The image must be 5 MB or smaller.",
                request.getRequestURI(), null);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiError> handleMultipart(MultipartException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "The uploaded file could not be processed.",
                request.getRequestURI(), null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException exception,
                                                        HttpServletRequest request) {
        log.warn("Database constraint violation: {}", exception.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "This action conflicts with existing data.",
                request.getRequestURI(), null);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NoHandlerFoundException exception,
                                                   HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "The requested endpoint does not exist.",
                request.getRequestURI(), null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled request failure", exception);
        ApiError error = new ApiError(Instant.now(), 500, "Internal Server Error",
                "Something went wrong. Please try again.", request.getRequestURI(), null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, String path,
                                           Map<String, String> fields) {
        ApiError error = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(),
                message, path, fields);
        return ResponseEntity.status(status).body(error);
    }
}
