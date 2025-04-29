package org.lei.bill_buddy.service;

import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.enums.ActionType;
import org.lei.bill_buddy.enums.ObjectType;
import org.lei.bill_buddy.model.Activity;
import org.lei.bill_buddy.repository.ActivityRepository;
import org.lei.bill_buddy.repository.ExpenseRepository;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final Gson gson = new Gson();

    @Transactional(readOnly = true)
    public Page<Activity> getActivitiesByUserId(Long userId, Pageable pageable) {
        log.info("Fetching activities for userId={} with paging", userId);
        List<Long> groupIds = groupMemberRepository.findGroupIdsByUserIdAndDeletedFalse(userId);
        List<Long> expenseIds = expenseRepository.findIdsByGroupIdInAndDeletedFalse(groupIds);
        System.out.println(expenseIds);
        return activityRepository.findByExpenseIdsAndGroupIdsOrderByCreatedAtDesc(
                expenseIds,
                groupIds,
                pageable);
    }

    @Transactional(readOnly = true)
    public List<Activity> getActivitiesByExpenseId(Long expenseId) {
        log.info("Fetching activities for expenseId={}", expenseId);
        return activityRepository.findByObjectTypeAndObjectIdOrderByCreatedAtDesc(ObjectType.EXPENSE, expenseId);
    }

    @Transactional
    public void log(ActionType action, ObjectType objectType, Long objectId, String template, Map<String, Object> params) {
        Activity activity = new Activity();
        activity.setUserId(userService.getCurrentUser().getId());
        activity.setAction(action);
        activity.setObjectType(objectType);
        activity.setObjectId(objectId);
        activity.setTemplate(template);
        activity.setParams(gson.toJson(params));
        activity.setCreatedAt(LocalDateTime.now());

        activityRepository.save(activity);
    }
}

