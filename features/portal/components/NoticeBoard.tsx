"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "./Card";
import { useProfile } from "./PortalProvider";

interface Announcement {
  id: string;
  title: string | null;
  created_at: string | null;
  important: boolean | null;
  is_new: boolean | null;
  created_by_name: string | null;
  created_by_team: string | null;
}

/** 글 작성 시 선택 가능한 팀 (전체 = 팀 미지정) */
const TEAM_OPTIONS = ["전체", "경영", "마케팅", "영업", "설계", "시공", "정산"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** 공지사항 — 세움OS announcements 실데이터, 팀 탭(자동), 최신순. admin/master만 글쓰기/삭제. */
export function NoticeBoard() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("전체");

  const [adding, setAdding] = useState(false);
  const [team, setTeam] = useState("전체");
  const [title, setTitle] = useState("");
  const [important, setImportant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("announcements")
        .select("id, title, created_at, important, is_new, created_by_name, created_by_team")
        .order("created_at", { ascending: false })
        .limit(30);
      if (res.error) {
        setError(true);
      } else {
        setRows((res.data ?? []) as Announcement[]);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addNotice() {
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const res = await supabase.from("announcements").insert({
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: title.trim(),
        created_at: todayStr(),
        important,
        is_new: true,
        created_by_id: user?.id ?? null,
        created_by_name: profile?.name ?? null,
        created_by_team: team === "전체" ? null : team,
      } as never);
      if (res.error) throw res.error;
      setTitle("");
      setTeam("전체");
      setImportant(false);
      setAdding(false);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeNotice(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("announcements").delete().eq("id", id);
    await load();
  }

  // 데이터에 존재하는 팀으로 탭 자동 구성
  const tabs = useMemo(() => {
    const teams = Array.from(
      new Set(rows.map((r) => r.created_by_team).filter((t): t is string => !!t)),
    );
    return ["전체", ...teams];
  }, [rows]);

  const list = (tab === "전체" ? rows : rows.filter((r) => r.created_by_team === tab)).slice(
    0,
    10,
  );

  return (
    <Card
      title="공지사항"
      icon="notice"
      headerRight={
        isAdmin && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-seum-600"
          >
            {adding ? "닫기" : "+ 글쓰기"}
          </button>
        )
      }
    >
      {adding && (
        <div className="mb-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex gap-2">
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
            >
              {TEAM_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목을 입력하세요"
              className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-seum-500 focus:ring-seum-400"
              />
              중요 공지
            </label>
            <button
              type="button"
              onClick={addNotice}
              disabled={saving}
              className="rounded-md bg-seum-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장…" : "등록"}
            </button>
          </div>
          {saveError && <p className="text-xs text-rose-600">{saveError}</p>}
        </div>
      )}

      <div className="-mt-1 mb-2 flex flex-wrap gap-x-4 gap-y-1 border-b border-neutral-100 text-sm">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2 transition ${
              tab === t
                ? "border-seum-500 font-semibold text-seum-600"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-neutral-100">
        {list.map((n) => (
          <li key={n.id} className="group flex items-center gap-2 py-2.5 text-sm">
            {n.important && (
              <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                중요
              </span>
            )}
            {n.is_new && (
              <span className="shrink-0 rounded bg-seum-50 px-1.5 py-0.5 text-[10px] font-bold text-seum-600">
                NEW
              </span>
            )}
            {tab === "전체" && n.created_by_team && (
              <span className="hidden shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 sm:inline">
                {n.created_by_team}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate font-medium text-neutral-800">
              {n.title ?? "(제목 없음)"}
            </span>
            <span className="hidden shrink-0 text-xs text-neutral-400 sm:inline">
              {n.created_by_name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-neutral-400">
              {n.created_at ? n.created_at.slice(5) : ""}
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => removeNotice(n.id)}
                aria-label="삭제"
                className="shrink-0 text-neutral-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </li>
        ))}

        {loading && (
          <li className="py-8 text-center text-sm text-neutral-400">공지를 불러오는 중…</li>
        )}
        {!loading && error && (
          <li className="py-8 text-center text-sm text-neutral-400">
            공지를 불러올 수 없습니다.
          </li>
        )}
        {!loading && !error && list.length === 0 && (
          <li className="py-8 text-center text-sm text-neutral-400">공지가 없습니다.</li>
        )}
      </ul>
    </Card>
  );
}
