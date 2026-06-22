const navigationItems = [
  "Stays",
  "Flights",
  "Car rental",
  "Attractions",
  "Airport taxis",
];

export default function HeaderNavigation() {
  return (
    <nav className="header__navigation" aria-label="Main navigation">
      {navigationItems.map((item) => (
        <span key={item} className="header__navigation-item">
          {item}
        </span>
      ))}
    </nav>
  );
}