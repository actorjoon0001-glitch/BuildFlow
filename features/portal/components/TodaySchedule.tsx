"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "./Card";
import { CalendarWidget } from "./CalendarWidget";
import { useProfile } from "./PortalProvider";

const SCHEDULE_TYPES = ["방문예약", "회의", "계약", "설계", "시공", "행사", "휴무"] as const;
type ScheduleType = (typeof SCHEDULE_TYPES)[number];

const TYPE_STYLE: Record<string, string> = {
  방문예약: "bg-amber-100 text-amber-700",
  회의: "bg-slate-100 text-slate-700",
  계약: "bg-seum-100 text-seum-700",
  설계: "bg-blue-100 text-blue-700",
  시공: "bg-violet-100 text-violet-700",
  행사: "bg-rose-100 text-rose-700",
  휴무: "bg-neutral-100 text-neutral-500",
};
const typeStyle = (t: string) => TYPE_STYLE[t] ?? "bg-neutral-100 text-neutral-600";

interface ScheduleRow {
  id: string;
  date: string; // YYYY-MM-DD (시작일)
  end_date: string | null; // YYYY-MM-DD (종료일, 없으면 당일)
  time: string | null; // HH:MM
  type: string | null;
  title: string;
  place: string | null;
}

const BASE_COLS = "id, date, time, type, title, place";
const FULL_COLS = "id, date, end_date, time, type, title, place";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function fmtDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  return `${m}월 ${d}일 (${dow})`;
}

const fmtMD = (s: string) => {
  const [, m, d] = s.split("-").map(Number);
  return `${m}/${d}`;
};

/** 시작~종료(포함) 사이 날짜 문자열 배열 */
function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const cur = new Date(ys, ms - 1, ds);
  const last = new Date(ye, me - 1, de);
  let i = 0;
  while (cur <= last && i < 366) {
    out.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
        cur.getDate(),
      ).padStart(2, "0")}`,
    );
    cur.setDate(cur.getDate() + 1);
    i++;
  }
  return out;
}

const endOf = (r: ScheduleRow) => (r.end_date && r.end_date >= r.date ? r.end_date : r.date);

/** 세움 일정 + 월간 캘린더 — schedules 실데이터. 조회는 전 직원, 등록/삭제는 admin/master. */
export function TodaySchedule() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(todayStr());

  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<ScheduleType>("방문예약");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // end_date 컬럼이 아직 없어도 깨지지 않도록 폴백
      let res = await supabase
        .from("schedules")
        .select(FULL_COLS)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (res.error) {
        res = await supabase
          .from("schedules")
          .select(BASE_COLS)
          .order("date", { ascending: true })
          .order("time", { ascending: true });
      }
      setRows(res.error ? [] : ((res.data ?? []) as ScheduleRow[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const eventDates = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      for (const d of eachDate(r.date, endOf(r))) s.add(d);
    }
    return s;
  }, [rows]);

  const dayItems = useMemo(
    () => rows.filter((r) => selected >= r.date && selected <= endOf(r)),
    [rows, selected],
  );

  async function addSchedule() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const end = endDate && endDate >= date ? endDate : null;
      const payload = {
        date,
        end_date: end,
        time: time || null,
        type,
        title: title.trim(),
        place: place.trim() || null,
      };
      // end_date 컬럼이 없으면 제외하고 재시도
      let res = await supabase.from("schedules").insert(payload as never);
      if (res.error) {
        const { end_date: _omit, ...rest } = payload;
        res = await supabase.from("schedules").insert(rest as never);
      }
      if (res.error) throw res.error;
      setTitle("");
      setPlace("");
      setEndDate("");
      setAdding(false);
      setSelected(date);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeSchedule(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("schedules").delete().eq("id", id);
    await load();
  }

  const inputClass =
    "rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500";

  return (
    <Card
      title="세움 일정"
      icon="calendar"
      headerRight={
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-seum-50 px-2 py-0.5 text-xs font-medium text-seum-600">
            {dayItems.length}건
          </span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setDate(selected);
                setAdding((v) => !v);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-seum-600"
            >
              {adding ? "닫기" : "+ 일정"}
            </button>
          )}
        </div>
      }
    >
      <CalendarWidget eventDates={eventDates} selected={selected} onSelect={setSelected} />

      {adding && (
        <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <span className="text-xs text-neutral-400">~</span>
            <input
              type="date"
              value={endDate}
              min={date}
              onChange={(e) => setEndDate(e.target.value)}
              className={`flex-1 ${inputClass}`}
              placeholder="종료일"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ScheduleType)}
              className={inputClass}
            >
              {SCHEDULE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 내용"
            className={`w-full ${inputClass}`}
          />
          <div className="flex gap-2">
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="장소 (선택)"
              className={`min-w-0 flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={addSchedule}
              disabled={saving}
              className="shrink-0 rounded-md bg-seum-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장…" : "등록"}
            </button>
          </div>
          <p className="text-[11px] text-neutral-400">
            여러 날에 걸친 일정은 종료일을 지정하세요. (당일이면 비워두세요)
          </p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      )}

      <p className="mt-3 mb-1 px-0.5 text-xs font-semibold text-neutral-500">
        {selected === todayStr() ? "오늘" : fmtDateLabel(selected)} 일정
      </p>
      <ul className="space-y-2">
        {dayItems.map((s) => {
          const multiDay = endOf(s) !== s.date;
          const sub = [
            multiDay ? `${fmtMD(s.date)} ~ ${fmtMD(endOf(s))}` : null,
            s.place,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={s.id}
              className="group flex items-center gap-3 rounded-lg border border-neutral-100 px-3 py-2 transition hover:border-seum-200 hover:bg-seum-50/40"
            >
              <span className="w-11 shrink-0 text-xs font-semibold tabular-nums text-neutral-500">
                {multiDay ? "기간" : s.time ? s.time.slice(0, 5) : "종일"}
              </span>
              {s.type && (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${typeStyle(s.type)}`}
                >
                  {s.type}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-800">{s.title}</p>
                {sub && <p className="truncate text-[11px] text-neutral-400">{sub}</p>}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => removeSchedule(s.id)}
                  aria-label="삭제"
                  className="shrink-0 text-neutral-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
        {loading && <li className="py-8 text-center text-sm text-neutral-400">불러오는 중…</li>}
        {!loading && dayItems.length === 0 && (
          <li className="py-6 text-center text-sm text-neutral-400">등록된 일정이 없습니다.</li>
        )}
      </ul>
    </Card>
  );
}
