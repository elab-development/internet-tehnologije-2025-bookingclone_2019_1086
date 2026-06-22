type Props = {
  onLoginClick: () => void;
  onRegisterClick: () => void;
};

export default function GuestActions({ onLoginClick, onRegisterClick }: Props) {
  return (
    <div className="header__guest-actions">
      <button
        type="button"
        onClick={onRegisterClick}
        className="header__auth-button"
      >
        Register
      </button>

      <button
        type="button"
        onClick={onLoginClick}
        className="header__auth-button"
      >
        Sign in
      </button>
    </div>
  );
}