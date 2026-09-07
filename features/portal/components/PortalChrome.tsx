"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icons";
import { useProfile, useRole, useSystems } from "./PortalProvider";
import { NAV_MENU, UTIL_LINKS } from "../config/nav";
import { ROLES, roleLabel } from "../config/roles";
import type { Role } from "../config/roles";
import { launcherSystems } from "../config/systems";

/** 상단 고정 헤더(흰색 · 로고/프로필) + 그린 네비게이션 바 */
export function PortalChrome() {
  const { role, setRole } = useRole();
  const { openService } = useSystems();
  const { profile: me } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [systemsOpen, setSystemsOpen] = useState(false);
  const launchers = launcherSystems(role);

  async function handleLogout() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      await createClient().auth.signOut();
    } catch {
      // 인증 미설정 등으로 실패해도 로그인 화면으로 이동
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* 최상단 유틸리티 바 */}
      <div className="border-b border-neutral-100 bg-neutral-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-end gap-3 px-4 py-1 text-[11px] text-neutral-500 lg:px-6">
          {UTIL_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="transition hover:text-seum-600"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* 상단 흰색 바 */}
      <div className="bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-2.5 lg:px-6">
          {/* 로고 + 부제 */}
          <Link href="/portal" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-seum-500 text-white shadow-sm">
              <Icon name="hub" size={22} />
            </span>
            <span className="leading-tight">
              <span className="block text-[17px] font-extrabold tracking-tight text-neutral-900">
                세움<span className="text-seum-600"> 플랫폼</span>
                <span className="ml-1.5 align-middle text-[10px] font-semibold tracking-widest text-neutral-300">
                  SEUM PLATFORM
                </span>
              </span>
              <span className="block text-[11px] text-neutral-400">
                세움디자인하우징 통합 업무 포털
              </span>
            </span>
          </Link>

          {/* 우측: 알림 + 프로필 + 로그아웃 */}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="알림"
              className="relative rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-seum-600"
            >
              <Icon name="bell" size={20} />
            </button>

            <div className="ml-1 flex items-center gap-3 border-l border-neutral-200 pl-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-seum-100 text-sm font-bold text-seum-700">
                {me?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (me?.name ?? "·").charAt(0)
                )}
              </span>
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold text-neutral-800">
                  {me?.name ?? "불러오는 중…"}
                  {me?.positionName && (
                    <span className="ml-1 font-normal text-neutral-500">{me.positionName}</span>
                  )}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {[me?.team, me?.permission].filter(Boolean).join(" · ") || me?.email}
                </p>
              </div>
              <button
                type="button"
                aria-label="로그아웃"
                onClick={handleLogout}
                className="rounded-lg p-2 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-500"
              >
                <Icon name="logout" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 그린 네비게이션 바 */}
      <nav className="bg-seum-600">
        <div className="mx-auto flex max-w-[1600px] items-center px-4 lg:px-6">
          <ul className="flex flex-1 flex-wrap items-center">
            {NAV_MENU.map((m) => {
              const active = m.href === "/portal" && pathname === "/portal";
              return (
                <li key={m.label}>
                  <Link
                    href={m.href}
                    className={`flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium transition lg:px-4 ${
                      active
                        ? "bg-seum-700 text-white"
                        : "text-seum-50 hover:bg-seum-700/60 hover:text-white"
                    }`}
                  >
                    <Icon name={m.icon} size={16} />
                    {m.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* 시스템 바로 열기 드롭다운 (어느 페이지에서나 사용) */}
          <div className="relative ml-2 shrink-0">
            <button
              type="button"
              onClick={() => setSystemsOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md bg-seum-700/70 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-seum-700"
            >
              <Icon name="grid" size={14} />
              시스템
              <Icon name="chevron" size={14} />
            </button>
            {systemsOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  onClick={() => setSystemsOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] w-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                  {launchers.map((s) => {
                    const ready = s.ready && s.serviceUrl;
                    const content = (
                      <>
                        <Icon name={s.icon} size={16} className="text-neutral-500" />
                        <span className="flex-1 text-neutral-800">{s.label}</span>
                        {s.teamLabel && (
                          <span className="text-[11px] text-neutral-400">{s.teamLabel}</span>
                        )}
                        {!ready && <span className="text-[11px] text-neutral-400">준비중</span>}
                      </>
                    );
                    const rowClass =
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-seum-50";
                    // openInNewTab → 새 탭으로 열기 (임베드 안 함)
                    if (s.openInNewTab && s.serviceUrl) {
                      return (
                        <a
                          key={s.key}
                          href={s.serviceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setSystemsOpen(false)}
                          className={rowClass}
                        >
                          {content}
                        </a>
                      );
                    }
                    return ready ? (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          openService(s);
                          setSystemsOpen(false);
                        }}
                        className={rowClass}
                      >
                        {content}
                      </button>
                    ) : (
                      <Link
                        key={s.key}
                        href={s.href}
                        onClick={() => setSystemsOpen(false)}
                        className={rowClass}
                      >
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 역할 미리보기 스위처 (인증 전 임시) */}
          <div className="relative ml-2 shrink-0">
            <button
              type="button"
              onClick={() => setRoleOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md bg-seum-700/70 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-seum-700"
            >
              권한: {roleLabel(role)}
              <Icon name="chevron" size={14} />
            </button>
            {roleOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id as Role);
                      setRoleOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-sm transition hover:bg-seum-50 ${
                      role === r.id ? "font-semibold text-seum-600" : "text-neutral-600"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
