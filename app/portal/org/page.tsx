"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile } from "@/features/portal/components/PortalProvider";

interface Emp {
  id: number | string;
  name: string | null;
  team: string | null;
  position_name: string | null;
  phone: string | null;
  showroom: string | null;
}

const TEAM_ORDER = ["경영", "마케팅", "영업", "설계", "시공", "정산"];
const TEAM_LABEL: Record<string, string> = { 정산: "경영지원팀" };
const TEAM_OPTIONS = [
  { value: "경영", label: "경영" },
  { value: "마케팅", label: "마케팅" },
  { value: "영업", label: "영업" },
  { value: "설계", label: "설계" },
  { value: "시공", label: "시공" },
  { value: "정산", label: "경영지원팀" },
];

const SHOWROOM_ORDER = ["headquarters", "showroom1", "ganghwa", "andong", "gwangju", "showroom3"];
const SHOWROOM_LABEL: Record<string, string> = {
  headquarters: "본사",
  showroom1: "1전시장",
  showroom3: "3전시장",
  ganghwa: "강화전시장",
  andong: "안동전시장",
  gwangju: "광주전시장",
};
const SHOWROOM_OPTIONS = [
  { value: "headquarters", label: "본사" },
  { value: "showroom1", label: "1전시장" },
  { value: "ganghwa", label: "강화전시장" },
  { value: "andong", label: "안동전시장" },
  { value: "gwangju", label: "광주전시장" },
];
const showroomLabel = (v: string | null) => (v ? SHOWROOM_LABEL[v] ?? v : "기타");

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

export default function OrgDirectoryPage() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Emp | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("employees")
        .select("id, name, team, position_name, phone, showroom")
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
      const shrooms = [
        ...SHOWROOM_ORDER.filter((s) => members.some((m) => m.showroom === s)),
        ...Array.from(
          new Set(
            members.map((m) => m.showroom).filter((s): s is string => !!s && !SHOWROOM_ORDER.includes(s)),
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
          부서별 직원 연락처 (영업은 전시장별)
          {isAdmin ? " · 관리자는 각 항목을 수정할 수 있습니다" : ""}
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
                {g.list.map((c) => (
                  <li
                    key={c.id}
                    className="group flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-seum-50/40"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-neutral-900">{c.name ?? "-"}</span>
                        {!g.hideShowroom && c.showroom && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                            {showroomLabel(c.showroom)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone.replace(/[^0-9]/g, "")}`}
                          className="whitespace-nowrap text-sm tabular-nums text-neutral-600 transition hover:text-seum-600"
                        >
                          {fmtPhone(c.phone)}
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-300">미등록</span>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          className="rounded-md px-1.5 py-0.5 text-[11px] text-neutral-400 opacity-0 transition hover:bg-neutral-100 hover:text-seum-600 group-hover:opacity-100"
                        >
                          수정
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {isAdmin && editing && (
        <EditModal emp={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
    </div>
  );
}

function EditModal({
  emp,
  onClose,
  onSaved,
}: {
  emp: Emp;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(emp.name ?? "");
  const [position, setPosition] = useState(emp.position_name ?? "");
  const [team, setTeam] = useState(emp.team ?? "");
  const [showroom, setShowroom] = useState(emp.showroom ?? "");
  const [phone, setPhone] = useState(emp.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-seum-500 focus:ring-2 focus:ring-seum-100";

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("employees")
        .update({
          name: name.trim() || null,
          position_name: position.trim() || null,
          team: team || null,
          showroom: showroom || null,
          phone: phone.trim() || null,
        } as never)
        .eq("id", emp.id);
      if (res.error) throw res.error;
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">직원 정보 수정</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">이름</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">직책</span>
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 팀장" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">부서</span>
            <select value={team} onChange={(e) => setTeam(e.target.value)} className={inputClass}>
              <option value="">선택</option>
              {TEAM_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">전시장</span>
            <select value={showroom} onChange={(e) => setShowroom(e.target.value)} className={inputClass}>
              <option value="">선택</option>
              {SHOWROOM_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">핸드폰</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className={inputClass} />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-seum-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
