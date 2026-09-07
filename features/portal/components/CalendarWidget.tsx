"use client";

import { useState } from "react";
import { Icon } from "./icons";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/** YYYY-MM-DD (로컬 기준) */
function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface Props {
  /** 일정이 있는 날짜 집합 (YYYY-MM-DD) */
  eventDates: Set<string>;
  /** 선택된 날짜 (YYYY-MM-DD) */
  selected: string;
  /** 날짜 선택 콜백 */
  onSelect: (date: string) => void;
}

/** 미니 캘린더 위젯 — 일정 있는 날 점 표시 + 오늘 강조 + 날짜 선택 */
export function CalendarWidget({ eventDates, selected, onSelect }: Props) {
  const today = new Date();
  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());
  const [view, setView] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) => setView(new Date(year, month + delta, 1));

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="이전 달"
          className="rounded p-1 text-neutral-400 hover:bg-white hover:text-seum-600"
        >
          <Icon name="chevron" size={16} className="rotate-90" />
        </button>
        <span className="text-sm font-semibold text-neutral-800">
          {year}. {String(month + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="다음 달"
          className="rounded p-1 text-neutral-400 hover:bg-white hover:text-seum-600"
        >
          <Icon name="chevron" size={16} className="-rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {WEEK.map((w, i) => (
          <span
            key={w}
            className={
              i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-neutral-400"
            }
          >
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const dateStr = ymd(year, month, d);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          const hasEvent = eventDates.has(dateStr);
          const dow = i % 7;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(dateStr)}
              className={`flex flex-col items-center rounded-lg py-0.5 transition ${
                hasEvent && !isToday ? "bg-seum-100/70" : ""
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] transition ${
                  isToday
                    ? "bg-seum-500 font-bold text-white"
                    : isSelected
                      ? "font-bold text-seum-700 ring-2 ring-seum-500 ring-inset"
                      : hasEvent
                        ? "font-bold text-seum-700"
                        : dow === 0
                          ? "text-rose-500 hover:bg-white"
                          : dow === 6
                            ? "text-blue-500 hover:bg-white"
                            : "text-neutral-700 hover:bg-white"
                }`}
              >
                {d}
              </span>
              <span
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                  hasEvent ? "bg-seum-500" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
