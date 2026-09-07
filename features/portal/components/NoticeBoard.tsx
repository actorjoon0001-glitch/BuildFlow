"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "./Card";
import { Icon } from "./icons";
import { useProfile } from "./PortalProvider";

interface Announcement {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string | null;
  important: boolean | null;
  is_new: boolean | null;
  created_by_name: string | null;
  created_by_team: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
}

/** 글 작성 시 선택 가능한 팀 (전체 = 팀 미지정) */
const TEAM_OPTIONS = ["전체", "경영", "마케팅", "영업", "설계", "시공", "정산"];

const BASE_COLS = "id, title, content, created_at, important, is_new, created_by_name, created_by_team";
const FULL_COLS = `${BASE_COLS}, attachment_url, attachment_name`;

const isImage = (name: string | null, url: string | null) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name ?? url ?? "");

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** 공지사항 — 세움OS announcements 실데이터, 팀 탭(자동), 최신순. admin/master만 글쓰기/삭제·첨부. */
export function NoticeBoard() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("전체");
  const [viewing, setViewing] = useState<Announcement | null>(null);

  const [adding, setAdding] = useState(false);
  const [team, setTeam] = useState("전체");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [important, setImportant] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // 첨부 컬럼이 아직 없어도 게시판이 깨지지 않도록 폴백
      let res = await supabase
        .from("announcements")
        .select(FULL_COLS)
        .order("created_at", { ascending: false })
        .limit(30);
      if (res.error) {
        res = await supabase
          .from("announcements")
          .select(BASE_COLS)
          .order("created_at", { ascending: false })
          .limit(30);
      }
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

      // 첨부 파일 업로드(선택)
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      if (file) {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const up = await supabase.storage
          .from("notices")
          .upload(path, file, { upsert: false, cacheControl: "3600" });
        if (up.error) throw up.error;
        attachmentUrl = supabase.storage.from("notices").getPublicUrl(path).data.publicUrl;
        attachmentName = file.name;
      }

      const res = await supabase.from("announcements").insert({
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: title.trim(),
        content: content.trim() || null,
        created_at: todayStr(),
        important,
        is_new: true,
        created_by_id: user?.id ?? null,
        created_by_name: profile?.name ?? null,
        created_by_team: team === "전체" ? null : team,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      } as never);
      if (res.error) throw res.error;
      setTitle("");
      setContent("");
      setTeam("전체");
      setImportant(false);
      setFile(null);
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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용 (선택)"
            rows={2}
            className="w-full resize-y rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-seum-500 focus:ring-seum-400"
                />
                중요
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-700 transition hover:border-seum-400 hover:text-seum-600">
                <Icon name="archive" size={14} />
                {file ? "파일 변경" : "이미지·파일 첨부"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={addNotice}
              disabled={saving}
              className="rounded-md bg-seum-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장…" : "등록"}
            </button>
          </div>
          {file && (
            <p className="flex items-center gap-1.5 truncate text-xs text-neutral-500">
              <Icon name="archive" size={12} />
              {file.name}
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-neutral-400 hover:text-rose-500"
                aria-label="첨부 제거"
              >
                ✕
              </button>
            </p>
          )}
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
            <button
              type="button"
              onClick={() => setViewing(n)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
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
              <span className="min-w-0 flex-1 truncate font-medium text-neutral-800 transition group-hover:text-seum-600">
                {n.title ?? "(제목 없음)"}
              </span>
              {n.attachment_url && (
                <Icon name="archive" size={13} className="shrink-0 text-neutral-400" />
              )}
            </button>
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

      {viewing && <NoticeViewer notice={viewing} onClose={() => setViewing(null)} />}
    </Card>
  );
}

/** 공지 상세 뷰어 — 제목/내용/첨부(이미지는 바로 보기, 그 외 파일은 열기) */
function NoticeViewer({ notice, onClose }: { notice: Announcement; onClose: () => void }) {
  const img = notice.attachment_url && isImage(notice.attachment_name, notice.attachment_url);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-neutral-900">
              {notice.important && <span className="mr-1.5 text-rose-500">[중요]</span>}
              {notice.title ?? "(제목 없음)"}
            </h3>
            <p className="mt-1 text-xs text-neutral-400">
              {[notice.created_by_team, notice.created_by_name, notice.created_at]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {notice.content && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {notice.content}
          </p>
        )}

        {notice.attachment_url &&
          (img ? (
            <a href={notice.attachment_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={notice.attachment_url}
                alt={notice.attachment_name ?? "첨부 이미지"}
                className="mt-4 w-full rounded-lg border border-neutral-200"
              />
            </a>
          ) : (
            <a
              href={notice.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-seum-600 transition hover:bg-seum-50"
            >
              <Icon name="archive" size={16} />
              {notice.attachment_name ?? "첨부파일 열기"}
            </a>
          ))}
      </div>
    </div>
  );
}
