package org.lei.bill_buddy.controller;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.ActivityDTO;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.service.ActivityService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RateLimit
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {
    private final ActivityService activityService;
    private final UserService userService;
    private final DtoConvertorUtil dtoConvertorUtil;

    @GetMapping
    public ResponseEntity<?> getMyActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long currentUserId = userService.getCurrentUser().getId();
        Pageable pageable = PageRequest.of(page, size);

        Page<ActivityDTO> activities = activityService.getActivitiesByUserId(currentUserId, pageable).map(dtoConvertorUtil::convertActivityToActivityDTO);
        return ResponseEntity.ok(activities);
    }
}
