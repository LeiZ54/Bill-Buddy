package org.lei.bill_buddy.util;

import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.ExpenseSummaryService;
import org.lei.bill_buddy.service.GroupDebtService;
import org.lei.bill_buddy.service.UserService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DtoConvertorUtil {
    private final UserService userService;
    private final ExpenseService expenseService;
    private final ExpenseSummaryService expenseSummaryService;
    private final GroupDebtService groupDebtService;
    private final Gson gson;

    public UserDTO convertUserToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setGivenName(user.getGivenName());
        dto.setFamilyName(user.getFamilyName());
        dto.setEmail(user.getEmail());
        return dto;
    }

    public ExpenseDTO convertExpenseToExpenseDTO(Expense expense) {
        User currentUser = userService.getCurrentUser();
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(expense.getId());
        dto.setTitle(expense.getTitle());
        dto.setAmount(expense.getAmount());
        dto.setCurrency(expense.getCurrency().name());
        dto.setPayer(convertUserToUserDTO(expense.getPayer()));
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setType(expense.getType());
        dto.setDebtsAmount(calculateExpenseDebtsAmount(currentUser.getId(), expense));
        return dto;
    }

    public ExpenseDetailsDTO convertExpenseToExpenseDetailsDTO(Expense expense) {
        Map<String, BigDecimal> shares = new HashMap<>();
        User currentUser = userService.getCurrentUser();
        expenseService.getExpenseSharesByExpenseId(expense.getId())
                .forEach(s -> shares.put(s.getUser().getFullName(), s.getShareAmount()));

        ExpenseDetailsDTO dto = new ExpenseDetailsDTO();
        dto.setId(expense.getId());
        dto.setTitle(expense.getTitle());
        dto.setAmount(expense.getAmount());
        dto.setDescription(expense.getDescription());
        dto.setCurrency(expense.getCurrency().name());
        dto.setPayer(convertUserToUserDTO(expense.getPayer()));
        dto.setDebtsAmount(calculateExpenseDebtsAmount(currentUser.getId(), expense));
        dto.setShares(shares);
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setType(expense.getType());
        dto.setIsRecurring(expense.getIsRecurring());
        dto.setRecurrenceUnit(expense.getRecurrenceUnit());
        dto.setRecurrenceInterval(expense.getRecurrenceInterval());
        return dto;
    }


    public GroupDTO convertGroupToGroupDTO(Group group) {
        GroupDTO groupDTO = new GroupDTO();
        groupDTO.setGroupId(group.getId());
        groupDTO.setGroupName(group.getName());
        groupDTO.setType(group.getType().name());
        groupDTO.setDefaultCurrency(group.getDefaultCurrency().name());
        return groupDTO;
    }

    public GroupDetailsDTO convertGroupToGroupDetailsDTO(Group group) {
        User currentUser = userService.getCurrentUser();
        List<GroupDebt> owesUser = groupDebtService.getByGroupAndLender(group, currentUser);
        List<GroupDebt> userOwes = groupDebtService.getByGroupAndBorrower(group, currentUser);

        Map<Long, BigDecimal> netDebts = formatDebtsMap(userOwes, owesUser);

        Map<String, BigDecimal> currentUserOwes = new HashMap<>();
        Map<String, BigDecimal> owesCurrentUser = new HashMap<>();
        BigDecimal totalDebts = BigDecimal.ZERO;

        for (Map.Entry<Long, BigDecimal> entry : netDebts.entrySet()) {
            Long otherUserId = entry.getKey();
            BigDecimal netAmount = entry.getValue();

            if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
                String name = userService.getUserById(otherUserId).getFullName();
                owesCurrentUser.put(name, netAmount);
                totalDebts = totalDebts.add(netAmount);
            } else if (netAmount.compareTo(BigDecimal.ZERO) < 0) {
                String name = userService.getUserById(otherUserId).getFullName();
                currentUserOwes.put(name, netAmount.abs());
                totalDebts = totalDebts.add(netAmount);
            }
        }

        GroupDetailsDTO dto = new GroupDetailsDTO();
        dto.setGroupId(group.getId());
        dto.setGroupName(group.getName());
        dto.setType(group.getType().name());
        dto.setDefaultCurrency(group.getDefaultCurrency().name());
        dto.setTotalDebts(totalDebts);
        dto.setOwesCurrentUser(owesCurrentUser);
        dto.setCurrentUserOwes(currentUserOwes);
        return dto;
    }

    private static Map<Long, BigDecimal> formatDebtsMap(List<GroupDebt> userOwes, List<GroupDebt> owesUser) {
        Map<Long, BigDecimal> netDebts = new HashMap<>();

        for (GroupDebt debt : userOwes) {
            Long otherUserId = debt.getLender().getId();
            netDebts.put(otherUserId, netDebts.getOrDefault(otherUserId, BigDecimal.ZERO).subtract(debt.getAmount()));
        }

        for (GroupDebt debt : owesUser) {
            Long otherUserId = debt.getBorrower().getId();
            netDebts.put(otherUserId, netDebts.getOrDefault(otherUserId, BigDecimal.ZERO).add(debt.getAmount()));
        }
        return netDebts;
    }

    private BigDecimal calculateExpenseDebtsAmount(Long userId, Expense expense) {

        List<ExpenseShare> shares = expenseService.getExpenseSharesByExpenseId(expense.getId());

        boolean isPayer = expense.getPayer().getId().equals(userId);

        BigDecimal userShare = shares.stream()
                .filter(share -> share.getUser().getId().equals(userId))
                .map(ExpenseShare::getShareAmount)
                .findFirst()
                .orElse(BigDecimal.ZERO);

        return isPayer
                ? expense.getAmount().subtract(userShare)
                : userShare.negate();
    }
}
