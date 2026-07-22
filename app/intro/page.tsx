'use client';

/**
 * /intro — public route, không cần auth. Nếu user đã xem intro
 * (`localStorage.if_intro_seen_v1='1'`) → redirect `/login` ngay để tránh xem lại.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IntroSequence } from '@/components/intro/IntroSequence';

export default function IntroPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('if_intro_seen_v1') === '1') {
        router.replace('/login');
        return;
      }
    } catch {}
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main style={{ minHeight: '100vh', background: '#F1ECE3' }} />
    );
  }

  return <IntroSequence />;
}
