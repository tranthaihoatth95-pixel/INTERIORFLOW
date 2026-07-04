'use client';

/**
 * Mặt các card tài liệu cho trang đăng nhập — tự vẽ bằng CSS/SVG, không cần ảnh ngoài.
 * Presentation: mini slide (bố cục dàn trang). Render: mini phối cảnh nội thất.
 * Kích thước card portrait ~ 152×196, tông quiet-luxury.
 */

const W = 152;
const H = 196;

function Card({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div style={{ width: W, height: H, background: bg }} className="relative">
      {children}
    </div>
  );
}

/* ---------- Presentation: slide dàn trang ---------- */

const SLIDE_BG = ['#f4efe6', '#ece5d8', '#1f1c17', '#e8ddcb'];
const INK = ['#211e19', '#211e19', '#f4efe6', '#3a3327'];

export const presentationFaces = [
  // slide bìa
  <Card key="p0" bg={SLIDE_BG[0]}>
    <div className="flex h-full flex-col justify-between p-4">
      <div className="text-[7px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#8a6f4d' }}>
        Concept · Bedroom
      </div>
      <div>
        <div className="font-serif text-[22px] leading-none" style={{ color: INK[0] }}>
          SERENE
        </div>
        <div className="mt-2 h-[2px] w-8" style={{ background: '#8a6f4d' }} />
        <div className="mt-2 space-y-1">
          <div className="h-[3px] w-20 rounded" style={{ background: 'rgba(33,30,25,.28)' }} />
          <div className="h-[3px] w-16 rounded" style={{ background: 'rgba(33,30,25,.2)' }} />
        </div>
      </div>
      <div className="flex gap-1">
        {['#f4efe6', '#d9cfc2', '#b39776', '#6f5b40', '#2b2620'].map((c) => (
          <div key={c} className="h-2 w-4" style={{ background: c }} />
        ))}
      </div>
    </div>
  </Card>,
  // slide nội dung + ảnh
  <Card key="p1" bg={SLIDE_BG[1]}>
    <div className="flex h-full gap-2 p-3.5">
      <div className="flex-1 space-y-1.5 pt-2">
        <div className="font-serif text-[12px] leading-tight" style={{ color: INK[1] }}>
          Chất liệu
        </div>
        {[16, 14, 15, 12].map((w, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full" style={{ background: '#8a6f4d' }} />
            <div className="h-[3px] rounded" style={{ width: w * 4, background: 'rgba(33,30,25,.25)' }} />
          </div>
        ))}
      </div>
      <div
        className="w-12 rounded"
        style={{ background: 'linear-gradient(150deg,#c8b9a3,#8a6f4d)' }}
      />
    </div>
  </Card>,
  // slide quote nền tối
  <Card key="p2" bg={SLIDE_BG[2]}>
    <div className="flex h-full flex-col items-center justify-center p-4 text-center">
      <div className="font-serif text-[30px] leading-none" style={{ color: '#8a6f4d' }}>
        &ldquo;
      </div>
      <div className="mt-1 space-y-1">
        <div className="mx-auto h-[3px] w-16 rounded" style={{ background: 'rgba(244,239,230,.5)' }} />
        <div className="mx-auto h-[3px] w-20 rounded" style={{ background: 'rgba(244,239,230,.35)' }} />
        <div className="mx-auto h-[3px] w-12 rounded" style={{ background: 'rgba(244,239,230,.5)' }} />
      </div>
    </div>
  </Card>,
  // slide moodboard grid
  <Card key="p3" bg={SLIDE_BG[3]}>
    <div className="grid h-full grid-cols-2 grid-rows-3 gap-1 p-2.5">
      {['#c8b9a3', '#8a6f4d', '#d9cfc2', '#6f5b40', '#b39776', '#2b2620'].map((c, i) => (
        <div key={i} className="rounded-sm" style={{ background: c }} />
      ))}
    </div>
  </Card>,
];

/* ---------- Concept: moodboard · vật liệu · pre-concept ---------- */

