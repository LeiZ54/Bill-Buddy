package org.lei.bill_buddy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.lei.bill_buddy.DTO.FriendRequestDTO;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.service.FriendService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.main.allow-bean-definition-overriding=true")
@AutoConfigureMockMvc(addFilters = false)
class FriendControllerTest {

    @Autowired MockMvc mvc;
    @Autowired FriendService friendService;
    @Autowired UserService userService;
    @Autowired DtoConvertorUtil dto;

    ObjectMapper om = new ObjectMapper();

    @Test
    void getFriends_page_ok() throws Exception {
        User u = new User(); u.setId(1L);
        User friend = new User(); friend.setId(3L);
        Friend rel = new Friend(); rel.setFriend(friend);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(friendService.getFriendsByUserIdAndSearch(
                        eq(1L), eq(""), org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenReturn(new PageImpl<>(List.of(rel)));
        Mockito.when(dto.convertUserToFriendDetailsDTO(friend)).thenReturn(new org.lei.bill_buddy.DTO.FriendDetailsDTO());
        Mockito.when(friendService.getFriendRequestsByReceiverIdAndStatus(1L,"pending")).thenReturn(List.of());
        mvc.perform(get("/api/friends")).andExpect(status().isOk()).andExpect(jsonPath("$.friends.content",hasSize(1)));
    }

    @Test
    void getFriend_ok() throws Exception {
        User u = new User(); u.setId(1L);
        User target = new User(); target.setId(4L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(friendService.isFriend(1L,4L)).thenReturn(true);
        Mockito.when(userService.getUserById(4L)).thenReturn(target);
        Mockito.when(dto.convertUserToFriendDetailsDTO(target)).thenReturn(new org.lei.bill_buddy.DTO.FriendDetailsDTO());
        mvc.perform(get("/api/friends/4")).andExpect(status().isOk());
    }

    @Test
    void deleteFriend_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(friendService.isFriend(1L,5L)).thenReturn(true);
        mvc.perform(delete("/api/friends/5")).andExpect(status().isOk()).andExpect(content().string(containsString("deleted")));
    }

    @TestConfiguration
    static class MockCfg {
        @Bean @Primary FriendService a(){ return Mockito.mock(FriendService.class);}
        @Bean @Primary UserService b(){ return Mockito.mock(UserService.class);}
        @Bean @Primary DtoConvertorUtil c(){ return Mockito.mock(DtoConvertorUtil.class);}
    }
}

