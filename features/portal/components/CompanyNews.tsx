"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "./Card";
import { useProfile } from "./PortalProvider";

interface NewsRow {
  id: string;
  category: string | null;
  title: string;
  created_at: string | null;
}

const CATEGORIES = ["소식", "보도", "이야기"];
const CATEGORY_STYLE: Record<string, string> = {
  소식: "bg-seum-100 text-seum-700",
  보도: "bg-indigo-100 text-indigo-700",
  이야기: "bg-amber-100 text-amber-700",
};

/** 세움 소식 — company_news 실데이터. admin/master는 글쓰기/삭제 가능. */
export function CompanyNews() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("소식");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("company_news")
        .select("id, category, title, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setRows(res.error ? [] : ((res.data ?? []) as NewsRow[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addNews() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("company_news")
        .insert({ category, title: title.trim() } as never);
      if (res.error) throw res.error;
      setTitle("");
      setCategory("소식");
      setAdding(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeNews(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("company_news").delete().eq("id", id);
    await load();
  }

  return (
    <Card
      title="세움 소식"
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
        <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
            />
            <button
              type="button"
              onClick={addNews}
              disabled={saving}
              className="shrink-0 rounded-md bg-seum-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장…" : "등록"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        </div>
      )}

      <ul className="divide-y divide-neutral-100">
        {rows.map((n) => (
          <li key={n.id} className="group flex items-center gap-2 py-2.5 text-sm">
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                CATEGORY_STYLE[n.category ?? "소식"] ?? "bg-neutral-100 text-neutral-600"
              }`}
            >
              {n.category ?? "소식"}
            </span>
            <span className="min-w-0 flex-1 truncate text-neutral-700">{n.title}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
              {n.created_at ? n.created_at.slice(5, 10) : ""}
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => removeNews(n.id)}
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
          <li className="py-8 text-center text-sm text-neutral-400">등록된 소식이 없습니다.</li>
        )}
      </ul>
    </Card>
  );
}
