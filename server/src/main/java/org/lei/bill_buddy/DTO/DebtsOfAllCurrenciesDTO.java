package org.lei.bill_buddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.lei.bill_buddy.enums.Currency;

import java.math.BigDecimal;
import java.util.Map;

@Data
@AllArgsConstructor
public class DebtsOfAllCurrenciesDTO {
    UserDTO user;
    Map<Currency, BigDecimal> debts;
}
