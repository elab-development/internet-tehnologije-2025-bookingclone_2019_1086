import React, { useState } from "react";
import * as authService from "../../services/authService";
import { setAccessToken, setAuthUser } from "../../auth/authStorage";

type Role = "USER" | "HOST" | "ADMIN";

type Props = {
  onSuccess: () => void;
};

export default function RegisterForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("USER");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() === "" ? null : phone.trim(),
        role,
      });

      if (res?.access_token) {
        setAccessToken(res.access_token);
      }

      const user = await authService.me();
      setAuthUser(user);

      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {error ? (
        <div
          style={{
            background: "#fff1f2",
            color: "#991b1b",
            border: "1px solid #fecdd3",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
            fontSize: 14,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#667085",
            }}
          >
            Name
          </label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
            autoComplete="name"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#667085",
            }}
          >
            Email
          </label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#667085",
            }}
          >
            Phone (optional)
          </label>
          <input
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+381..."
            autoComplete="tel"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#667085",
            }}
          >
            Password
          </label>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a password"
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#667085",
            }}
          >
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 14,
              background: "#fff",
            }}
          >
            <option value="USER">USER</option>
            <option value="HOST">HOST</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid transparent",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
