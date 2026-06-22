export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 60,
        borderTop: "1px solid #e5e7eb",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px",
          fontSize: 14,
          color: "#667085",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>© {new Date().getFullYear()} Booking Clone</span>
        <span>Terms · Privacy · Support</span>
      </div>
    </footer>
  );
}
