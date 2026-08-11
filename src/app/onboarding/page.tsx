'use client';

import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/onboarding-wizard';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f3eefc_0%,#08090d_100%)] py-12">
      <OnboardingWizard onComplete={() => router.push('/')} />
    </main>
  );
}
