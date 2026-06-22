export default function HeaderNavigation() {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px 16px",
        display: "flex",
        gap: 24,
        fontWeight: 600,
      }}
    >
      <span>Stays</span>
      <span>Flights</span>
      <span>Car rental</span>
      <span>Attractions</span>
      <span>Airport taxis</span>
    </div>
  );
}