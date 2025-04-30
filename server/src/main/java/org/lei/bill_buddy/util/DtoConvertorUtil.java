package org.lei.bill_buddy.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.GroupType;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.service.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DtoConvertorUtil {
    private final UserService userService;
    private final ExpenseService expenseService;
    private final GroupDebtService groupDebtService;
    private final ActivityFormatUtil activityFormatUtil;
    private final ActivityService activityService;
    private final GroupService groupService;
    private final ExchangeRateService exchangeRateService;

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
        dto.setSettled(expense.getSettled());
        return dto;
    }

    public ExpenseDetailsDTO convertExpenseToExpenseDetailsDTO(Expense expense) {
        List<ShareOfUserDTO> shares = new ArrayList<>();
        User currentUser = userService.getCurrentUser();
        expenseService.getExpenseSharesByExpenseId(expense.getId())
                .forEach(s -> {
                    shares.add(new ShareOfUserDTO(
                            convertUserToUserDTO(userService.getUserById(s.getUser().getId())),
                            s.getShareAmount())
                    );
                });
        StringBuilder logs = new StringBuilder();
        List<Activity> activities = activityService.getActivitiesByExpenseId(expense.getId());
        for (Activity activity : activities) {
            logs.append("<p>");
            logs.append(activityFormatUtil.formatActivityDescriptionAsHtml(activity.getTemplate(), activity.getParams()));
            logs.append("</p>");
        }
        ExpenseDetailsDTO dto = new ExpenseDetailsDTO();
        dto.setId(expense.getId());
        dto.setGroupId(expense.getGroup().getId());
        dto.setPicture(expense.getPicture());
        dto.setTitle(expense.getTitle());
        dto.setAmount(expense.getAmount());
        dto.setDescription(expense.getDescription());
        dto.setCurrency(expense.getGroup().getDefaultCurrency().name());
        dto.setPayer(convertUserToUserDTO(expense.getPayer()));
        dto.setDebtsAmount(calculateExpenseDebtsAmount(currentUser.getId(), expense));
        dto.setShares(shares);
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setType(expense.getType());
        dto.setLogs(logs.toString());
        dto.setSettled(expense.getSettled());
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

    public GroupForFriendDTO convertGroupToGroupForFriendDTO(Group group, Long userId) {
        GroupForFriendDTO dto = new GroupForFriendDTO();
        dto.setGroupId(group.getId());
        dto.setGroupName(group.getName());
        dto.setType(group.getType().name());
        dto.setDefaultCurrency(group.getDefaultCurrency().name());
        dto.setInGroup(groupService.isMemberOfGroup(userId, group.getId()));
        return dto;
    }

    public GroupDetailsDTO convertGroupToGroupDetailsDTO(Group group) {
        User currentUser = userService.getCurrentUser();
        Map<Long, BigDecimal> netDebts = groupDebtService.getUserDebtsOfGroup(currentUser.getId(), group.getId());

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

    public SettleInfoDTO formatSettleInfoDTO(User user, Group group) {
        SettleInfoDTO dto = new SettleInfoDTO();
        dto.setGroupId(group.getId());
        Map<Long, BigDecimal> debts = groupDebtService.getUserDebtsOfGroup(user.getId(), group.getId());
        List<DebtsOfAllCurrenciesDTO> debtsOfAllCurrencies = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : debts.entrySet()) {
            Long otherUserId = entry.getKey();
            BigDecimal amount = entry.getValue();
            Map<Currency, BigDecimal> debtsOfCurrencies = new EnumMap<>(Currency.class);
            if (amount.compareTo(BigDecimal.ZERO) < 0) {
                for (Currency tgt : Currency.values()) {
                    BigDecimal converted = exchangeRateService.convert(amount.abs(), group.getDefaultCurrency(), tgt)
                            .setScale(2, RoundingMode.HALF_UP);
                    debtsOfCurrencies.put(tgt, converted);
                }
                debtsOfAllCurrencies.add(new DebtsOfAllCurrenciesDTO(
                        convertUserToUserDTO(userService.getUserById(otherUserId)),
                        debtsOfCurrencies));
            }
        }
        dto.setDebts(debtsOfAllCurrencies);
        dto.setGroupCurrency(group.getDefaultCurrency());
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

    public FriendListOfGroupDTO convertUserToFriendListOfGroupDTO(User user, Set<Long> memberIds) {
        FriendListOfGroupDTO dto = new FriendListOfGroupDTO();
        dto.setId(user.getId());
        dto.setAvatar(user.getAvatar());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setInGroup(memberIds.contains(user.getId()));
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
                accessible = !(group == null || Boolean.TRUE.equals(group.getDeleted()) || !groupService.isMemberOfGroup(currentUser.getId(), group.getId()));
                objectPicture = (group != null) ? group.getType().getImageUrl() : GroupType.OTHER.getImageUrl();
            }
            case EXPENSE -> {
                Expense expense = expenseService.getExpenseByIdIncludeDeleted(activity.getObjectId());
                accessible = !(expense == null || Boolean.TRUE.equals(expense.getDeleted()) || !groupService.isMemberOfGroup(currentUser.getId(), expense.getGroup().getId()));
                objectPicture = (expense != null) ? expense.getType().getImageUrl() : ExpenseType.OTHER.getImageUrl();
            }
        }

        dto.setObjectId(activity.getObjectId());
        dto.setAccessible(accessible);
        dto.setObjectPicture(objectPicture);
        dto.setCreatedAt(activity.getCreatedAt());
        dto.setDescriptionHtml(activityFormatUtil.formatActivityDescriptionAsHtml(activity.getTemplate(), activity.getParams()));
        return dto;
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
