package org.lei.bill_buddy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.lei.bill_buddy.DTO.GroupCreateRequest;
import org.lei.bill_buddy.DTO.GroupDetailsDTO;
import org.lei.bill_buddy.enums.GroupType;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.*;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.lei.bill_buddy.util.JwtUtil;
import org.lei.bill_buddy.util.RateLimiterUtil;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.main.allow-bean-definition-overriding=true",
        "bill-buddy.client.url=http://localhost"
})
@AutoConfigureMockMvc(addFilters = false)
class GroupControllerTest {

    @Autowired MockMvc mvc;
    @Autowired GroupService groupService;
    @Autowired UserService userService;
    @Autowired GroupDebtService groupDebtService;
    @Autowired DtoConvertorUtil dto;

    ObjectMapper om = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void create_get_delete_group() throws Exception {
        User u = new User(); u.setId(1L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);

        Group g = new Group(); g.setId(50L); g.setName("T"); g.setCreator(u);
        Mockito.when(groupService.createGroup(anyString(), anyString(), anyString(), any())).thenReturn(g);
        Mockito.when(dto.convertGroupToGroupDTO(g)).thenReturn(new org.lei.bill_buddy.DTO.GroupDTO());

        GroupCreateRequest req = new GroupCreateRequest();
        req.setGroupName("T"); req.setType("OTHER"); req.setDefaultCurrency("USD");

        mvc.perform(post("/api/groups").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(req)))
                .andExpect(status().isOk());

        Mockito.when(groupService.isMemberOfGroup(1L,50L)).thenReturn(true);
        Mockito.when(groupService.getGroupById(50L)).thenReturn(g);
        Mockito.when(dto.convertGroupToGroupDetailsDTO(g)).thenReturn(new GroupDetailsDTO());

        mvc.perform(get("/api/groups/50")).andExpect(status().isOk());

        Mockito.when(groupDebtService.isGroupSettled(50L)).thenReturn(true);

        mvc.perform(delete("/api/groups/50")).andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("deleted")));
    }

    @Test
    void invite_link() throws Exception {
        Group g = new Group(); g.setId(30L); g.setName("A"); g.setType(GroupType.OTHER);
        Mockito.when(groupService.getGroupById(30L)).thenReturn(g);
        mvc.perform(get("/api/groups/30/invitation-link"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.inviteLink").exists());
    }

    @TestConfiguration
    static class M {
        @Bean @Primary GroupService a(){ return Mockito.mock(GroupService.class);}
        @Bean @Primary GroupMemberService b(){ return Mockito.mock(GroupMemberService.class);}
        @Bean @Primary UserService c(){ return Mockito.mock(UserService.class);}
        @Bean @Primary JwtUtil d(){ return Mockito.mock(JwtUtil.class);}
        @Bean @Primary DtoConvertorUtil e(){ return Mockito.mock(DtoConvertorUtil.class);}
        @Bean @Primary EmailProducer f(){ return Mockito.mock(EmailProducer.class);}
        @Bean @Primary RateLimiterUtil g(){ return Mockito.mock(RateLimiterUtil.class);}
        @Bean @Primary GroupDebtService h(){ return Mockito.mock(GroupDebtService.class);}
        @Bean @Primary ActivityService j(){ return Mockito.mock(ActivityService.class);}
        @Bean @Primary GroupDeleteService k(){ return Mockito.mock(GroupDeleteService.class);}
    }
}

