// Shared Lingov styles (exact prototype values) and the logo.

export const card = "bg-[#0a0e16] border border-[#182033] rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_16px_32px_-20px_rgba(0,0,0,.9)]";
export const btnShadow = "shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_1px_2px_rgba(0,0,0,.4)]";
export const btnPrimary = `border-0 bg-[#1d8a50] text-white font-medium cursor-pointer flex items-center justify-center gap-2 transition-[background] duration-[.14s] hover:bg-[#187544] ${btnShadow}`;
export const btnPress = "active:translate-y-px active:shadow-none";
export const btnOutline = "border border-[#252f4a] bg-transparent text-[#eaeef7] font-medium cursor-pointer hover:bg-[#0f1522]";
export const input = "border border-[#1c2538] rounded-[12px] bg-[#0a0e16] shadow-[inset_0_1px_2px_rgba(0,0,0,.3)] text-[#eaeef7] outline-none transition-all duration-[.14s] focus:border-[#1d8a50] focus:shadow-[0_0_0_3px_rgba(29,138,80,.35)]";
export const tile = "bg-[linear-gradient(180deg,#141d2f,#0e1523)] border border-[#1b2538] flex items-center justify-center";
export const h2 = "font-semibold text-[16px] tracking-[-.015em]";
export const caps = "text-[11.5px] font-semibold tracking-[.04em] text-[#94a3c0]";
export const caps6 = "text-[11.5px] font-semibold tracking-[.06em] text-[#94a3c0]";
export const track = "h-[5px] bg-[#131b2a] rounded-full overflow-hidden";
export const levelPill = "text-[11.5px] font-semibold text-[#7fe3a8] bg-[#0e2417] rounded-full px-2 py-[2px]";

// Logo: size 40 (brand panel), 32 (header/sidebar), 56 (install card).
export function BrandMark({ size = 32, word = true }: { size?: 32 | 40 | 56; word?: boolean }) {
  const d = {
    32: { r: 9, inset: 7, bar: 3, bottom: 8, sq: 9, sqr: 3, text: 19, gap: 10 },
    40: { r: 11, inset: 9, bar: 4, bottom: 10, sq: 11, sqr: 4, text: 24, gap: 12 },
    56: { r: 14, inset: 13, bar: 5, bottom: 15, sq: 15, sqr: 5, text: 0, gap: 0 },
  }[size];
  return (
    <div className="flex items-center" style={{ gap: d.gap }}>
      <div
        className={`relative bg-[#1d8a50] ${size === 56 ? btnShadow : ""}`}
        style={{ width: size, height: size, borderRadius: d.r }}
      >
        <span className="absolute bg-white" style={{ left: d.inset, right: d.inset, bottom: d.bottom, height: d.bar, borderRadius: d.bar === 5 ? 3 : 2 }} />
        <span className="absolute bg-[#ffb38f]" style={{ left: d.inset, top: d.inset, width: d.sq, height: d.sq, borderRadius: d.sqr }} />
      </div>
      {word && d.text ? <span className="font-semibold tracking-[-.02em]" style={{ fontSize: d.text }}>lingov</span> : null}
    </div>
  );
}
