package org.lei.bill_buddy.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // === Common Errors ===
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "Invalid request."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Unauthorized access."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Access is forbidden."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Resource not found."),

    // === User Related ===
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email already exists."),
    WRONG_EMAIL_OR_PASSWORD(HttpStatus.BAD_REQUEST, "Wrong password please try again."),
    SELF_FRIEND_REQUEST(HttpStatus.BAD_REQUEST, "Cannot add yourself as friend."),
    ALREADY_FRIENDS(HttpStatus.CONFLICT, "You are already friends."),
    FRIEND_REQUEST_ALREADY_SENT(HttpStatus.CONFLICT, "Friend request already sent."),
    FRIEND_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "Friend request not found."),
    FRIEND_REQUEST_ALREADY_HANDLED(HttpStatus.CONFLICT, "Friend request already handled."),
    FRIEND_RELATIONSHIP_NOT_FOUND(HttpStatus.NOT_FOUND, "Friend relationship not found."),
    INVALID_GOOGLE_ID(HttpStatus.BAD_REQUEST, "Invalid Google ID."),

    // === Group Related ===
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "Group not found."),
    ALREADY_IN_GROUP(HttpStatus.CONFLICT, "User already in the group."),
    NOT_A_MEMBER(HttpStatus.FORBIDDEN, "You are not a member of the group."),
    MEMBER_CAN_NOT_BE_REMOVED(HttpStatus.CONFLICT, "Member can not be removed."),

    // === Expense Related ===
    EXPENSE_NOT_FOUND(HttpStatus.NOT_FOUND, "Expense not found."),
    INVALID_EXPENSE_TYPE(HttpStatus.BAD_REQUEST, "Expense type is not supported."),
    EXPENSE_ALREADY_DELETED(HttpStatus.CONFLICT, "Expense already deleted."),
    NOT_PARTICIPANT(HttpStatus.FORBIDDEN, "User is not a valid participant."),

    // === Currency ===
    UNSUPPORTED_CURRENCY(HttpStatus.BAD_REQUEST, "Currency not supported."),
    EXCHANGE_RATE_FETCH_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "Failed to fetch exchange rate."),

    // === Validation ===
    MISSING_REQUIRED_FIELDS(HttpStatus.BAD_REQUEST, "Missing required fields."),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "Invalid input data.");

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }

    public int getHttpCode() {
        return httpStatus.value();
    }
}

