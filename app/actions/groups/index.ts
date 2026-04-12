// Barrel re-export file
// Maintains backward compatibility for imports from "@/app/actions/groups"

// Types and shared utilities
export type { MemberRole, MemberStatus, JoinType, GroupAccessResult, SupabaseClient } from "./_shared";
export { checkGroupAccess, updateGroupActivityStats, getWeekStart } from "./_shared";

// Core group operations
export { createGroup, getGroups, getPublicGroups, getGroupDetail, updateGroup, deleteGroup, getGroupForSettings } from "./core";

// Member management
export { joinGroup, approveMember, rejectMember, removeMember, leaveGroup, getPendingMembers, transferLeadership, updateMemberRole, getGroupMembershipStats, approveAllPendingMembers } from "./members";

// Book management
export { addGroupBook, addGroupBooks, getGroupBooks, getGroupBooksWithUserStatus, addGroupBookToMyLibrary, addAllGroupBooksToMyLibrary, removeGroupBook, updateGroupBook, assignBooksToBundle, syncMyGroupBookshelf, shareUserBookToGroup, getSharedBooks, unshareUserBookFromGroup, syncGroupBookToAllMembers, syncGroupBooksToMember, unlinkGroupBookshelf } from "./books";

// Book bundles
export { createGroupBookBundle, updateGroupBookBundle, deleteGroupBookBundle, getGroupBookBundles } from "./bundles";

// Note sharing
export { shareNoteToGroup, getGroupBookNotes, getGroupBookNoteCounts, getShareableNotes, getShareableNotesForAllBooks, shareNotesToGroup, unshareNoteFromGroup, toggleNoteReaction, getNoteReactions } from "./notes";
export type { ReactionType } from "./notes";

// Comments
export { addComment, getComments, updateComment, deleteComment, getCommentCounts } from "./comments";

// Analytics
export { getMemberProgress, getMemberActivities, getGroupWeeklyStats } from "./analytics";

// Invite tokens
export { createInviteToken, getGroupByInviteToken, joinByToken, revokeInviteToken, getInviteTokens } from "./invites";
