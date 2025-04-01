package org.lei.bill_buddy.util;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.ExpenseDTO;
import org.lei.bill_buddy.DTO.GroupDTO;
import org.lei.bill_buddy.DTO.GroupDetailsDTO;
import org.lei.bill_buddy.DTO.UserDTO;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.model.ExpenseShare;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.HistoryService;
import org.lei.bill_buddy.service.UserService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DtoConvertorUtil {
    private final UserService userService;
    private final ExpenseService expenseService;
    private final HistoryService historyService;
    private final GroupService groupService;

    public UserDTO convertUserToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setGivenName(user.getGivenName());
        dto.setFamilyName(user.getFamilyName());
        return dto;
    }

    public ExpenseDTO convertExpenseToExpenseDTO(Expense expense) {
        Map<String, BigDecimal> shares = new HashMap<>();
        expenseService.getExpenseSharesByExpenseId(expense.getId())
                .forEach(s -> {
                    shares.put(s.getUser().getUsername(), s.getShareAmount());
                });
        ExpenseDTO expenseDTO = new ExpenseDTO();
        expenseDTO.setId(expense.getId());
        expenseDTO.setAmount(expense.getAmount());
        expenseDTO.setDescription(expense.getDescription());
        expenseDTO.setCurrency(expense.getCurrency());
        expenseDTO.setPayer(convertUserToUserDTO(expense.getPayer()));
        expenseDTO.setShares(shares);
        expenseDTO.setExpenseDate(expense.getExpenseDate());
        return expenseDTO;
    }

    public GroupDTO convertGroupToGroupDTO(Group group) {
        GroupDTO groupDTO = new GroupDTO();
        groupDTO.setGroupId(group.getId());
        groupDTO.setGroupName(group.getName());
        groupDTO.setType(group.getType());
        return groupDTO;
    }

    public GroupDetailsDTO convertGroupToGroupDetailsDTO(Group group) {
        Map<Long, BigDecimal> balances = new HashMap<>();
        Map<Long, String> userIdToUsername = new HashMap<>();
        Long currentUserId = userService.getCurrentUser().getId();

        for (ExpenseShare share : expenseService.getExpenseSharesByGroupId(group.getId())) {
            Long payerId = share.getExpense().getPayer().getId();
            Long userId = share.getUser().getId();
            BigDecimal amount = share.getShareAmount();

            if (payerId.equals(currentUserId) && !userId.equals(currentUserId)) {
                balances.merge(userId, amount, BigDecimal::add);
                userIdToUsername.putIfAbsent(userId, share.getUser().getUsername());
            } else if (userId.equals(currentUserId) && !payerId.equals(currentUserId)) {
                balances.merge(payerId, amount.negate(), BigDecimal::add);
                userIdToUsername.putIfAbsent(payerId, share.getExpense().getPayer().getUsername());
            }
        }

        Map<String, BigDecimal> owesCurrentUser = new HashMap<>();
        Map<String, BigDecimal> currentUserOwes = new HashMap<>();

        for (Map.Entry<Long, BigDecimal> entry : balances.entrySet()) {
            String username = userIdToUsername.get(entry.getKey());
            BigDecimal balance = entry.getValue();

            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                owesCurrentUser.put(username, balance);
            } else if (balance.compareTo(BigDecimal.ZERO) < 0) {
                currentUserOwes.put(username, balance.abs());
            }
        }

        GroupDetailsDTO dto = new GroupDetailsDTO();
        dto.setGroupId(group.getId());
        dto.setGroupName(group.getName());
        dto.setOwesCurrentUser(owesCurrentUser);
        dto.setCurrentUserOwes(currentUserOwes);
        return dto;
    }
}
