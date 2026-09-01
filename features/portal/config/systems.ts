import type { Role } from "./roles";
import { isSuperuser } from "./roles";
import type { IconName } from "../components/icons";

/**
 * 세움 플랫폼 = 회사 포털 + 업무 시스템 런처.
 *
 * 실제 업무 처리는 각 OS(독립 웹서비스)에서 수행하고,
 * 포털은 진입점(허브) 역할만 한다.
 * - `href`(`/portal/app/{key}`)로 내부 iframe 래퍼를 통해 진입.
 * - `serviceUrl`이 연결(ready)되면 새 탭/임베드로 실제 서비스 진입.
 * - `roles`가 비면 전체 공개. 마스터/관리자는 항상 전체 노출.
 */

export type Tone =
  | "green"
  | "blue"
  | "indigo"
  | "amber"
  | "violet"
  | "cyan"
  | "rose"
  | "teal"
  | "slate";

export interface SystemCard {
  key: string;
  label: string;
  desc: string;
  icon: IconName;
  tone: Tone;
  href: string;
  serviceUrl?: string;
  ready: boolean;
  roles?: Role[];
  /** 메인 "자주 사용하는 시스템" 영역에 노출할지 */
  launcher: boolean;
  /** 세움OS처럼 강조(허브) 표시 */
  featured?: boolean;
  /**
   * true면 임베드(iframe) 대신 새 탭으로 연다.
   * 로그인이 필요한데 iframe 서드파티 쿠키 차단으로 로그인이 안 되는 시스템용.
   */
  openInNewTab?: boolean;
  /** 시스템 드롭다운 등에서 이름 옆에 표시할 담당 팀 라벨 */
  teamLabel?: string;
}

export const SYSTEMS: SystemCard[] = [
  {
    key: "catalog",
    label: "상담용 카탈로그",
    desc: "모델·옵션·가격 안내",
    icon: "catalog",
    tone: "amber",
    href: "/portal/app/catalog",
    serviceUrl: "https://seum-catalog.netlify.app/",
    ready: true,
    launcher: true,
  },
  {
    key: "contract",
    label: "계약서OS",
    desc: "견적서 작성 및 전자계약 관리",
    icon: "contract",
    tone: "indigo",
    href: "/portal/app/contract",
    serviceUrl: "https://seum-contract-os.netlify.app/",
    ready: true,
    launcher: true,
    roles: ["sales", "finance"],
    teamLabel: "영업팀",
  },
  {
    key: "home-planner",
    label: "3D홈플래너",
    desc: "온라인 3D 주택 설계·배치 도구",
    icon: "home",
    tone: "blue",
    href: "/portal/app/home-planner",
    serviceUrl: "https://seum-home-planner.netlify.app/",
    ready: true,
    launcher: true,
  },
  {
    key: "customer",
    label: "고객관리OS",
    desc: "고객 정보·상담 이력 통합 관리",
    icon: "inquiry",
    tone: "rose",
    href: "/portal/app/customer",
    serviceUrl: "https://seum-crm-os.netlify.app/",
    ready: true,
    launcher: true,
  },
  {
    key: "design",
    label: "설계OS",
    desc: "도면·허가·설계 검토 관리",
    icon: "design",
    tone: "violet",
    href: "/portal/app/design",
    serviceUrl: "https://seum-plan-os.netlify.app/",
    ready: true,
    launcher: true,
    roles: ["design"],
    teamLabel: "설계팀",
  },
  {
    key: "construction",
    label: "시공OS",
    desc: "현장·공정·사진 관리",
    icon: "construction",
    tone: "cyan",
    href: "/portal/app/construction",
    serviceUrl: "https://build-management-os.netlify.app/",
    ready: true,
    launcher: true,
    roles: ["construction"],
    teamLabel: "시공팀",
  },
  {
    key: "order",
    label: "발주OS",
    desc: "자재 발주·구매 관리",
    icon: "deal",
    tone: "teal",
    href: "/portal/app/order",
    ready: false,
    launcher: true,
  },
  {
    key: "finance",
    label: "정산OS",
    desc: "수납·잔금·인센티브 관리",
    icon: "finance",
    tone: "rose",
    href: "/portal/app/finance",
    serviceUrl: "https://bill-os.netlify.app/",
    ready: true,
    launcher: true,
    roles: ["finance"],
    teamLabel: "경영지원팀",
  },
  {
    key: "exhibition",
    label: "전시장 모델 취합",
    desc: "전시장별 보유 모델 정보 입력·취합",
    icon: "task",
    tone: "violet",
    href: "/portal/app/exhibition",
    serviceUrl: "https://seum-ed.netlify.app/",
    ready: true,
    launcher: true,
  },
  {
    key: "worklog",
    label: "업무일지",
    desc: "일일 업무 기록 및 보고",
    icon: "worklog",
    tone: "teal",
    href: "/portal/app/worklog",
    serviceUrl: "https://worklog.seum.example.com",
    ready: false,
    launcher: true,
  },
  {
    key: "archive",
    label: "자료실",
    desc: "회사 양식 및 문서 보관",
    icon: "archive",
    tone: "slate",
    href: "/portal/app/archive",
    serviceUrl: "https://archive.seum.example.com",
    ready: false,
    launcher: true,
  },
  {
    key: "call",
    label: "Call OS",
    desc: "고객 문의·상담 기록·방문예약 관리",
    icon: "call",
    tone: "blue",
    href: "/portal/app/call",
    serviceUrl: "https://call-os.netlify.app/",
    ready: true,
    launcher: true,
    roles: ["sales", "marketing"],
  },
  // 보조 진입점(런처 카드 아님 · 상단 메뉴에서 진입)
  {
    key: "manual",
    label: "업무 매뉴얼",
    desc: "업무 프로세스 및 가이드 문서",
    icon: "manual",
    tone: "teal",
    href: "/portal/app/manual",
    serviceUrl: "https://manual.seum.example.com",
    ready: false,
    launcher: false,
  },
  {
    key: "org",
    label: "조직도",
    desc: "부서·구성원·연락처",
    icon: "org",
    tone: "indigo",
    href: "/portal/app/org",
    serviceUrl: "https://org.seum.example.com",
    ready: false,
    launcher: false,
  },
];

/** "자주 사용하는 시스템" 카드 (역할 필터 적용) */
export function launcherSystems(role: Role): SystemCard[] {
  const list = SYSTEMS.filter((s) => s.launcher);
  if (isSuperuser(role)) return list;
  return list.filter((s) => !s.roles || s.roles.includes(role));
}

export function findService(key: string): SystemCard | undefined {
  return SYSTEMS.find((s) => s.key === key);
}
