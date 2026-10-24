// Shared Lingov styles (exact prototype values) and the logo.
import { Bird, Cat, Dog, Fish, Panda, Rabbit, Squirrel, Turtle, type LucideIcon } from "lucide-react";

export const card = "bg-[#171A19] border border-[#2A2F2D] rounded-[22px]";
export const btnShadow = "shadow-[inset_-4px_-5px_0_#2F9674] active:shadow-[inset_-2px_-3px_0_#2F9674]";
export const btnPrimary = `rounded-full border-0 bg-[#52C79A] text-[#052013] font-bold cursor-pointer flex items-center justify-center gap-2 transition-[background,transform] duration-100 hover:bg-[#6BD3AB] active:scale-[.96] ${btnShadow}`;
export const btnPress = "";
export const btnOutline = "rounded-full border-[1.5px] border-[#2A2F2D] bg-[#171A19] text-[#F3F6F4] font-bold cursor-pointer shadow-[inset_-4px_-5px_0_#080A09] active:scale-[.96] active:shadow-[inset_-2px_-3px_0_#080A09] transition-transform duration-100";
export const input = "h-[46px] border-[1.5px] border-[#2A2F2D] rounded-[16px] bg-[#171A19] text-[#F3F6F4] outline-none transition-colors duration-150 focus:border-[#52C79A] aria-invalid:border-[#F26B6B] aria-invalid:animate-[lgshake_.3s]";
export const tile = "bg-[#212524] border border-[#2A2F2D] flex items-center justify-center";
export const h2 = "font-bold text-[20px] leading-[1.25]";
export const caps = "text-[12.5px] font-medium uppercase tracking-[.04em] text-[#A3ABA7]";
export const caps6 = "text-[12.5px] font-medium uppercase tracking-[.04em] text-[#A3ABA7]";
export const track = "h-2 bg-[#2A2F2D] rounded-full overflow-hidden";
export const levelPill = "text-[12.5px] font-bold text-[#EDBF73] bg-[rgba(237,191,115,.15)] rounded-full px-2.5 py-[2px]";

// Logo: size 40 (brand panel), 32 (header/sidebar), 56 (install card).
export function BrandMark({ size = 32, word = true }: { size?: 32 | 40 | 56; word?: boolean }) {
  const d = {
    32: { r: 9, inset: 7, bar: 3, bottom: 8, sq: 9, sqr: 3, text: 19, gap: 10 },
    40: { r: 11, inset: 9, bar: 4, bottom: 10, sq: 11, sqr: 4, text: 24, gap: 12 },
    56: { r: 16, inset: 13, bar: 5, bottom: 15, sq: 15, sqr: 5, text: 0, gap: 0 },
  }[size];
  return (
    <div className="flex items-center" style={{ gap: d.gap }}>
      <div
        className={`relative bg-[#52C79A]`}
        style={{ width: size, height: size, borderRadius: d.r }}
      >
        <span className="absolute bg-[#052013]" style={{ left: d.inset, right: d.inset, bottom: d.bottom, height: d.bar, borderRadius: d.bar === 5 ? 3 : 2 }} />
        <span className="absolute bg-[#052013]" style={{ left: d.inset, top: d.inset, width: d.sq, height: d.sq, borderRadius: d.sqr }} />
      </div>
      {word && d.text ? <span className="font-bold tracking-[-.01em]" style={{ fontSize: d.text }}>lingov</span> : null}
    </div>
  );
}

// Profile picture: a photo URL (Google) or an emoji, falling back to the name's first letter.
// Each picture has its own colour from the Emerald palette: a flat tinted disc with the icon in the full colour.
const ICONS: Record<string, [LucideIcon, string]> = {
  cat: [Cat, "#EDBF73"], dog: [Dog, "#52C79A"], bird: [Bird, "#9ADBBE"], fish: [Fish, "#F26B6B"],
  rabbit: [Rabbit, "#F26B6B"], squirrel: [Squirrel, "#EDBF73"], turtle: [Turtle, "#52C79A"], panda: [Panda, "#9ADBBE"],
};

export function Pic({ image, initial }: { image: string; initial: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (image.startsWith("http")) return <img src={image} alt="" referrerPolicy="no-referrer" className="size-full rounded-full object-cover" />;
  const pic = image.startsWith("icon:") ? ICONS[image.slice(5)] : null;
  if (pic) {
    const [Icon, c] = pic;
    return (
      <span className="flex size-full items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${c} 22%, #171A19)`, color: c }}>
        <Icon className="size-[52%]" strokeWidth={2} />
      </span>
    );
  }
  return <>{image || initial}</>; // older pictures were emojis
}

// Milestone confetti (CSS only). Hidden under prefers-reduced-motion via .lg-confetti in globals.css.
const CONFETTI = ["#52C79A", "#EDBF73", "#9ADBBE", "#F3F6F4"];
export function Confetti() {
  return (
    <div aria-hidden className="lg-confetti pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-4 h-2 w-1.5 rounded-[2px]"
          style={{
            background: CONFETTI[i % 4],
            ["--dx" as string]: `${((i * 37) % 240) - 120}px`,
            ["--dy" as string]: `${60 + ((i * 53) % 140)}px`,
            ["--rot" as string]: `${(i * 67) % 360}deg`,
            animation: `lgconfetti 1.1s ${(i % 6) * 0.04}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}
