"use client";

import { useEffect, useState } from "react";
import { Card } from "./Card";
import { Icon } from "./icons";
import { useProfile } from "./PortalProvider";
import { ProfileEditModal } from "./ProfileEditModal";

/** 내 정보 — 로그인 직원 프로필(세움OS) + 미확인 공지 + 최근 로그인 */
export function MyInfoCard() {
  const { profile: me } = useProfile();
  const [editing, setEditing] = useState(false);
  const [unread, setUnread] = useState<number | null>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  const name = me?.name ?? "불러오는 중…";
  const sub = [me?.team, me?.permission].filter(Boolean).join(" · ") || me?.email || "";

  // 미확인 공지(전체 공지 - 내가 읽은 공지) + 최근 로그인 시각(세션)
  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setLastLogin(user.last_sign_in_at ?? null);

        const [annRes, readRes] = await Promise.all([
          supabase.from("announcements").select("id"),
          supabase.from("notice_reads").select("notice_id").eq("user_id", user.id),
        ]);
        if (annRes.error) return;
        const readSet = new Set(
          ((readRes.data ?? []) as { notice_id: string }[]).map((r) => r.notice_id),
        );
        const anns = (annRes.data ?? []) as { id: string }[];
        setUnread(anns.filter((a) => !readSet.has(a.id)).length);
      } catch {
        // 조회 실패 시 값 미표시
      }
    })();
  }, []);

  const lastLoginText = lastLogin ? lastLogin.slice(0, 16).replace("T", " ") : "-";

  return (
    <Card
      title="내 정보"
      icon="org"
      headerRight={
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-seum-600"
        >
          수정
        </button>
      }
    >
      {editing && <ProfileEditModal onClose={() => setEditing(false)} />}
      <div className="flex items-center gap-3 pb-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-seum-100 text-xl font-bold text-seum-700">
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt="프로필 사진" className="h-full w-full object-cover" />
          ) : (
            (me?.name ?? "·").charAt(0)
          )}
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold text-neutral-900">
            {name}
            {me?.positionName && (
              <span className="ml-1 text-sm font-normal text-neutral-500">{me.positionName}</span>
            )}
          </p>
          <p className="truncate text-xs text-neutral-500">{sub}</p>
          {me?.phone && <p className="truncate text-xs text-neutral-400">{me.phone}</p>}
          {me?.showroom && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-seum-50 px-2 py-0.5 text-[11px] font-medium text-seum-600">
              <Icon name="site" size={12} />
              {me.showroom}
            </span>
          )}
        </div>
      </div>

      <dl className="space-y-2 border-t border-neutral-100 pt-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-neutral-500">
            <Icon name="clock" size={15} className="text-neutral-400" />
            최근 로그인
          </dt>
          <dd className="tabular-nums text-neutral-700">{lastLoginText}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-neutral-500">
            <Icon name="notice" size={15} className="text-neutral-400" />
            미확인 공지
          </dt>
          <dd>
            <span className="rounded-full bg-seum-500 px-2 py-0.5 text-xs font-bold text-white">
              {unread ?? "-"}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
