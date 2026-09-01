"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile } from "@/features/portal/components/PortalProvider";

interface Contact {
  id: string;
  showroom: string | null;
  name: string;
  title: string | null;
  phone: string | null;
  sort_order: number | null;
}

const SHOWROOMS = [
  { value: "headquarters", label: "본사 전시장" },
  { value: "showroom1", label: "1전시장" },
  { value: "ganghwa", label: "강화전시장" },
  { value: "andong", label: "안동전시장" },
  { value: "gwangju", label: "광주전시장" },
];
const showroomLabel = (v: string | null) =>
  SHOWROOMS.find((s) => s.value === v)?.label ?? (v || "기타");

/** 세움 연락망 — 전시장별 이름·핸드폰. 관리자(admin/master)만 추가/삭제. */
export default function OrgDirectoryPage() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ showroom: "headquarters", name: "", title: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("contacts")
        .select("id, showroom, name, title, phone, sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      setRows(res.error ? [] : ((res.data ?? []) as Contact[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addContact() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase.from("contacts").insert({
        showroom: form.showroom,
        name: form.name.trim(),
        title: form.title.trim() || null,
        phone: form.phone.trim() || null,
      } as never);
      if (res.error) throw res.error;
      setForm({ showroom: form.showroom, name: "", title: "", phone: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("contacts").delete().eq("id", id);
    await load();
  }

  // 전시장 순서대로 그룹핑 (+ 목록에 없는 값은 기타)
  const groupKeys = [
    ...SHOWROOMS.map((s) => s.value),
    ...Array.from(new Set(rows.map((r) => r.showroom).filter((v): v is string => !!v && !SHOWROOMS.some((s) => s.value === v)))),
  ];
  const groups = groupKeys
    .map((key) => ({ key, list: rows.filter((r) => (r.showroom ?? "기타") === key) }))
    .filter((g) => g.list.length > 0);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-seum-600 to-seum-500 px-6 py-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Icon name="org" size={22} /> 세움 연락망
        </h1>
        <p className="mt-1 text-sm text-seum-50/90">전시장별 담당자 이름과 연락처입니다.</p>
      </section>

      {/* 관리자 추가 폼 */}
      {isAdmin && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">연락처 추가</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={form.showroom}
              onChange={(e) => setForm((f) => ({ ...f, showroom: e.target.value }))}
              className="rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm"
            >
              {SHOWROOMS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="이름"
              className="w-28 rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-900 outline-none focus:border-seum-500"
            />
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="직책(선택)"
              className="w-28 rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-900 outline-none focus:border-seum-500"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="핸드폰 번호"
              className="w-40 rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-900 outline-none focus:border-seum-500"
            />
            <button
              type="button"
              onClick={addContact}
              disabled={saving}
              className="rounded-md bg-seum-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장…" : "추가"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        </section>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center text-sm text-neutral-400">
          등록된 연락처가 없습니다.{isAdmin && " 위에서 추가해 주세요."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <section key={g.key} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              <header className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
                <Icon name="site" size={16} className="text-seum-600" />
                <h3 className="text-sm font-bold text-neutral-900">{showroomLabel(g.key)}</h3>
                <span className="ml-auto text-xs text-neutral-400">{g.list.length}명</span>
              </header>
              <ul className="divide-y divide-neutral-100 p-2">
                {g.list.map((c) => (
                  <li key={c.id} className="group flex items-center gap-3 px-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800">
                        {c.name}
                        {c.title && <span className="ml-1.5 text-xs font-normal text-neutral-400">{c.title}</span>}
                      </p>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="text-xs text-neutral-500 hover:text-seum-600">
                          {c.phone}
                        </a>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => removeContact(c.id)}
                        aria-label="삭제"
                        className="shrink-0 text-neutral-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                      >
                        ✕
                      </button>
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
