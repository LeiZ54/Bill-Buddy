package org.lei.bill_buddy.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lei.bill_buddy.enums.GroupType;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.lei.bill_buddy.repository.GroupRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    GroupRepository groupRepository;
    @Mock
    GroupMemberRepository groupMemberRepository;
    @Mock
    ActivityService activityService;
    @Mock
    UserService userService;

    @InjectMocks
    GroupService groupService;

    User creator;

    @BeforeEach
    void init() {
        creator = new User();
        creator.setId(1L);
        creator.setGivenName("G");
        creator.setFamilyName("F");

        lenient().when(userService.getCurrentUser()).thenReturn(creator);
    }


    @Test
    void createGroup_ok() {
        Group saved = new Group();
        saved.setId(100L);
        saved.setName("Trip");
        saved.setType(GroupType.TRIP);
        when(groupRepository.save(any(Group.class))).thenReturn(saved);
        when(groupMemberRepository.save(any(GroupMember.class))).thenReturn(new GroupMember());

        Group res = groupService.createGroup("Trip", "TRIP", "USD", creator);

        assertThat(res.getId()).isEqualTo(100L);
        verify(activityService).log(any(), any(), eq(100L), eq("user_created_group"), anyMap());
    }

    @Test
    void updateGroup_name_change_logged() {
        Group g = new Group();
        g.setId(10L);
        g.setName("Old");
        g.setType(GroupType.OTHER);
        when(groupRepository.findByIdAndDeletedFalse(10L)).thenReturn(Optional.of(g));
        when(groupRepository.save(any(Group.class))).thenAnswer(i -> i.getArgument(0));

        Group res = groupService.updateGroup(10L, "New", null);

        assertThat(res.getName()).isEqualTo("New");
        verify(activityService).log(any(), any(), eq(10L), eq("user_updated_group"), anyMap());
    }

    @Test
    void isMemberOfGroup_true() {
        when(groupMemberRepository.existsByUserIdAndGroupIdAndDeletedFalse(1L, 5L))
                .thenReturn(true);
        assertThat(groupService.isMemberOfGroup(1L, 5L)).isTrue();
    }

    @Test
    void getGroupsByUserId_filters() {
        when(groupMemberRepository.findGroupIdsByUserIdAndDeletedFalse(1L)).thenReturn(List.of(4L, 5L));
        Group g4 = new Group();
        g4.setId(4L);
        g4.setUpdatedAt(LocalDateTime.now());
        Page<Group> page = new PageImpl<>(List.of(g4));
        when(groupRepository.findAllByIdInAndNameContainingOrderByUpdatedAtDesc(anyList(), eq(""), any()))
                .thenReturn(page);

        Page<Group> res = groupService.getGroupsByUserIdAndGroupName(1L, "", PageRequest.of(0, 10));

        assertThat(res.getTotalElements()).isEqualTo(1);
    }

    @Test
    void getAllMemberIdsOfGroup_returns_set() {
        when(groupMemberRepository.findUserIdsByGroupIdAndDeletedFalse(9L)).thenReturn(List.of(1L, 2L, 3L));
        Set<Long> ids = groupService.getAllMemberIdsOfGroup(9L);
        assertThat(ids).containsExactlyInAnyOrder(1L, 2L, 3L);
    }
}
