package org.lei.bill_buddy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.lei.bill_buddy.DTO.ActivityDTO;
import org.lei.bill_buddy.enums.ObjectType;
import org.lei.bill_buddy.model.Activity;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ActivityService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.main.allow-bean-definition-overriding=true")
@AutoConfigureMockMvc(addFilters = false)
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private UserService userService;

    @Autowired
    private DtoConvertorUtil dtoConvertorUtil;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void getMyActivities_returns_page() throws Exception {
        User u = new User();
        u.setId(1L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);

        ActivityDTO dto = new ActivityDTO();
        dto.setId(74L);
        dto.setUserAvatar("https://i.ibb.co/SDVtc10F/avatar.png");
        dto.setObjectPicture("https://i.ibb.co/DskRTdF/SETTLE-UP.png");
        dto.setObjectType(ObjectType.EXPENSE);
        dto.setObjectId(36L);
        dto.setDescriptionHtml("<b><b>Lei Zhu</b></b> settled USD 123.00 to <b><b>L1 Zhu</b></b> in group <b><b>Test Invite</b></b>");
        dto.setAccessible(true);
        dto.setCreatedAt(LocalDateTime.now());

        Activity mockActivity = Mockito.mock(Activity.class);
        Page<Activity> page = new PageImpl<>(List.of(mockActivity), PageRequest.of(0, 10), 1);
        Mockito.when(activityService.getActivitiesByUserId(eq(1L), any(Pageable.class))).thenReturn(page);
        Mockito.when(dtoConvertorUtil.convertActivityToActivityDTO(mockActivity)).thenReturn(dto);

        mockMvc.perform(get("/api/activities")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(74L))
                .andExpect(jsonPath("$.content[0].objectType").value("EXPENSE"))
                .andExpect(jsonPath("$.content[0].objectId").value(36L));
    }

    @TestConfiguration
    static class MockConfig {
        @Bean @Primary
        ActivityService activityService() { return Mockito.mock(ActivityService.class); }
        @Bean @Primary
        UserService userService() { return Mockito.mock(UserService.class); }
        @Bean @Primary
        DtoConvertorUtil dtoConvertorUtil() { return Mockito.mock(DtoConvertorUtil.class); }
    }
}
