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
const SHOWROOM_LABEL: Record<string, string> = {
  headquarters: "본사",
  showroom1: "1전시장",
  showroom3: "3전시장",
  ganghwa: "강화",
  andong: "안동",
  gwangju: "광주",
};

/** 세움 연락망 — employees 실데이터를 부서(team)별로 그룹핑해 표시 (승인된 직원). */
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
        .order("team", { ascending: true })
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

  // 부서 순서대로 그룹핑 (지정 순서 우선, 그 외 팀은 뒤에, 부서 없음은 '기타')
  const knownTeams = TEAM_ORDER.filter((t) => rows.some((r) => r.team === t));
  const otherTeams = Array.from(
    new Set(rows.map((r) => r.team).filter((t): t is string => !!t && !TEAM_ORDER.includes(t))),
  );
  const noTeam = rows.filter((r) => !r.team);
  const groups = [
    ...knownTeams.map((team) => ({ team, list: rows.filter((r) => r.team === team) })),
    ...otherTeams.map((team) => ({ team, list: rows.filter((r) => r.team === team) })),
    ...(noTeam.length ? [{ team: "기타", list: noTeam }] : []),
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-seum-600 to-seum-500 px-6 py-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Icon name="org" size={22} /> 세움 연락망
        </h1>
        <p className="mt-1 text-sm text-seum-50/90">
          부서별 직원 연락처입니다. (전화번호는 각자 &quot;내 정보 수정&quot;에서 갱신됩니다)
        </p>
      </section>

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center text-sm text-neutral-400">
          표시할 직원 정보가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <section key={g.team} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              <header className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
                <Icon name="org" size={16} className="text-seum-600" />
                <h3 className="text-sm font-bold text-neutral-900">{g.team}</h3>
                <span className="ml-auto text-xs text-neutral-400">{g.list.length}명</span>
              </header>
              <ul className="divide-y divide-neutral-100 p-2">
                {g.list.map((c, i) => (
                  <li key={`${c.name}-${i}`} className="flex items-center gap-3 px-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
                        {c.name ?? "-"}
                        {c.position_name && (
                          <span className="text-xs font-normal text-neutral-400">{c.position_name}</span>
                        )}
                        {c.showroom && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                            {SHOWROOM_LABEL[c.showroom] ?? c.showroom}
                          </span>
                        )}
                      </p>
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="text-xs text-neutral-500 hover:text-seum-600">
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-300">연락처 미등록</span>
                      )}
                    </div>
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
