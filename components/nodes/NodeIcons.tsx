/**
 * components/nodes/NodeIcons.tsx — Bộ icon flat/line SVG inline cho từng loại node.
 * KHÔNG import thư viện icon ngoài. Mỗi node type có 1 icon 16x16 nhất quán.
 */

interface IconProps {
  size?: number;
  className?: string;
}

/** Fallback icon — hình vuông bo góc (node chưa gán icon riêng). */
function IconDefault({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Import Image — khung ảnh + núi. */
function IconImage({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 11l3.5-4 2.5 3 2-2.5L14.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="5" cy="5.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Text Prompt — con trỏ nhập. */
function IconPrompt({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M4 3h8M4 8h6M4 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Style Preset — palette swatch. */
function IconStylePreset({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Room Info — bounding box phòng. */
function IconRoomInfo({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 8h12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <path d="M8 3v10" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Gu Reference — mắt thẩm mỹ. */
function IconGuRef({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** AI Generate — lấp lánh / wand. */
function IconAiGen({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3.5 3.5l2 2M10.5 10.5l2 2M3.5 12.5l2-2M10.5 5.5l2-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Sketch → Render — bút + mũi tên. */
function IconSketchRender({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 14l1.5-5L11 1.5 14.5 5 7 12.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3.5 9L7 12.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Clay → Photoreal — khối hộp. */
function IconClay({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 1L2 4.5v7L8 15l6-3.5v-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 8v7M2 4.5L8 8l6-3.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Camera — khung camera. */
function IconCamera({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="4" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11.5 6.5L15 4.5v7l-3.5-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/** CAD → 3D — wireframe cube. */
function IconCad3D({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M4 5l4-3 4 3v6l-4 3-4-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4 5l4 3 4-3M8 8v6" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Text2Image — khung ảnh + ngôi sao. */
function IconText2Image({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 5l.7 2.2H11l-1.8 1.3.7 2.2L8 9.4l-1.9 1.3.7-2.2L5 7.2h2.3z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/** ID Mask — lưới vùng. */
function IconIdMask({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Furniture Extract — kéo tách lớp. */
function IconExtract({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="6" width="12" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 6V3.5a1 1 0 011-1h4a1 1 0 011 1V6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Local Edit — bút chỉnh cục bộ. */
function IconLocalEdit({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 10l.8-2.5L10.5 4 12 5.5 8.5 9.2z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** Material Swap — 2 lớp chồng. */
function IconMaterialSwap({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6.5" y="1.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Furniture Add/Remove — ghế + plus. */
function IconFurniture({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 12h10M4 12V9a1 1 0 011-1h6a1 1 0 011 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 5h2M13 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Relight — bóng đèn. */
function IconRelight({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 10.5v2a2 2 0 004 0v-2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2.5v-1M3 4L2.2 3.2M13 4l.8-.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Upscale — mũi tên phóng to. */
function IconUpscale({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 10l4-4M10 10V6H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Remove BG — kéo cắt nền. */
function IconRemoveBg({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.5 2" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Mask Painter — brush. */
function IconMask({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2.5 13.5l1-4L12 1l2.5 2.5-8.5 8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/** Color Palette — 3 swatches. */
function IconPalette({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="11" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Compare A/B — chia ngang. */
function IconCompare({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2v12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Slide — trình bày 16:9. */
function IconSlide({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="3" width="13" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 13h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 11.5V13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Moodboard — lưới ảnh. */
function IconMoodboard({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="9" y="1" width="6" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="9" y="6.5" width="6" height="8.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="1" y="9" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/** Export Board — khung xuất. */
function IconBoard({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 6v4M6 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Gallery — lưu vào kho. */
function IconGallery({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 4v9a1 1 0 001 1h10a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 2h14v2H1z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Video — play triangle. */
function IconVideo({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 5.5l4.5 2.5-4.5 2.5z" fill="currentColor" />
    </svg>
  );
}

/** Watermark — chữ W nghiêng. */
function IconWatermark({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 10l2-5 2 3.5 2-3.5 2 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Crop — crop corners. */
function IconCrop({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M4 1v11h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 15V4H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Composite — stacking layers. */
function IconComposite({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="4" y="4" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" fill="var(--bg, #1a1a2e)" />
    </svg>
  );
}

/** Annotate — callout bubble. */
function IconAnnotate({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 3v-3H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Material Note — tag nhãn vật liệu. */
function IconMaterialNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 3a1 1 0 011-1h7l4 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Sketch pad — free draw. */
function IconSketchPad({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 13c1-3 2-5 4-7s3-2 5-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Empty staging — phòng trống + ghế. */
function IconStaging({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 10h6M6 10v2M10 10v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Style Transfer — arrows loop. */
function IconStyleTransfer({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 8a6 6 0 0110.5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M14 8a6 6 0 01-10.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 2l1 2-2 .5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14l-1-2 2-.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Exterior / Facade — building. */
function IconExterior({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 14V5l6-3 6 3v9" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="6" y="9" width="4" height="5" stroke="currentColor" strokeWidth="1" />
      <rect x="4" y="6" width="2" height="2" stroke="currentColor" strokeWidth="0.8" />
      <rect x="10" y="6" width="2" height="2" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

/** Batch Variants — grid repeat. */
function IconBatchVariants({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1" y="1" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="9.5" y="1" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="1" y="9.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/** Edit manual — sliders. */
function IconEditManual({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <circle cx="5" cy="4" r="1.5" fill="currentColor" />
      <circle cx="10" cy="8" r="1.5" fill="currentColor" />
      <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Lookup: node type → icon component. Fallback = IconDefault.
 */
const ICON_MAP: Record<string, (props: IconProps) => JSX.Element> = {
  // Input
  'input.image': IconImage,
  'input.prompt': IconPrompt,
  'input.stylepreset': IconStylePreset,
  'input.roominfo': IconRoomInfo,
  'input.guref': IconGuRef,

  // AI Generate
  'ai.sketch2render': IconSketchRender,
  'ai.clay2render': IconClay,
  'ai.emptystaging': IconStaging,
  'ai.styletransfer': IconStyleTransfer,
  'ai.moodboard': IconMoodboard,
  'ai.exterior': IconExterior,
  'ai.batchvariants': IconBatchVariants,
  'ai.image2video': IconVideo,
  'ai.text2video': IconVideo,

  // Render v2
  'ai.text2image': IconText2Image,
  'three.camera': IconCamera,
  'three.cad2fbx': IconCad3D,
  'ai.idmask': IconIdMask,
  'ai.furnitureextract': IconExtract,
  'ai.localedit': IconLocalEdit,

  // AI Edit
  'ai.materialswap': IconMaterialSwap,
  'ai.furniture': IconFurniture,
  'ai.relight': IconRelight,
  'ai.upscale': IconUpscale,
  'ai.removebg': IconRemoveBg,

  // Slide
  'slide.concept': IconSlide,
  'slide.composer': IconSlide,
  'slide.deck': IconSlide,

  // Utility
  'util.maskpainter': IconMask,
  'util.sketchpad': IconSketchPad,
  'util.edit': IconEditManual,
  'util.palette': IconPalette,
  'util.compare': IconCompare,
  'util.annotate': IconAnnotate,
  'util.watermark': IconWatermark,
  'util.crop': IconCrop,
  'util.composite': IconComposite,
  'util.materialnote': IconMaterialNote,

  // Output
  'out.moodboard': IconMoodboard,
  'out.board': IconBoard,
  'out.gallery': IconGallery,

  // Compare models
  'render.compare': IconCompare,
};

/** Trả component icon cho node type. Fallback = hình vuông bo góc. */
export function nodeIconFor(defType: string): (props: IconProps) => JSX.Element {
  return ICON_MAP[defType] ?? IconDefault;
}

export { IconDefault };
