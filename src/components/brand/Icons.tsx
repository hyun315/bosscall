/**
 * 공통 선 아이콘 — 24×24, 선 두께 2, 글자색(currentColor)을 따른다.
 * 의미 있는 아이콘은 글자색 토큰(ink·link·teal 등)으로 3:1 이상 대비를 확보한다.
 */
import type { ReactNode } from "react";

function Svg({ children, className = "h-6 w-6" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const IconHome = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </Svg>
);
export const IconHistory = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
export const IconDrivers = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.6 3.2-6 6.5-6s5.9 2.4 6.5 6" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M16 14.2c2.9.1 4.9 2.3 5.5 5.3" />
  </Svg>
);
export const IconSettings = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Svg>
);
export const IconProfile = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5" />
  </Svg>
);
export const IconBell = ({ className }: P) => (
  <Svg className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
  </Svg>
);
export const IconBack = ({ className }: P) => (
  <Svg className={className}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);
export const IconChevron = ({ className }: P) => (
  <Svg className={className}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);
export const IconInfo = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);
export const IconPin = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const IconFlag = ({ className }: P) => (
  <Svg className={className}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </Svg>
);
export const IconCar = ({ className }: P) => (
  <Svg className={className}>
    <path d="M5 16V11l2-5h10l2 5v5" />
    <path d="M3 16h18v2a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2Z" />
    <path d="M5 11h14" />
    <circle cx="7.5" cy="13.5" r=".6" fill="currentColor" />
    <circle cx="16.5" cy="13.5" r=".6" fill="currentColor" />
  </Svg>
);
export const IconStar = ({ className }: P) => (
  <Svg className={className}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
  </Svg>
);
export const IconSearch = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const IconMap = ({ className }: P) => (
  <Svg className={className}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </Svg>
);
export const IconNavigate = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3 11 21 3l-8 18-2-8-8-2Z" />
  </Svg>
);
export const IconEdit = ({ className }: P) => (
  <Svg className={className}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
  </Svg>
);
export const IconGlobe = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z" />
  </Svg>
);
export const IconLock = ({ className }: P) => (
  <Svg className={className}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const IconBook = ({ className }: P) => (
  <Svg className={className}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
  </Svg>
);
export const IconFamily = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="7" r="2.5" />
    <circle cx="12" cy="12.5" r="2" />
    <path d="M2.5 18c.4-3 2.2-5 4.5-5 1.2 0 2.2.5 3 1.3M21.5 18c-.4-3-2.2-5-4.5-5-1.2 0-2.2.5-3 1.3M8.5 21c.4-2.2 1.8-3.8 3.5-3.8s3.1 1.6 3.5 3.8" />
  </Svg>
);
export const IconWallet = ({ className }: P) => (
  <Svg className={className}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18M16 15h2" />
  </Svg>
);
export const IconSound = ({ className }: P) => (
  <Svg className={className}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
);
export const IconCheck = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Svg>
);
export const IconBan = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.7 5.7 12.6 12.6" />
  </Svg>
);
export const IconAlarm = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2M5 3 2.5 5.5M19 3l2.5 2.5" />
  </Svg>
);
export const IconLink = ({ className }: P) => (
  <Svg className={className}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Svg>
);
export const IconSend = ({ className }: P) => (
  <Svg className={className}>
    <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" />
  </Svg>
);
export const IconRefresh = ({ className }: P) => (
  <Svg className={className}>
    <path d="M20 11a8 8 0 0 0-14.5-4.5L3 9M4 13a8 8 0 0 0 14.5 4.5L21 15" />
    <path d="M3 4v5h5M21 20v-5h-5" />
  </Svg>
);
export const IconInbox = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    <path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6l2.5-8Z" />
  </Svg>
);
export const IconDownload = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </Svg>
);
export const IconChart = ({ className }: P) => (
  <Svg className={className}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);
export const IconHeartbeat = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3 12h4l2-5 4 10 2-5h6" />
  </Svg>
);
