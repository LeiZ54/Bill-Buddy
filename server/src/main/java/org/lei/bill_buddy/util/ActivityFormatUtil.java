package org.lei.bill_buddy.util;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActivityFormatUtil {

    private final UserService userService;
    private final ExpenseService expenseService;
    private final GroupService groupService;

    private static final Gson GSON = new Gson();
    private static final Type PARAMS_MAP_TYPE = new TypeToken<Map<String, Object>>() {
    }.getType();
    private static final Type CHANGES_LIST_TYPE = new TypeToken<List<Map<String, String>>>() {
    }.getType();

    public String formatActivityDescriptionAsHtml(String templateKey, String paramsJson) {
        Map<String, Object> params = GSON.fromJson(paramsJson, PARAMS_MAP_TYPE);

        try {
            return switch (templateKey) {
                case "user_created_group" -> formatUserCreatedGroup(params);
                case "user_deleted_group" -> formatUserDeletedGroup(params);
                case "user_updated_group_name" -> formatUserUpdatedGroupName(params);
                case "user_invited_user_to_group" -> formatUserInvitedUserToGroup(params);
                case "user_added_expense_to_group" -> formatUserAddedExpense(params);
                case "user_updated_expense" -> formatUserUpdatedExpense(params);
                case "user_deleted_expense" -> formatUserDeletedExpense(params);
                default -> "Unknown Activity";
            };
        } catch (Exception e) {
            log.error("Failed to format activity html", e);
            return "Unknown Activity";
        }
    }


    private String formatUserCreatedGroup(Map<String, Object> params) {
        String creatorName = formatUserName(getLong(params, "userId"));
        String groupName = formatGroupName(getLong(params, "groupId"));
        return String.format("<b>%s</b> created group <b>%s</b>", creatorName, groupName);
    }

    private String formatUserDeletedGroup(Map<String, Object> params) {
        String creatorName = formatUserName(getLong(params, "userId"));
        String groupName = formatGroupName(getLong(params, "groupId"));
        return String.format("<b>%s</b> deleted group <b>%s</b>", creatorName, groupName);
    }

    private String formatUserUpdatedGroupName(Map<String, Object> params) {
        String updaterName = formatUserName(getLong(params, "updaterId"));
        String oldGroupName = escapeHtml(String.valueOf(params.get("oldGroupName")));
        String newGroupName = escapeHtml(String.valueOf(params.get("newGroupName")));
        return String.format("<b>%s</b> renamed group from <b>%s</b> to <b>%s</b>", updaterName, oldGroupName, newGroupName);
    }

    private String formatUserInvitedUserToGroup(Map<String, Object> params) {
        String inviterName = formatUserName(getLong(params, "inviterId"));
        String inviteeName = formatUserName(getLong(params, "inviteeId"));
        String groupName = formatGroupName(getLong(params, "groupId"));
        return String.format("<b>%s</b> invited <b>%s</b> to join group <b>%s</b>", inviterName, inviteeName, groupName);
    }

    private String formatUserAddedExpense(Map<String, Object> params) {
        String userName = formatUserName(getLong(params, "userId"));
        String expenseTitle = formatExpenseTitle(getLong(params, "expenseId"));
        String groupName = formatGroupName(getLong(params, "groupId"));
        return String.format("<b>%s</b> added expense <i>\"%s\"</i> to group <b>%s</b>", userName, expenseTitle, groupName);
    }

    private String formatUserUpdatedExpense(Map<String, Object> params) {
        String userName = formatUserName(getLong(params, "userId"));
        String expenseTitle = formatExpenseTitle(getLong(params, "expenseId"));
        String groupName = formatGroupName(getLong(params, "groupId"));

        String baseHtml = String.format("<b>%s</b> updated expense <i>\"%s\"</i> in group <b>%s</b>", userName, expenseTitle, groupName);

        Object changesObj = params.get("changes");
        if (changesObj == null) return baseHtml;

        List<Map<String, String>> changes = GSON.fromJson(GSON.toJson(changesObj), CHANGES_LIST_TYPE);
        if (changes == null || changes.isEmpty()) return baseHtml;

        StringBuilder changeDetails = new StringBuilder("<ul>");
        for (Map<String, String> change : changes) {
            String field = change.get("field");
            if ("participant_added".equals(field)) {
                changeDetails.append(String.format("<li>Added participants: <i>%s</i></li>", parseParticipantNames(change.get("value"))));
            } else if ("participant_removed".equals(field)) {
                changeDetails.append(String.format("<li>Removed participants: <i>%s</i></li>", parseParticipantNames(change.get("value"))));
            } else {
                String before = change.getOrDefault("before", "");
                String after = change.getOrDefault("after", "");

                changeDetails.append(String.format(
                        "<li>Changed <b>%s</b> from <i>%s</i> to <i>%s</i></li>",
                        escapeHtml(field),
                        escapeHtml(before),
                        escapeHtml(after)
                ));
            }
        }
        changeDetails.append("</ul>");

        return baseHtml + changeDetails;
    }

    private String formatUserDeletedExpense(Map<String, Object> params) {
        String userName = formatUserName(getLong(params, "userId"));
        String expenseTitle = formatExpenseTitle(getLong(params, "expenseId"));
        String groupName = formatGroupName(getLong(params, "groupId"));
        return String.format("<b>%s</b> deleted expense <i>\"%s\"</i> from group <b>%s</b>", userName, expenseTitle, groupName);
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) throw new IllegalArgumentException("Missing param: " + key);
        return Long.valueOf(String.valueOf(value));
    }

    private String formatUserName(Long userId) {
        User user = userService.getUserByIdIncludeDeleted(userId);
        if (user == null) return "<b>Undefined User</b>";
        String name = escapeHtml(user.getFullName());
        if (user.getDeleted()) {
            return "<b><s>" + name + "</s></b>";
        } else {
            return "<b>" + name + "</b>";
        }
    }

    private String formatGroupName(Long groupId) {
        Group group = groupService.getGroupByIdIncludeDeleted(groupId);
        if (group == null) return "<b>Undefined Group</b>";
        String name = escapeHtml(group.getName());
        if (group.getDeleted()) {
            return "<b><s>" + name + "</s></b>";
        } else {
            return "<b>" + name + "</b>";
        }
    }

    private String formatExpenseTitle(Long expenseId) {
        Expense expense = expenseService.getExpenseByIdIncludeDeleted(expenseId);
        if (expense == null) return "<b>Undefined Expense</b>";
        String title = escapeHtml(expense.getTitle());
        if (expense.getDeleted()) {
            return "<b><s>" + title + "</s></b>";
        } else {
            return "<b>" + title + "</b>";
        }
    }

    private String parseParticipantNames(String idsString) {
        if (idsString == null || idsString.isBlank()) return "";
        List<Long> ids = Arrays.stream(idsString.split(",")).map(Long::valueOf).toList();
        List<User> users = userService.getUsersByIds(ids);
        return users.stream().map(User::getFullName).sorted().collect(Collectors.joining(", "));
    }

    private String wrapStrikethrough(String text) {
        return "<s>" + escapeHtml(text) + "</s>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}
