package org.lei.bill_buddy.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ActionType;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.ObjectType;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.repository.ExpenseRepository;
import org.lei.bill_buddy.repository.ExpenseShareRepository;
import org.lei.bill_buddy.repository.RecurringExpenseRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    ExpenseRepository expenseRepository;
    @Mock
    ExpenseShareRepository expenseShareRepository;
    @Mock
    GroupService groupService;
    @Mock
    UserService userService;
    @Mock
    GroupDebtService groupDebtService;
    @Mock
    ExchangeRateService exchangeRateService;
    @Mock
    ActivityService activityService;

    @InjectMocks
    ExpenseService expenseService;

    Group g;
    User payer;
    User u2;

    @BeforeEach
    void setup() {
        g = new Group();
        g.setId(1L);
        g.setDefaultCurrency(Currency.USD);
        payer = new User();
        payer.setId(10L);
        payer.setGivenName("G");
        payer.setFamilyName("F");
        u2 = new User();
        u2.setId(11L);

        lenient().when(groupService.getGroupById(1L)).thenReturn(g);
        lenient().when(groupService.getAllMemberIdsOfGroup(1L)).thenReturn(Set.of(10L, 11L));
        lenient().when(userService.getUserById(10L)).thenReturn(payer);
        lenient().when(userService.getUserById(11L)).thenReturn(u2);
        lenient().when(exchangeRateService.convert(any(), any(), any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(userService.getCurrentUser()).thenReturn(payer);
        lenient().when(userService.getUsersByIds(anyList())).thenReturn(List.of(payer, u2));
    }

    @Test
    void createExpense_ok() {
        Expense saved = new Expense();
        saved.setId(100L);
        when(expenseRepository.save(any(Expense.class)))
                .thenAnswer(inv -> {
                    Expense e = inv.getArgument(0, Expense.class);
                    e.setId(100L);
                    return e;
                });

        Expense res = expenseService.createExpense(
                1L, 10L, "Dinner", "OTHER",
                new BigDecimal("20"), "USD", "",
                LocalDateTime.now(),
                false, null, null,
                List.of(10L, 11L), null
        );

        assertThat(res.getId()).isEqualTo(100L);
        verify(groupDebtService).updateGroupDebt(eq(payer), eq(u2), eq(g), any());
    }

    @Test
    void settle_overpay_throws() {
        when(groupDebtService.getDebtsBetweenUsersOfGroup(10L, 11L, 1L))
                .thenReturn(Map.of(10L, new BigDecimal("-5")));
        assertThatThrownBy(() ->
                expenseService.settle(1L, 10L, 11L, Currency.USD, new BigDecimal("6"))
        ).isInstanceOf(AppException.class);
    }

    @Test
    void deleteExpense_ok() {
        Expense e = new Expense();
        e.setId(200L);
        e.setPayer(payer);
        e.setGroup(g);
        e.setSettled(false);
        when(expenseRepository.findById(200L)).thenReturn(Optional.of(e));
        when(expenseShareRepository.findByExpenseIdAndDeletedFalse(200L)).thenReturn(List.of());

        expenseService.deleteExpense(200L);

        verify(expenseRepository).softDeleteById(200L);
    }

    @Test
    void updateExpense_title_changed() {
        Expense e = new Expense();
        e.setId(300L);
        e.setPayer(payer);
        e.setGroup(g);
        e.setTitle("Old");
        e.setAmount(new BigDecimal("10"));
        e.setType(ExpenseType.OTHER);
        e.setSettled(false);

        when(expenseRepository.findExpenseByIdAndDeletedFalse(300L)).thenReturn(Optional.of(e));
        when(expenseShareRepository.findByExpenseIdAndDeletedFalse(300L))
                .thenReturn(List.of(share(e, payer, new BigDecimal("5")), share(e, u2, new BigDecimal("5"))));
        when(groupService.isMemberOfGroup(10L, 1L)).thenReturn(true);
        when(expenseRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Expense res = expenseService.updateExpense(
                300L, null, "New", null, null,
                null, null, null, null, null
        );

        assertThat(res.getTitle()).isEqualTo("New");
        verify(activityService).log(eq(ActionType.UPDATE), eq(ObjectType.EXPENSE), eq(300L), anyString(), any());
    }

    private ExpenseShare share(Expense e, User u, BigDecimal amt) {
        ExpenseShare s = new ExpenseShare();
        s.setExpense(e);
        s.setUser(u);
        s.setShareAmount(amt);
        return s;
    }
}
