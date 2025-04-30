package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import lombok.NonNull;
import org.lei.bill_buddy.enums.Currency;

import java.math.BigDecimal;

@Data
public class SettleUpRequest {
    @NonNull
    private Long to;
    @NonNull
    private Long groupId;
    @NonNull
    private Currency currency;
    @NonNull
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;
}
