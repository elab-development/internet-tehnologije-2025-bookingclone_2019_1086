type Props = {
  onLoginClick: () => void;
  onRegisterClick: () => void;
};

export default function GuestActions({ onLoginClick, onRegisterClick }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onRegisterClick}
        style={{
          background: "#fff",
          color: "#003580",
          padding: "8px 12px",
          borderRadius: 6,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
        }}
      >
        Register
      </button>

      <button
        type="button"
        onClick={onLoginClick}
        style={{
          background: "#fff",
          color: "#003580",
          padding: "8px 12px",
          borderRadius: 6,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
        }}
      >
        Sign in
      </button>
    </>
  );
}