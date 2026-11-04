"use client";
/**
 * 광고 이미지 자르기 — 어떤 사진을 올려도 정해진 규격(가로×세로 픽셀)으로 잘라 JPEG 으로 만든다.
 * 끌어서 위치, 슬라이더로 확대. 결과는 서버 저장 한도(약 650KB) 아래로 압축한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_BYTES = 650_000;

interface Spec {
  w: number;
  h: number;
}

export function ImageCropper({
  spec,
  value,
  onChange,
  safe,
}: {
  spec: Spec;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  /** 글자를 넣을 안전 영역 (가로·세로 여백 %) — 점선으로만 표시, 이미지에는 들어가지 않음 */
  safe?: { x: number; y: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 확대 배율과 이동 가능 범위 */
  const geom = useCallback(
    (image: HTMLImageElement, z: number) => {
      const cover = Math.max(spec.w / image.naturalWidth, spec.h / image.naturalHeight);
      const s = cover * z;
      const dw = image.naturalWidth * s;
      const dh = image.naturalHeight * s;
      return { s, dw, dh, mx: (dw - spec.w) / 2, my: (dh - spec.h) / 2 };
    },
    [spec.w, spec.h],
  );

  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

  // 그리기
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !img) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const g = geom(img, zoom);
    const x = (spec.w - g.dw) / 2 + clamp(off.x, g.mx);
    const y = (spec.h - g.dh) / 2 + clamp(off.y, g.my);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, spec.w, spec.h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x, y, g.dw, g.dh);

    // 손을 뗀 뒤 잠깐 있다가 결과 만들기
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      let q = 0.9;
      let url = c.toDataURL("image/jpeg", q);
      while (url.length * 0.75 > MAX_BYTES && q > 0.4) {
        q -= 0.08;
        url = c.toDataURL("image/jpeg", q);
      }
      if (url.length * 0.75 > MAX_BYTES) {
        setError("이미지가 너무 복잡해 용량을 줄이지 못했습니다. 다른 이미지를 써 주세요.");
        onChange(null);
      } else onChange(url);
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // onChange 는 부모가 매번 새로 만들 수 있으므로 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, zoom, off, geom, spec.w, spec.h]);

  const pick = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
      setError("JPG·PNG 이미지만 올릴 수 있습니다.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("20MB 이하 이미지만 올릴 수 있습니다.");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setOff({ x: 0, y: 0 });
    };
    image.onerror = () => {
      setError("이미지를 열 수 없습니다. JPG·PNG 로 다시 저장해 올려 주세요.");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const scaleToCanvas = () => {
    const c = canvasRef.current;
    if (!c) return 1;
    return spec.w / c.getBoundingClientRect().width;
  };

  const lowRes = img ? geom(img, zoom).s > 1.05 : false;

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {!img ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ aspectRatio: `${spec.w} / ${spec.h}` }}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-line bg-surface text-ink-sub active:bg-bg"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full rounded-card object-cover" />
          ) : (
            <>
              <span className="text-2xl" aria-hidden>
                🖼️
              </span>
              <span className="text-sm font-semibold">이미지 선택</span>
              <span className="text-xs">
                {spec.w} × {spec.h} px 로 맞춰집니다
              </span>
            </>
          )}
        </button>
      ) : (
        <>
          <div className="relative">
          <canvas
            ref={canvasRef}
            width={spec.w}
            height={spec.h}
            className="block w-full cursor-grab touch-none rounded-card bg-line shadow-card active:cursor-grabbing"
            onPointerDown={(e) => {
              (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || !img) return;
              const k = scaleToCanvas();
              const g = geom(img, zoom);
              setOff({ x: clamp(d.ox + (e.clientX - d.x) * k, g.mx), y: clamp(d.oy + (e.clientY - d.y) * k, g.my) });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          />
          {safe && (
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-md border border-dashed border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
              style={{ left: `${safe.x}%`, right: `${safe.x}%`, top: `${safe.y}%`, bottom: `${safe.y}%` }}
            />
          )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-ink-sub" aria-hidden>
              🔍
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-action"
              aria-label="확대"
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-link">
              다시 선택
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-sub">
            끌어서 위치를 맞추고, 막대로 확대하세요.{safe ? " 글자는 점선 안에 들어가게 해 주세요." : ""}
          </p>
          {lowRes && <p className="mt-1 text-xs font-semibold text-warning-text">원본 해상도가 작아 흐릿하게 보일 수 있어요.</p>}
        </>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
