/**
 * 세움 플랫폼 포털 목 데이터.
 *
 * 포털은 허브(런처+공지+일정+업데이트) 역할이므로 매출/계약 같은
 * 업무 수치는 두지 않는다(각 OS에서 관리). 여기는 공지/일정/업데이트/내 정보만.
 * 실제 운영에서는 Supabase 테이블에서 조회한다.
 */

export interface Profile {
  name: string;
  rank: string;
  dept: string;
  status: "출근" | "외근" | "휴가" | "퇴근";
  lastLogin: string;
  unreadNotices: number;
  alertCount: number;
}

export const profile: Profile = {
  name: "박세움",
  rank: "선임",
  dept: "영업1팀",
  status: "출근",
  lastLogin: "2026-06-10 08:54",
  unreadNotices: 4,
  alertCount: 3,
};

export type NoticeTeam =
  | "전체"
  | "영업팀"
  | "설계팀"
  | "시공팀"
  | "정산팀"
  | "마케팅팀";

export interface Notice {
  id: number;
  team: NoticeTeam;
  title: string;
  author: string;
  date: string;
  read: boolean;
  pinned?: boolean;
}

export const notices: Notice[] = [
  { id: 1, team: "전체", title: "[중요] 2026년 상반기 인사평가 일정 안내", author: "경영지원팀", date: "2026-06-09", read: false, pinned: true },
  { id: 2, team: "전체", title: "여름 휴가 신청 및 대체근무 운영 공지", author: "경영지원팀", date: "2026-06-08", read: false },
  { id: 3, team: "영업팀", title: "6월 모델하우스 방문 이벤트 진행 안내", author: "김영업", date: "2026-06-08", read: true },
  { id: 4, team: "설계팀", title: "BIM 도면 표준 템플릿 v3 배포", author: "이설계", date: "2026-06-07", read: false },
  { id: 5, team: "시공팀", title: "장마철 현장 안전관리 강화 지침", author: "박시공", date: "2026-06-06", read: true },
  { id: 6, team: "전체", title: "세움 플랫폼 통합 포털 오픈 안내", author: "IT팀", date: "2026-06-05", read: true, pinned: true },
  { id: 7, team: "정산팀", title: "6월 인센티브 정산 마감 일정 안내", author: "최정산", date: "2026-06-04", read: false },
  { id: 8, team: "마케팅팀", title: "여름 시즌 온라인 광고 캠페인 일정", author: "정마케팅", date: "2026-06-04", read: true },
  { id: 9, team: "영업팀", title: "신규 모듈러 25평형 가격표 업데이트", author: "김영업", date: "2026-06-03", read: true },
  { id: 10, team: "설계팀", title: "고객 요구사항 인테이크 양식 개편", author: "이설계", date: "2026-06-02", read: true },
  { id: 11, team: "시공팀", title: "협력사 정기 안전교육 일정 (6/15)", author: "박시공", date: "2026-06-02", read: true },
  { id: 12, team: "정산팀", title: "전자세금계산서 발행 프로세스 변경", author: "최정산", date: "2026-06-01", read: true },
];

export interface UpdateItem {
  id: number;
  system: string;
  text: string;
  date: string;
  /** new / improved / fixed */
  tag: "신규" | "개선" | "수정";
}

export const recentUpdates: UpdateItem[] = [
  { id: 1, system: "Call OS", text: "상담이력 자동 기록 기능이 추가되었습니다", date: "2026-06-09", tag: "신규" },
  { id: 2, system: "계약서OS", text: "전자계약 표준 양식 2종이 추가되었습니다", date: "2026-06-08", tag: "신규" },
  { id: 3, system: "세움OS", text: "설계팀 도면 승인 워크플로우가 개선되었습니다", date: "2026-06-07", tag: "개선" },
  { id: 4, system: "온라인 카탈로그", text: "25평형 모델 사양 및 가격이 수정되었습니다", date: "2026-06-06", tag: "수정" },
  { id: 5, system: "시공OS", text: "현장 사진 업로드 용량 제한이 확대되었습니다", date: "2026-06-05", tag: "개선" },
  { id: 6, system: "정산OS", text: "인센티브 정산 내역 엑셀 내보내기 추가", date: "2026-06-04", tag: "신규" },
];

export type NewsCategory = "소식" | "보도" | "이야기";

export interface NewsItem {
  id: number;
  category: NewsCategory;
  title: string;
  date: string;
}

/** 세움 소식 — 회사 소식/보도/이야기 (목 데이터) */
export const companyNews: NewsItem[] = [
  { id: 1, category: "보도", title: "세움디자인하우징, 친환경 모듈러 주택 신모델 출시", date: "2026-06-09" },
  { id: 2, category: "소식", title: "본사 전시동 리뉴얼 오픈 안내", date: "2026-06-06" },
  { id: 3, category: "이야기", title: "고객 입주 후기 — 양평 전원주택 이야기", date: "2026-06-04" },
  { id: 4, category: "보도", title: "2026 상반기 모듈러 건축 박람회 참가", date: "2026-06-02" },
  { id: 5, category: "소식", title: "여름맞이 모델하우스 방문 이벤트 진행", date: "2026-05-30" },
];
