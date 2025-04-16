package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;

@Data
public class GroupPageDTO {
    private BigDecimal totalCurrentUserDebts;
    private Page<GroupDetailsDTO> groupPage;
}