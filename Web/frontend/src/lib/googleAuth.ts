declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          cancel?: () => void;
        };
      };
    };
  }
}

const GIS_LOCALE = "en";

let scriptLoadingPromise: Promise<void> | null = null;

/** Re-init when client id or forced UI locale changes */
let initializedKey: string | null = null;
let idTokenHandler: ((token: string) => void) | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://accounts.google.com/gsi/client?hl=${GIS_LOCALE}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google SDK"));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Renders the official Sign in with Google button (not One Tap prompt).
 * use_fedcm_for_button: false keeps the legacy button path where possible.
 */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  clientId: string,
  onIdToken: (token: string) => void,
  opts?: { buttonText?: "signin_with" | "signup_with" | "continue_with" },
): Promise<void> {
  if (!clientId.trim()) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID configuration");
  }

  await loadGoogleScript();

  const gsi = window.google?.accounts?.id;
  if (!gsi?.renderButton) {
    throw new Error("Google SDK is not initialized");
  }

  idTokenHandler = onIdToken;

  const initKey = `${clientId}|${GIS_LOCALE}`;
  if (initializedKey !== initKey) {
    gsi.initialize({
      client_id: clientId,
      locale: GIS_LOCALE,
      callback: (response: { credential?: string }) => {
        if (response?.credential && idTokenHandler) {
          idTokenHandler(response.credential);
        }
      },
      auto_select: false,
      use_fedcm_for_prompt: false,
      use_fedcm_for_button: false,
    });
    initializedKey = initKey;
  }

  container.replaceChildren();

  const w = Math.floor(container.getBoundingClientRect().width);
  gsi.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: opts?.buttonText ?? "signin_with",
    shape: "rectangular",
    width: w >= 200 ? w : 320,
  });
}
