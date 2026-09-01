"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/features/portal/components/icons";

interface Emp {
  name: string | null;
  team: string | null;
  position_name: string | null;
  phone: string | null;
  showroom: string | null;
}

const TEAM_ORDER = ["경영", "마케팅", "영업", "설계", "시공", "정산"];
/** 화면에 보일 부서명 (DB값은 그대로 두고 표시만 변경) */
const TEAM_LABEL: Record<string, string> = { 정산: "경영지원팀" };

const SHOWROOM_ORDER = ["headquarters", "showroom1", "ganghwa", "andong", "gwangju", "showroom3"];
const SHOWROOM_LABEL: Record<string, string> = {
  headquarters: "본사",
  showroom1: "1전시장",
  showroom3: "3전시장",
  ganghwa: "강화전시장",
  andong: "안동전시장",
  gwangju: "광주전시장",
};
const showroomLabel = (v: string | null) => (v ? SHOWROOM_LABEL[v] ?? v : "기타");

/** 핸드폰 번호 보기 좋게 하이픈 삽입 */
function fmtPhone(p: string | null): string {
  if (!p) return "";
  const d = p.replace(/[^0-9]/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

interface Group {
  title: string;
  list: Emp[];
  hideShowroom?: boolean;
}

/** 세움 연락망 — employees 실데이터. 부서별(영업은 전시장별). */
export default function OrgDirectoryPage() {
  const [rows, setRows] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("employees")
        .select("name, team, position_name, phone, showroom")
        .eq("status", "approved")
        .order("name", { ascending: true });
      setRows(res.error ? [] : ((res.data ?? []) as Emp[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const teamsPresent = [
    ...TEAM_ORDER.filter((t) => rows.some((r) => r.team === t)),
    ...Array.from(
      new Set(rows.map((r) => r.team).filter((t): t is string => !!t && !TEAM_ORDER.includes(t))),
    ),
  ];

  const groups: Group[] = [];
  for (const team of teamsPresent) {
    const members = rows.filter((r) => r.team === team);
    if (team === "영업") {
      // 영업은 전시장별로 분리
      const shrooms = [
        ...SHOWROOM_ORDER.filter((s) => members.some((m) => m.showroom === s)),
        ...Array.from(
          new Set(
            members
              .map((m) => m.showroom)
              .filter((s): s is string => !!s && !SHOWROOM_ORDER.includes(s)),
          ),
        ),
      ];
      for (const sh of shrooms) {
        const list = members.filter((m) => m.showroom === sh);
        if (list.length) groups.push({ title: `영업 · ${showroomLabel(sh)}`, list, hideShowroom: true });
      }
      const noSh = members.filter((m) => !m.showroom);
      if (noSh.length) groups.push({ title: "영업 · 기타", list: noSh, hideShowroom: true });
    } else {
      groups.push({ title: TEAM_LABEL[team] ?? team, list: members });
    }
  }
  const noTeam = rows.filter((r) => !r.team);
  if (noTeam.length) groups.push({ title: "기타", list: noTeam });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-seum-600 to-seum-500 px-6 py-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Icon name="org" size={22} /> 세움 연락망
        </h1>
        <p className="mt-1 text-sm text-seum-50/90">
          부서별 직원 연락처 (영업은 전시장별) · 전화번호는 각자 &quot;내 정보 수정&quot;에서 갱신
        </p>
      </section>

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center text-sm text-neutral-400">
          표시할 직원 정보가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <section
              key={g.title}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
            >
              <header className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-seum-100 text-seum-600">
                  <Icon name="org" size={14} />
                </span>
                <h3 className="text-sm font-bold text-neutral-900">{g.title}</h3>
                <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                  {g.list.length}명
                </span>
              </header>
              <ul className="divide-y divide-neutral-50">
                {g.list.map((c, i) => (
                  <li
                    key={`${c.name}-${i}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-seum-50/40"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-neutral-900">{c.name ?? "-"}</span>
                        {c.position_name && (
                          <span className="text-[11px] text-neutral-400">{c.position_name}</span>
                        )}
                        {!g.hideShowroom && c.showroom && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                            {showroomLabel(c.showroom)}
                          </span>
                        )}
                      </p>
                    </div>
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone.replace(/[^0-9]/g, "")}`}
                        className="shrink-0 whitespace-nowrap text-sm tabular-nums text-neutral-600 transition hover:text-seum-600"
                      >
                        {fmtPhone(c.phone)}
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-neutral-300">미등록</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
