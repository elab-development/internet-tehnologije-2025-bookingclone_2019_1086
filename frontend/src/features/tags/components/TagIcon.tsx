type TagIconProps = {
  svg: string | null | undefined;
  label: string;
  className?: string;
  size?: number;
};

/**
 * Tag icons are raw SVG coming from the database. They are rendered through an
 * <img> data URL rather than dangerouslySetInnerHTML: an SVG loaded as an image
 * cannot run scripts, so a malicious icon cannot turn into stored XSS.
 */
export default function TagIcon({
  svg,
  label,
  className,
  size = 24,
}: TagIconProps) {
  const classNames = className ? `tag-icon ${className}` : "tag-icon";

  if (!svg || !svg.trim()) {
    return <span className={`${classNames} tag-icon--empty`} aria-hidden="true" />;
  }

  const source = `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;

  return (
    <img
      className={classNames}
      src={source}
      alt={label}
      width={size}
      height={size}
    />
  );
}
