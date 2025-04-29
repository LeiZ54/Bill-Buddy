package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.Currency;

import java.util.List;

@Data
public class SettleInfoDTO {
    private Long groupId;
    private Currency groupCurrency;
    private List<DebtsOfAllCurrenciesDTO> debts;
}
