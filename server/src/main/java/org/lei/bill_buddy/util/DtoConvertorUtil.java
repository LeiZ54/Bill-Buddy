package org.lei.bill_buddy.util;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.History;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ExpenseService;
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
    private final Gson gson;

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
        ExpenseSummaryDTO expenseSummary =
                expenseService.getExpenseSummary(userService.getCurrentUser().getId(), expenseService.getExpensesByGroupId(group.getId()));
        GroupDetailsDTO dto = new GroupDetailsDTO();
        dto.setGroupId(group.getId());
        dto.setGroupName(group.getName());
        dto.setOwesCurrentUser(formatExpenseSummary(expenseSummary.getUserIds(), expenseSummary.getOwesCurrentUser()));
        dto.setCurrentUserOwes(formatExpenseSummary(expenseSummary.getUserIds(), expenseSummary.getCurrentUserOwes()));
        return dto;
    }

    public HistoryDTO convertHistoryToHistoryDTO(History history) {
        HistoryDTO dto = new HistoryDTO();
        dto.setId(history.getId());
        dto.setGroup(convertGroupToGroupDTO(history.getGroup()));
        Map<Long, BigDecimal> currentUserLent = gson.fromJson(history.getUserLentJson(), new TypeToken<Map<Long, BigDecimal>>() {
        }.getType());
        Map<Long, BigDecimal> currentUserPaid = gson.fromJson(history.getUserPaidJson(), new TypeToken<Map<Long, BigDecimal>>() {
        }.getType());
        List<Long> userIds = gson.fromJson(history.getMemberIds(), new TypeToken<List<Long>>() {
        }.getType());
        dto.setCurrentUserLent(formatExpenseSummary(userIds, currentUserLent));
        dto.setCurrentUserPaid(formatExpenseSummary(userIds, currentUserPaid));
        List<Expense> expenses = expenseService.getExpensesByExpenseIdS(gson.fromJson(history.getExpenseIds(), new TypeToken<List<Long>>() {
        }.getType()));
        dto.setExpenses(expenses.stream().map(this::convertExpenseToExpenseDTO).toList());
        dto.setGenerateTime(history.getCreatedAt());
        return dto;
    }

    private Map<String, BigDecimal> formatExpenseSummary(List<Long> userIds, Map<Long, BigDecimal> expenseSummary) {
        Map<Long, String> usernameMap = new HashMap<>();
        Map<String, BigDecimal> formated = new HashMap<>();
        for (User usersById : userService.getUsersByIds(userIds)) {
            usernameMap.put(usersById.getId(), usersById.getUsername());
        }
        expenseSummary.forEach((k, v) -> {
            formated.put(usernameMap.get(k), v);
        });
        return formated;
    }

}
