package org.lei.bill_buddy.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.GroupType;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupDebtService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DtoConvertorUtil {
    private final UserService userService;
    private final ExpenseService expenseService;
    private final GroupDebtService groupDebtService;
    private final ActivityFormatUtil activityFormatUtil;
    private final GroupService groupService;

    public UserDTO convertUserToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setAvatar(user.getAvatar());
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
        dto.setCurrency(expense.getGroup().getDefaultCurrency().name());
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
        dto.setCurrency(expense.getGroup().getDefaultCurrency().name());
        dto.setPayer(convertUserToUserDTO(expense.getPayer()));
        dto.setDebtsAmount(calculateExpenseDebtsAmount(currentUser.getId(), expense));
        dto.setShares(shares);
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setType(expense.getType());
        return dto;
    }

    public RecurringExpenseDTO convertRecurringExpenseToRecurringExpenseDTO(RecurringExpense expense) {
        RecurringExpenseDTO dto = new RecurringExpenseDTO();
        dto.setId(expense.getId());
        dto.setTitle(expense.getTitle());
        dto.setType(expense.getType());
        return dto;
    }

    public RecurringExpenseDetailsDTO convertRecurringExpenseToRecurringExpenseDetailsDTO(RecurringExpense expense) {
        RecurringExpenseDetailsDTO dto = new RecurringExpenseDetailsDTO();
        dto.setId(expense.getId());
        dto.setTitle(expense.getTitle());
        dto.setType(expense.getType());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setPayer(convertUserToUserDTO(expense.getPayer()));
        List<UserDTO> participants = userService.getUsersByIds(expense.getParticipantIds()).stream().map(this::convertUserToUserDTO).toList();
        dto.setParticipants(participants);
        dto.setShareAmounts(expense.getShareAmounts());
        dto.setCreatedAt(expense.getCreatedAt());
        dto.setStartDate(expense.getStartDate());
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

    public FriendDetailsDTO convertUserToFriendDetailsDTO(User user) {
        User currentUser = userService.getCurrentUser();

        List<GroupDebtDTO> netDebts = groupDebtService.getNetDebtsBetweenUsers(currentUser.getId(), user.getId()).entrySet().stream()
                .map(entry -> {
                    GroupDebtDTO dto = new GroupDebtDTO();
                    dto.setGroup(convertGroupToGroupDTO(entry.getKey()));
                    dto.setDebtAmount(entry.getValue());
                    return dto;
                })
                .toList();
        FriendDetailsDTO dto = new FriendDetailsDTO();
        dto.setId(user.getId());
        dto.setAvatar(user.getAvatar());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setNetDebts(netDebts);

        return dto;
    }

    public ActivityDTO convertActivityToActivityDTO(Activity activity) {
        User currentUser = userService.getCurrentUser();
        ActivityDTO dto = new ActivityDTO();
        dto.setId(activity.getId());
        dto.setUserAvatar(userService.getUserById(activity.getUserId()).getAvatar());
        dto.setObjectType(activity.getObjectType());
        boolean accessible = true;
        String objectPicture = "";

        switch (activity.getObjectType()) {
            case GROUP -> {
                Group group = groupService.getGroupByIdIncludeDeleted(activity.getObjectId());
                accessible = !(group == null || Boolean.TRUE.equals(group.getDeleted()));
                objectPicture = (group != null) ? group.getType().getImageUrl() : GroupType.OTHER.getImageUrl();
            }
            case EXPENSE -> {
                Expense expense = expenseService.getExpenseByIdIncludeDeleted(activity.getObjectId());
                accessible = !(expense == null || Boolean.TRUE.equals(expense.getDeleted()));
                objectPicture = (expense != null) ? expense.getType().getImageUrl() : ExpenseType.OTHER.getImageUrl();
                if (expense != null) {
                    ExpenseShare share = expenseService.getExpenseShareByUserIdAndExpenseIdIncludeDeleted(currentUser.getId(), expense.getId());
                    if (share != null) {
                        dto.setDebtAmount(
                                expense.getPayer().getId().equals(currentUser.getId()) ?
                                        expense.getAmount().subtract(share.getShareAmount())
                                        : share.getShareAmount().negate());
                    }
                }
            }
        }

        dto.setObjectId(activity.getObjectId());
        dto.setAccessible(accessible);
        dto.setObjectPicture(objectPicture);
        dto.setCreatedAt(activity.getCreatedAt());
        dto.setDescriptionHtml(activityFormatUtil.formatActivityDescriptionAsHtml(activity.getTemplate(), activity.getParams()));
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
