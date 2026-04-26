// CourseShelf icon family — original glyphs, Lucide grammar.
// 24px viewBox, 1.5px stroke, round caps & joins, no fills (except stateful active variants).
const Icon = ({ name, size = 20, fill = false, className = '', style = {}, ...rest }) => {
  const stroke = 'currentColor';
  const sw = 1.5;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: `icon ${className}`,
    style,
    ...rest,
  };
  switch (name) {
    case 'play':
      return (
        <svg {...common}>
          <path d="M7 5l12 7-12 7V5z" fill={fill ? stroke : 'none'} />
        </svg>
      );
    case 'pause':
      return (
        <svg {...common}>
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      );
    case 'next':
      return (
        <svg {...common}>
          <path d="M5 5l10 7-10 7V5z" />
          <path d="M19 5v14" />
        </svg>
      );
    case 'prev':
      return (
        <svg {...common}>
          <path d="M19 5L9 12l10 7V5z" />
          <path d="M5 5v14" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" />
        </svg>
      );
    case 'library':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="4" height="16" rx="1" />
          <rect x="9" y="4" width="4" height="16" rx="1" />
          <path d="M16 5l4 14" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l4 4" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12c0 .5-.05 1-.13 1.5l2 1.5-2 3.5-2.4-1a7 7 0 01-2.6 1.5L13.5 22h-3l-.4-3a7 7 0 01-2.6-1.5l-2.4 1-2-3.5 2-1.5A7 7 0 015 12c0-.5.05-1 .13-1.5l-2-1.5 2-3.5 2.4 1A7 7 0 0110 5L10.5 2h3l.4 3a7 7 0 012.6 1.5l2.4-1 2 3.5-2 1.5c.08.5.13 1 .13 1.5z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12l5 5 9-11" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      );
    case 'circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 4v12" />
          <path d="M7 11l5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
      );
    case 'cloud':
      return (
        <svg {...common}>
          <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 0117 18H7z" />
        </svg>
      );
    case 'cloud-down':
      return (
        <svg {...common}>
          <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 0117 18" />
          <path d="M12 13v6" />
          <path d="M9 16l3 3 3-3" />
        </svg>
      );
    case 'bookmark':
      return (
        <svg {...common}>
          <path d="M6 4h12v17l-6-4-6 4V4z" fill={fill ? stroke : 'none'} />
        </svg>
      );
    case 'note':
      return (
        <svg {...common}>
          <path d="M5 4h11l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
          <path d="M16 4v4h4" />
          <path d="M8 13h8M8 17h5" />
        </svg>
      );
    case 'pdf':
      return (
        <svg {...common}>
          <path d="M7 3h8l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
          <path d="M15 3v4h4" />
          <text
            x="9"
            y="17"
            fontSize="6"
            fill={stroke}
            stroke="none"
            fontFamily="monospace"
            fontWeight="700"
          >
            PDF
          </text>
        </svg>
      );
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3 6a1 1 0 011-1h4l2 2h10a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0116 0" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21a7 7 0 0114 0" />
          <path d="M16 3a4 4 0 010 8" />
          <path d="M22 21a7 7 0 00-7-7" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg {...common}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      );
    case 'chevron-left':
      return (
        <svg {...common}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...common}>
          <path d="M5 9l7 7 7-7" />
        </svg>
      );
    case 'chevron-up':
      return (
        <svg {...common}>
          <path d="M5 15l7-7 7 7" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M20 14a8 8 0 01-10-10 8 8 0 1010 10z" />
        </svg>
      );
    case 'volume':
      return (
        <svg {...common}>
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          <path d="M16 8a5 5 0 010 8" />
        </svg>
      );
    case 'volume-mute':
      return (
        <svg {...common}>
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          <path d="M17 9l4 6M21 9l-4 6" />
        </svg>
      );
    case 'subtitles':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 14h4M13 14h4M7 11h2M11 11h6" />
        </svg>
      );
    case 'fullscreen':
      return (
        <svg {...common}>
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
      );
    case 'pip':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <rect x="12" y="11" width="7" height="6" rx="1" fill={stroke} />
        </svg>
      );
    case 'speed':
      return (
        <svg {...common}>
          <path d="M5 18a8 8 0 1114 0" />
          <path d="M12 14l4-4" />
        </svg>
      );
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="4" cy="6" r="1" fill={stroke} />
          <circle cx="4" cy="12" r="1" fill={stroke} />
          <circle cx="4" cy="18" r="1" fill={stroke} />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...common}>
          <path d="M4 5h16l-6 8v6l-4-2v-4L4 5z" />
        </svg>
      );
    case 'sort':
      return (
        <svg {...common}>
          <path d="M7 4v16M3 8l4-4 4 4" />
          <path d="M17 4v16M13 16l4 4 4-4" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'eye-off':
      return (
        <svg {...common}>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A11 11 0 0112 6c6 0 10 7 10 7a16 16 0 01-3 3.7M6 7.5A16 16 0 002 12s4 7 10 7a11 11 0 005.6-1.5" />
          <path d="M9.5 10a3 3 0 004.2 4.2" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 7 9-7" />
        </svg>
      );
    case 'key':
      return (
        <svg {...common}>
          <circle cx="8" cy="14" r="4" />
          <path d="M11 12l9-9M16 7l3 3" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 4l10 17H2L12 4z" />
          <path d="M12 10v5" />
          <circle cx="12" cy="18" r="0.5" fill={stroke} />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r="0.5" fill={stroke} />
        </svg>
      );
    case 'wifi-off':
      return (
        <svg {...common}>
          <path d="M3 3l18 18" />
          <path d="M5 12a10 10 0 0112-1" />
          <path d="M8 16a5 5 0 016-1" />
          <circle cx="12" cy="20" r="0.5" fill={stroke} />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 0115-6.7L21 8" />
          <path d="M21 4v4h-4" />
          <path d="M21 12a9 9 0 01-15 6.7L3 16" />
          <path d="M3 20v-4h4" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" />
          <path d="M14 6l3 3" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M5 7h14M9 7V4h6v3M7 7l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'more':
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.2" fill={stroke} stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill={stroke} stroke="none" />
          <circle cx="18" cy="12" r="1.2" fill={stroke} stroke="none" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case 'at':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 006 0v-1a9 9 0 10-3.5 7" />
        </svg>
      );
    case 'sliders':
      return (
        <svg {...common}>
          <path d="M4 6h10M18 6h2M4 18h2M10 18h10M4 12h6M14 12h6" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
      );
    case 'more-h':
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.2" fill={stroke} />
          <circle cx="12" cy="12" r="1.2" fill={stroke} />
          <circle cx="18" cy="12" r="1.2" fill={stroke} />
        </svg>
      );
    case 'corner-down-right':
      return (
        <svg {...common}>
          <path d="M5 4v8a3 3 0 003 3h11" />
          <path d="M14 10l5 5-5 5" />
        </svg>
      );
    case 'hard-drive':
      return (
        <svg {...common}>
          <rect x="3" y="13" width="18" height="7" rx="2" />
          <path d="M5 13l3-7h8l3 7" />
          <circle cx="7.5" cy="16.5" r="0.6" fill={stroke} />
          <circle cx="11" cy="16.5" r="0.6" fill={stroke} />
        </svg>
      );
    case 'github':
      return (
        <svg {...common}>
          <path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 00-.8-2.3c2.6-.3 5.3-1.3 5.3-5.7 0-1.1-.4-2.2-1.2-3 .4-1 .4-2.2-.1-3.2 0 0-1-.3-3.2 1.2a11 11 0 00-6 0C6.8 2 5.8 2.3 5.8 2.3c-.5 1-.5 2.2-.1 3.2-.8.8-1.2 1.9-1.2 3 0 4.4 2.7 5.4 5.3 5.7a3 3 0 00-.8 2.3V21" />
        </svg>
      );
    case 'banner':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
};
window.Icon = Icon;
