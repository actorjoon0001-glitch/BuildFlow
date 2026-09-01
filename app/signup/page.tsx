"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** 소속 전시장 (저장값=코드 / 표시=한글) — 세움OS employees.showroom 과 동일 */
const SHOWROOMS = [
  { value: "headquarters", label: "본사 전시장" },
  { value: "showroom1", label: "1전시장" },
  { value: "ganghwa", label: "강화전시장" },
  { value: "andong", label: "안동전시장" },
  { value: "gwangju", label: "광주전시장" },
];
const TEAMS = ["경영", "마케팅", "설계", "시공", "영업", "정산"];

/**
 * 통합플랫폼 회원가입 — 세움OS와 동일한 Supabase 계정 생성.
 * 가입 시 employees 행을 status='pending'(미승인)으로 만들어, 세움OS "직원 승인 관리"의
 * 승인 대기 목록에 뜨게 한다. 관리자 승인(approved) 후에만 로그인 가능.
 */
export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    showroom: "",
    team: "",
    birthDate: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error: signErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (signErr) {
        setError(
          /registered|exists/i.test(signErr.message)
            ? "이미 가입된 이메일입니다."
            : `${signErr.message}${signErr.status ? ` (${signErr.status})` : ""}`,
        );
        return;
      }
      const userId = data.user?.id;
      if (userId) {
        const ins = await supabase.from("employees").insert({
          auth_user_id: userId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          showroom: form.showroom || null,
          team: form.team || null,
          birth_date: form.birthDate || null,
          status: "pending",
          created_at: new Date().toISOString(),
        } as never);
        if (ins.error) {
          setError(`직원 정보 저장 실패: ${ins.error.message}`);
          return;
        }
      }
      // 승인 전이므로 로그인 상태로 두지 않는다.
      await supabase.auth.signOut();
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`가입 설정 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-seum-500 focus:ring-2 focus:ring-seum-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2ef] px-4 py-10 text-neutral-800 [color-scheme:light]">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-seum-500 text-xl font-extrabold text-white shadow-sm">
            세
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">회원가입</h1>
          <p className="mt-1 text-xs text-neutral-400">세움디자인하우징 통합 업무 포털</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {done ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-800">가입 신청이 완료되었습니다.</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                관리자 <b>승인 완료 후</b> 로그인할 수 있습니다.
                <br />
                승인은 담당 관리자에게 문의해 주세요.
              </p>
              <Link
                href="/login"
                className="mt-5 inline-block w-full rounded-lg bg-seum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seum-600"
              >
                로그인으로 이동
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <p className="rounded-lg bg-neutral-50 px-3 py-2 text-center text-xs text-neutral-500">
                회원가입 후 관리자 승인 완료 시 로그인할 수 있습니다.
              </p>

              <Field label="이름">
                <input value={form.name} onChange={set("name")} required placeholder="이름" className={inputClass} />
              </Field>
              <Field label="휴대폰 번호">
                <input value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" className={inputClass} />
              </Field>
              <Field label="이메일">
                <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" placeholder="이메일 주소" className={inputClass} />
              </Field>
              <Field label="비밀번호">
                <input type="password" value={form.password} onChange={set("password")} required autoComplete="new-password" placeholder="비밀번호 (6자 이상)" className={inputClass} />
              </Field>
              <Field label="소속 전시장">
                <select value={form.showroom} onChange={set("showroom")} required className={inputClass}>
                  <option value="">선택</option>
                  {SHOWROOMS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="소속 팀">
                <select value={form.team} onChange={set("team")} required className={inputClass}>
                  <option value="">선택</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="생년월일">
                <input type="date" value={form.birthDate} onChange={set("birthDate")} className={inputClass} />
              </Field>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-seum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:opacity-60"
              >
                {loading ? "가입 중…" : "회원가입"}
              </button>

              <Link
                href="/login"
                className="block pt-1 text-center text-xs text-neutral-500 transition hover:text-seum-600"
              >
                이미 계정이 있으신가요? 로그인
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
