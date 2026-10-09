"use client";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { googleMapsViewUrl } from "@/lib/format";

/** 픽업/목적지 표시 (§18 LocationCard, §5 C03) */
export function LocationCard({
  kind,
  name,
  address,
  lat,
  lng,
  placeId,
  action,
  large = false,
}: {
  kind: "pickup" | "destination";
  name: string | null;
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string | null;
  action?: ReactNode;
  large?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 ${large ? "text-2xl" : "text-xl"}`} aria-hidden>
        {kind === "pickup" ? "📍" : "🎯"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink-sub">{kind === "pickup" ? t("loc.pickup") : t("loc.destination")}</p>
        {name && <p className={`font-bold text-ink ${large ? "text-xl" : "text-base"}`}>{name}</p>}
        <p className={`${name ? "text-sm text-ink-sub" : `font-semibold text-ink ${large ? "text-xl" : "text-base"}`} break-words`}>
          {address}
        </p>
        {lat !== undefined && lng !== undefined && (
          <a
            href={googleMapsViewUrl(lat, lng, placeId ?? null)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-sm font-semibold text-action"
          >
            {t("common.viewOnMap")}
          </a>
        )}
      </div>
      {action}
    </div>
  );
}

/** 즐겨찾기/최근 장소 목록 항목 (§18 FavoriteLocationCard / RecentLocationCard) */
export function PlaceRow({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[56px] flex-1 items-center gap-3 px-4 py-2.5 text-left active:bg-bg"
      >
        <span className="text-xl" aria-hidden>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{title}</span>
          {subtitle && <span className="block truncate text-[13px] text-ink-sub">{subtitle}</span>}
        </span>
      </button>
      {trailing}
    </div>
  );
}

export function FavoriteLocationCard(props: { name: string; address: string; onClick?: () => void; trailing?: ReactNode }) {
  return <PlaceRow icon="⭐" title={props.name} subtitle={props.address} onClick={props.onClick} trailing={props.trailing} />;
}

export function RecentLocationCard(props: { title: string; address: string; onClick?: () => void }) {
  return <PlaceRow icon="🕘" title={props.title} subtitle={props.address} onClick={props.onClick} />;
}