const MAT = ['#c8b9a3', '#8a6f4d', '#d9cfc2', '#6f5b40', '#b39776', '#e8ddcb'];

export const conceptFaces = [
  // bảng vật liệu (swatch + mã)
  <Card key="c0" bg="#efe9df">
    <div className="flex h-full flex-col gap-2 p-3.5">
      <div className="text-[7px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#8a6f4d' }}>
        Material board
      </div>
      {MAT.slice(0, 4).map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-6 w-6 rounded" style={{ background: c }} />
          <div className="flex-1 space-y-1">
            <div className="h-[3px] w-14 rounded" style={{ background: 'rgba(33,30,25,.28)' }} />
            <div className="h-[3px] w-9 rounded" style={{ background: 'rgba(33,30,25,.16)' }} />
          </div>
        </div>
      ))}
    </div>
  </Card>,
  // moodboard lưới
  <Card key="c1" bg="#e8ddcb">
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-1.5 p-2.5">
      {['linear-gradient(140deg,#c8b9a3,#8a6f4d)', 'linear-gradient(140deg,#d9cfc2,#b39776)', 'linear-gradient(140deg,#6f5b40,#2b2620)', 'linear-gradient(140deg,#e8ddcb,#c7a397)'].map((g, i) => (
        <div key={i} className="rounded" style={{ background: g }} />
      ))}
    </div>
  </Card>,
  // palette + style keyword
  <Card key="c2" bg="#f4efe6">
    <div className="flex h-full flex-col justify-between p-4">
      <div className="font-serif text-[16px] leading-tight" style={{ color: '#211e19' }}>
        Japandi
      </div>
      <div className="space-y-1.5">
        <div className="h-[3px] w-20 rounded" style={{ background: 'rgba(33,30,25,.25)' }} />
        <div className="h-[3px] w-14 rounded" style={{ background: 'rgba(33,30,25,.16)' }} />
      </div>
      <div className="flex gap-1">
        {MAT.map((c) => (
          <div key={c} className="h-3 flex-1 rounded-sm" style={{ background: c }} />
        ))}
      </div>
    </div>
  </Card>,
];

/* ---------- 3D Render: phối cảnh nội thất ---------- */

function Room({ h1, h2 }: { h1: number; h2: number }) {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sky${h1}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h1},30%,72%)`} />
          <stop offset="1" stopColor={`hsl(${h2},26%,50%)`} />
        </linearGradient>
        <linearGradient id={`flr${h1}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h2},18%,34%)`} />
          <stop offset="1" stopColor={`hsl(${h2},20%,22%)`} />
        </linearGradient>
      </defs>
      <rect width={W} height={H * 0.66} fill={`url(#sky${h1})`} />
      <rect y={H * 0.66} width={W} height={H * 0.34} fill={`url(#flr${h1})`} />
      {/* cửa sổ sáng */}
      <rect x={18} y={26} width={40} height={64} rx={2} fill={`hsl(${h1},22%,88%)`} opacity="0.85" />
      <rect x={24} y={32} width={28} height={52} rx={1} fill={`hsl(${h1},48%,66%)`} opacity="0.7" />
      {/* sofa/giường */}
      <rect x={84} y={104} width={54} height={12} rx={5} fill={`hsl(${h2},16%,80%)`} />
      <rect x={88} y={116} width={8} height={22} fill={`hsl(${h2},12%,66%)`} />
      <rect x={128} y={116} width={8} height={22} fill={`hsl(${h2},12%,66%)`} />
      {/* đèn */}
      <circle cx={112} cy={40} r={9} fill="hsl(45,90%,80%)" opacity="0.9" />
    </svg>
  );
}

export const renderFaces = [
  <Card key="r0" bg="#000">
    <Room h1={28} h2={32} />
  </Card>,
  <Card key="r1" bg="#000">
    <Room h1={200} h2={210} />
  </Card>,
  <Card key="r2" bg="#000">
    <Room h1={16} h2={26} />
  </Card>,
  <Card key="r3" bg="#000">
    <Room h1={140} h2={150} />
  </Card>,
];
