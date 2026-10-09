import { useEffect, useEffectEvent, useRef } from 'react';

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

interface GoogleCredential {
  credential: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredential) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let loading: Promise<GoogleIdentity> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google) return Promise.resolve(window.google);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.google) resolve(window.google);
      else reject(new Error('Google Identity Services did not load'));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error('Google Identity Services could not be loaded'));
    };
    document.head.append(script);
  });
  return loading;
}

/** Google's own "Sign in with Google" button (rendered by Google Identity Services). */
export function GoogleSignInButton({
  clientId,
  onCredential,
}: {
  clientId: string;
  onCredential: (idToken: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const handleCredential = useEffectEvent(onCredential);

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !container.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            handleCredential(response.credential);
          },
        });
        google.accounts.id.renderButton(container.current, {
          type: 'standard',
          size: 'large',
          width: '320',
        });
      })
      .catch(() => undefined); // offline or blocked: email sign-in still works
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return <div ref={container} className="flex justify-center" />;
}
