"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "./Card";
import { useProfile } from "./PortalProvider";
import { SYSTEMS } from "../config/systems";

/** 업데이트 대상 선택 옵션 = 세움 플랫폼 + 런처 시스템들 */
const SYSTEM_OPTIONS = ["세움 플랫폼", ...SYSTEMS.filter((s) => s.launcher).map((s) => s.label)];

interface UpdateRow {
  id: string;
  system: string;
  text: string;
  tag: string | null;
  created_at: string | null;
}

const TAGS = ["신규", "개선", "수정"];
const TAG_STYLE: Record<string, string> = {
  신규: "bg-seum-100 text-seum-700",
  개선: "bg-blue-100 text-blue-700",
  수정: "bg-amber-100 text-amber-700",
};

/** 최근 업데이트 — system_updates 실데이터. admin/master는 글쓰기/삭제 가능. */
export function RecentUpdates() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [system, setSystem] = useState("");
  const [tag, setTag] = useState("신규");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("system_updates")
        .select("id, system, text, tag, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setRows(res.error ? [] : ((res.data ?? []) as UpdateRow[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addUpdate() {
    if (!system.trim() || !text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("system_updates")
        .insert({ system: system.trim(), text: text.trim(), tag } as never);
      if (res.error) throw res.error;
      setSystem("");
      setText("");
      setTag("신규");
      setAdding(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeUpdate(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("system_updates").delete().eq("id", id);
    await load();
  }

  return (
    <Card
      title="최근 업데이트"
      icon="update"
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
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
            >
              <option value="">시스템 선택</option>
              {SYSTEM_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
            >
              {TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="변경 내용"
              className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
            />
            <button
              type="button"
              onClick={addUpdate}
              disabled={saving}
              className="shrink-0 rounded-md bg-seum-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장…" : "등록"}
            </button>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      )}

      <ul className="space-y-2.5">
        {rows.map((u) => (
          <li key={u.id} className="group flex items-start gap-3">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                TAG_STYLE[u.tag ?? "신규"] ?? "bg-neutral-100 text-neutral-600"
              }`}
            >
              {u.tag ?? "신규"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-neutral-700">
                <span className="font-semibold text-neutral-900">{u.system}</span> {u.text}
              </p>
              <p className="text-[11px] tabular-nums text-neutral-400">
                {u.created_at ? u.created_at.slice(0, 10) : ""}
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => removeUpdate(u.id)}
                aria-label="삭제"
                className="shrink-0 text-neutral-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </li>
        ))}
        {loading && <li className="py-8 text-center text-sm text-neutral-400">불러오는 중…</li>}
        {!loading && rows.length === 0 && (
          <li className="py-8 text-center text-sm text-neutral-400">등록된 업데이트가 없습니다.</li>
        )}
      </ul>
    </Card>
  );
}
