package org.lei.bill_buddy.config.exception;

import lombok.Data;
import org.lei.bill_buddy.enums.ErrorCode;

@Data
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
}

