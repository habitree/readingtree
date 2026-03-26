// Barrel re-export file
// Maintains backward compatibility for imports from "@/app/actions/groups"

// Types and shared utilities
export type { MemberRole, MemberStatus, GroupAccessResult, SupabaseClient } from "./_shared";
export { checkGroupAccess, updateGroupActivityStats, getWeekStart } from "./_shared";

// Core group operations
export { createGroup, getGroups, getPublicGroups, getGroupDetail, updateGroup, deleteGroup, getGroupForSettings } from "./core";

// Member management
export { joinGroup, approveMember, rejectMember, removeMember, leaveGroup, getPendingMembers, transferLeadership, updateMemberRole, getGroupMembershipStats, approveAllPendingMembers } from "./members";

// Book management
export { addGroupBook, getGroupBooks, getGroupBooksWithUserStatus, addGroupBookToMyLibrary, removeGroupBook, shareUserBookToGroup, getSharedBooks, unshareUserBookFromGroup } from "./books";

// Note sharing
export { shareNoteToGroup, getGroupBookNotes, getGroupBookNoteCounts, getShareableNotes, shareNotesToGroup, unshareNoteFromGroup, toggleNoteReaction, getNoteReactions } from "./notes";
export type { ReactionType } from "./notes";

// Comments
export { addComment, getComments, updateComment, deleteComment, getCommentCounts } from "./comments";

// Analytics
export { getMemberProgress, getMemberActivities, getGroupWeeklyStats } from "./analytics";

// Invite tokens
export { createInviteToken, getGroupByInviteToken, joinByToken, revokeInviteToken, getInviteTokens } from "./invites";
