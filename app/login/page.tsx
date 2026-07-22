'use client';

/**
 * /login — dùng lại LoginScreen sẵn có (nội dung entry cards + form auth).
 * Wrapper `layoutId="hero-glass"` để nếu intro→login được điều phối trong cùng cây
 * motion (LayoutGroup) sẽ morph mượt. Cross-page layoutId của Framer Motion không
 * bảo đảm mượt qua router.push nên đây chỉ là marker chờ tương lai; hiện tại
 * intro fade → login mount bình thường.
 */

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/entry/LoginScreen';

export default function LoginPage() {
  const router = useRouter();
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Marker cho morph — invisible, position 0 để không đụng layout */}
      <motion.div
        layoutId="hero-glass"
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          pointerEvents: 'none',
          opacity: 0,
        }}
      />
      <LoginScreen onAuthed={() => router.push('/')} />
    </div>
  );
}
