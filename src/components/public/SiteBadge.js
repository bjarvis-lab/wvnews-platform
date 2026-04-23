// Color + code badge used as a fallback when a publication doesn't have a
// dedicated logo asset yet. Takes the publication's brand color and 2–3 letter
// code, renders a circular badge. Scales with `size` (px diameter).

export default function SiteBadge({ site, size = 40 }) {
  const codeLen = (site.code || '').length;
  const fontSize = size * (codeLen <= 2 ? 0.42 : 0.32);

  return (
    <div
      aria-label={site.name}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        background: site.color || '#1a2c5b',
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        fontWeight: 700,
        fontSize,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {site.code}
    </div>
  );
}
