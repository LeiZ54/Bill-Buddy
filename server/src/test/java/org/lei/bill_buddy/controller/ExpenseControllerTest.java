package org.lei.bill_buddy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.RecurringExpense;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.*;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.main.allow-bean-definition-overriding=true")
@AutoConfigureMockMvc(addFilters = false)
class ExpenseControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ExpenseService expenseService;
    @Autowired GroupService groupService;
    @Autowired UserService userService;
    @Autowired RecurringExpenseService recurringExpenseService;
    @Autowired DtoConvertorUtil dto;

    ObjectMapper om = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Test
    void createExpense_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(groupService.isMemberOfGroup(1L, 10L)).thenReturn(true);
        Expense e = new Expense(); e.setId(55L);
        Mockito.when(expenseService.createExpense(anyLong(), anyLong(), anyString(), anyString(), any(BigDecimal.class),
                anyString(), anyString(), any(LocalDateTime.class), anyBoolean(), anyString(), anyInt(),
                anyList(), anyList())).thenReturn(e);

        ExpenseCreateRequest req = new ExpenseCreateRequest();
        req.setGroupId(10L);
        req.setPayerId(1L);
        req.setTitle("dinner");
        req.setType("OTHER");
        req.setAmount(new BigDecimal("12.30"));
        req.setCurrency("USD");
        req.setDescription("test");
        req.setExpenseDate(LocalDateTime.now());
        req.setIsRecurring(false);
        req.setParticipants(List.of(1L));
        req.setShares(List.of(new BigDecimal("12.30")));

        mvc.perform(post("/api/expenses").contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("55")));
    }

    @Test
    void getExpenseById_notMember() throws Exception {
        User u = new User(); u.setId(2L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Group g = new Group(); g.setId(20L);
        Expense e = new Expense(); e.setId(88L); e.setGroup(g);
        Mockito.when(expenseService.getExpenseById(88L)).thenReturn(e);
        Mockito.when(groupService.isMemberOfGroup(2L, 20L)).thenReturn(false);
        mvc.perform(get("/api/expenses/88"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You are not a member of the group."));
    }

    @Test
    void deleteExpense_ok() throws Exception {
        User u = new User(); u.setId(3L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Group g = new Group(); g.setId(30L);
        Expense e = new Expense(); e.setId(99L); e.setGroup(g);
        Mockito.when(expenseService.getExpenseById(99L)).thenReturn(e);
        Mockito.when(groupService.isMemberOfGroup(3L, 30L)).thenReturn(true);
        mvc.perform(delete("/api/expenses/99"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("99")));
    }

    @Test
    void settleUp_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(groupService.isMemberOfGroup(1L, 10L)).thenReturn(true);
        SettleUpRequest req = new SettleUpRequest(2L,10L, Currency.USD,new BigDecimal("20"));
        mvc.perform(post("/api/expenses/settle-up").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(req)))
                .andExpect(status().isOk()).andExpect(content().string(containsString("Settled")));
    }

    @Test
    void getExpenseById_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Group g = new Group(); g.setId(10L);
        Expense e = new Expense(); e.setId(99L); e.setGroup(g);
        ExpenseDetailsDTO dtoOut = new ExpenseDetailsDTO();
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(expenseService.getExpenseById(99L)).thenReturn(e);
        Mockito.when(groupService.isMemberOfGroup(1L, 10L)).thenReturn(true);
        Mockito.when(dto.convertExpenseToExpenseDetailsDTO(e)).thenReturn(dtoOut);
        mvc.perform(get("/api/expenses/99")).andExpect(status().isOk());
    }

    @Test
    void updateExpense_ok() throws Exception {
        ExpenseUpdateRequest req = new ExpenseUpdateRequest();
        req.setPayerId(1L); req.setTitle("t"); req.setType("OTHER"); req.setAmount(new BigDecimal("1")); req.setCurrency("USD"); req.setDescription("d"); req.setExpenseDate(LocalDateTime.now());
        req.setParticipants(List.of());
        req.setShares(List.of());
        Expense e = new Expense(); e.setId(77L);
        Mockito.when(expenseService.updateExpense(
                        anyLong(), anyLong(), anyString(), anyString(), any(BigDecimal.class),
                        anyString(), anyString(), any(LocalDateTime.class),
                        anyList(), anyList()))
                .thenReturn(e);mvc.perform(put("/api/expenses/77").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(req)))
                .andExpect(status().isOk()).andExpect(content().string(containsString("77")));
    }

    @Test
    void updatePicture_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Group g = new Group(); g.setId(10L);
        Expense e = new Expense(); e.setGroup(g);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(expenseService.getExpenseById(33L)).thenReturn(e);
        Mockito.when(groupService.isMemberOfGroup(1L, 10L)).thenReturn(true);
        ExpenseUpdatePictureRequest req = new ExpenseUpdatePictureRequest();
        req.setPicture("pic");
        mvc.perform(put("/api/expenses/33/picture").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(req)))
                .andExpect(status().isOk()).andExpect(content().string(containsString("33")));
    }

    @Test
    void getExpenses_ok() throws Exception {
        Expense exp = new Expense();
        Mockito.when(expenseService.getExpenses(eq(10L), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(exp), PageRequest.of(0, 10), 1));
        ExpenseDTO dtoOut = new ExpenseDTO(); dtoOut.setId(1L);
        Mockito.when(dto.convertExpenseToExpenseDTO(exp)).thenReturn(dtoOut);
        mvc.perform(get("/api/expenses").param("groupId", "10"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void recurringByGroup_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(groupService.isMemberOfGroup(1L, 10L)).thenReturn(true);
        RecurringExpense rec = new RecurringExpense(); RecurringExpenseDTO dtoR = new RecurringExpenseDTO();
        Mockito.when(recurringExpenseService.getRecurringExpensesByGroup(10L)).thenReturn(List.of(rec));
        Mockito.when(dto.convertRecurringExpenseToRecurringExpenseDTO(rec)).thenReturn(dtoR);
        mvc.perform(get("/api/expenses/10/recurring")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void recurringById_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Group g = new Group(); g.setId(10L);
        RecurringExpense rec = new RecurringExpense(); rec.setGroup(g);
        RecurringExpenseDetailsDTO dtoD = new RecurringExpenseDetailsDTO();
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(recurringExpenseService.getRecurringExpenseById(5L)).thenReturn(rec);
        Mockito.when(groupService.isMemberOfGroup(1L, 10L)).thenReturn(true);
        Mockito.when(dto.convertRecurringExpenseToRecurringExpenseDetailsDTO(rec)).thenReturn(dtoD);
        mvc.perform(get("/api/expenses/recurring/5")).andExpect(status().isOk());
    }

    @Test
    void deleteRecurring_ok() throws Exception {
        User u = new User(); u.setId(1L);
        Group g = new Group(); g.setId(10L);
        RecurringExpense rec = new RecurringExpense(); rec.setGroup(g);
        Mockito.when(userService.getCurrentUser()).thenReturn(u);
        Mockito.when(recurringExpenseService.getRecurringExpenseById(6L)).thenReturn(rec);
        Mockito.when(groupService.isMemberOfGroup(1L, 10L)).thenReturn(true);
        mvc.perform(delete("/api/expenses/recurring/6")).andExpect(status().isOk()).andExpect(content().string(containsString("6")));
    }

    @TestConfiguration
    static class MockCfg {
        @Bean @Primary ExpenseService expenseService() { return Mockito.mock(ExpenseService.class); }
        @Bean @Primary RecurringExpenseService recurringExpenseService() { return Mockito.mock(RecurringExpenseService.class); }
        @Bean @Primary UserService userService() { return Mockito.mock(UserService.class); }
        @Bean @Primary GroupService groupService() { return Mockito.mock(GroupService.class); }
        @Bean @Primary DtoConvertorUtil dto() { return Mockito.mock(DtoConvertorUtil.class); }
    }
}
