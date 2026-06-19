import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { authApi, saveAuthUser, saveToken, type AuthUser } from "../lib/api";
import { renderGoogleSignInButton } from "../lib/googleAuth";

type View = "login" | "register" | "forgot";

export default function LoginPanel({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
}) {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const googleBtnHostRef = useRef<HTMLDivElement>(null);

  const handleGoogleIdToken = useCallback(
    async (idToken: string) => {
      setError("");
      setMessage("");
      setLoading(true);
      try {
        const res = await authApi.googleLogin(idToken);
        saveToken(res.data.token);
        saveAuthUser(res.data.user);
        onSuccess?.(res.data.user);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  useLayoutEffect(() => {
    if (view === "forgot") {
      return;
    }

    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? "";
    const el = googleBtnHostRef.current;
    if (!el) {
      return;
    }

    if (!clientId) {
      setError("Missing VITE_GOOGLE_CLIENT_ID. Copy .env.example to .env.");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await renderGoogleSignInButton(
          el,
          clientId,
          (token) => {
            if (!cancelled) {
              void handleGoogleIdToken(token);
            }
          },
          { buttonText: view === "register" ? "signup_with" : "signin_with" },
        );
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Google sign-in failed to load");
        }
      }
    })();

    return () => {
      cancelled = true;
      el.replaceChildren();
    };
  }, [view, handleGoogleIdToken]);

  const handleSendCode = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    setError("");
    setMessage("");
    setSendingCode(true);
    try {
      if (view === "register") {
        await authApi.sendRegisterCode(email);
      } else {
        await authApi.sendForgotCode(email);
      }
      setMessage("Verification code sent. Please check your inbox");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (view === "login") {
        const res = await authApi.login(email, password);
        saveToken(res.data.token);
        saveAuthUser(res.data.user);
        onSuccess?.(res.data.user);
      } else if (view === "register") {
        const res = await authApi.register(email, password, name, code);
        saveToken(res.data.token);
        saveAuthUser(res.data.user);
        setMessage("Registration successful");
        onSuccess?.(res.data.user);
      } else {
        await authApi.resetPassword(email, code, password);
        setMessage("Password reset successful. Please sign in again");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const title = view === "login" ? "Sign In" : view === "register" ? "Sign Up" : "Reset Password";

  return (
    <div
      className="login-panel"
      style={{
        position: "absolute",
        left: "62%",
        top: "28%",
        width: "24%",
        minWidth: 280,
        maxWidth: 420,
        zIndex: 10,
        borderRadius: 14,
        border: "1px solid rgba(86, 152, 174, 0.3)",
        background: "rgba(10, 20, 30, 0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "28px 24px",
        boxSizing: "border-box",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        animation: "slideIn 0.35s ease-out",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 10,
          right: 14,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          fontSize: 20,
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 600, color: "#fff", letterSpacing: 0 }}>
        {title}
      </h2>

      {view !== "forgot" && (
        <div
          ref={googleBtnHostRef}
          style={{
            marginBottom: 12,
            width: "100%",
            minHeight: 44,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: loading ? 0.65 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
          aria-label="Google sign-in"
        />
      )}

      <form onSubmit={handleSubmit}>
        <input className="login-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />

        {view === "register" && (
          <input className="login-input" type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        )}

        {(view === "login" || view === "register") && (
          <input className="login-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        )}

        {view === "forgot" && (
          <input className="login-input" type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        )}

        {view !== "login" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                className="login-input"
                type="text"
                placeholder="Verification Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              <button type="button" onClick={handleSendCode} disabled={sendingCode} style={{ ...primaryBtnStyle, width: 110, padding: "0 8px", fontSize: 13 }}>
                {sendingCode ? "..." : "Send Code"}
              </button>
            </div>
          </>
        )}

        {error && <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        {message && <p style={{ color: "#7ec8e3", fontSize: 13, margin: "0 0 12px" }}>{message}</p>}

        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? "..." : title}
        </button>
      </form>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        {view === "login" && (
          <>
            <button onClick={() => setView("register")} style={linkStyle}>Sign Up</button>
            <button onClick={() => setView("forgot")} style={linkStyle}>Forgot Password</button>
          </>
        )}
        {view !== "login" && (
          <button onClick={() => setView("login")} style={linkStyle}>Back to Sign In</button>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid rgba(86, 152, 174, 0.3)",
  background: "rgba(255, 255, 255, 0.08)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  borderRadius: 8,
  border: "none",
  background: "#5698AE",
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#7ec8e3",
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
};
