'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    setIsIos(ios);
    setStandalone(isStandalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    if (ios && !isStandalone) setVisible(true);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!visible || standalone) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    setVisible(false);
  }

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-20 z-[70] px-4 sm:bottom-6 sm:hidden">
      <div className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-violet-200 bg-white/95 p-4 text-zinc-900 shadow-xl backdrop-blur">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install MovieChoice</p>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {isIos
              ? 'On iPhone: tap Share, then Add to Home Screen for an app-like experience.'
              : 'Add to your home screen for a full-screen iPhone-style app.'}
          </p>
          <div className="mt-3 flex gap-2">
            {deferred ? (
              <button type="button" onClick={install} className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-bold text-white">
                Install
              </button>
            ) : null}
            <button type="button" onClick={() => setVisible(false)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-500">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
