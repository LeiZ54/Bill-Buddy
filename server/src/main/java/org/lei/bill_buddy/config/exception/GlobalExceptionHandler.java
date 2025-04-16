package org.lei.bill_buddy.config.exception;

import org.lei.bill_buddy.enums.ErrorCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({MethodArgumentNotValidException.class})
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler({BadCredentialsException.class})
    public ResponseEntity<?> handleBadCredentialsException() {
        return ResponseEntity.status(ErrorCode.WRONG_EMAIL_OR_PASSWORD.getHttpCode()).body(Collections.singletonMap("error", ErrorCode.WRONG_EMAIL_OR_PASSWORD.getMessage()));
    }

    @ExceptionHandler({AppException.class})
    public ResponseEntity<?> handleAppException(AppException e) {
        return ResponseEntity.status(e.getErrorCode().getHttpCode()).body(Collections.singletonMap("error", e.getMessage()));
    }

    @ExceptionHandler({Exception.class})
    public ResponseEntity<?> handleExceptions(Exception e) {
        return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
    }
}


