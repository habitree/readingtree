/**
 * 독서모임 관련 타입 정의
 */

export type MemberRole = "leader" | "moderator" | "member";
export type MemberStatus = "pending" | "approved" | "rejected";
export type JoinType = "open" | "approval" | "private";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  is_public: boolean; // deprecated — use join_type
  join_type: JoinType;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

export interface GroupBookLink {
  title: string;
  url: string;
}

export interface GroupBookBundle {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  links?: GroupBookLink[];
  created_at?: string;
  updated_at?: string;
}

export interface GroupBook {
  id: string;
  group_id: string;
  book_id: string;
  started_at: string;
  target_completed_at: string | null;
  created_at: string;
  description: string | null;
  links: GroupBookLink[];
  bundle_id: string | null;
  sort_order: number;
}

export interface GroupWithDetails extends Group {
  members_count?: number;
  books_count?: number;
  leader?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export type NoteType = "quote" | "photo" | "memo" | "transcription";

export interface GroupNote {
  id: string;
  group_id: string;
  note_id: string;
  shared_at: string;
}

export interface GroupBookWithNoteCount extends GroupBook {
  books: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
    cover_image_url: string | null;
    summary?: string | null;
    description_summary?: string | null;
    external_link?: string | null;
  };
  group_book_bundles?: GroupBookBundle | null;
  note_count: number;
}

export interface SharedNoteWithAuthor {
  id: string;
  group_id: string;
  note_id: string;
  shared_at: string;
  notes: {
    id: string;
    user_id: string;
    book_id: string;
    title: string | null;
    type: NoteType;
    content: string | null;
    image_url: string | null;
    page_number: number | null;
    tags: string[] | null;
    created_at: string;
    users: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  };
}

export interface MemberActivity {
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  role: MemberRole;
  totalSharedNotes: number;
  groupBookNotes: number;
  lastSharedAt: string | null;
  noteTypes: {
    quote: number;
    memo: number;
    photo: number;
    transcription: number;
  };
}

export interface ShareableNote {
  id: string;
  title: string | null;
  type: NoteType;
  content: string | null;
  image_url: string | null;
  page_number: number | null;
  tags: string[] | null;
  created_at: string;
}

// 멤버 관리 관련 타입
export interface PendingMember {
  id: string;
  user_id: string;
  group_id: string;
  joined_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
    email?: string;
  };
}

export interface GroupMemberWithUser extends GroupMember {
  users: {
    id: string;
    name: string;
    avatar_url: string | null;
    email?: string;
  } | null;
}

export interface GroupMembershipStats {
  total: number;
  approved: number;
  pending: number;
  leaders: number;
  moderators: number;
}

export interface MemberInvitation {
  id: string;
  group_id: string;
  email: string;
  invited_by: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
}

