/**
 * DATA BANK & STORAGE MANAGER - LEARNING ENGLISH WITH BUNDA SHAUMI
 * Menyediakan bank 15 kosakata hobi bawaan, ilustrasi SVG kartun resolusi tinggi,
 * serta fungsi CRUD, Export/Download CSV, Import CSV, dan Sinkronisasi Google Sheets.
 */

const DEFAULT_HOBBY_BANK = [
  {
    id: 'reading',
    word: 'READING',
    meaning: 'Membaca',
    hint: 'Membaca buku cerita atau majalah',
    svgType: 'reading',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <ellipse cx="60" cy="86" rx="44" ry="8" fill="#cbd5e1"/>
      <path d="M14 28 C14 23, 55 21, 60 32 C65 21, 106 23, 106 28 L106 78 C106 82, 65 80, 60 86 C55 80, 14 82, 14 78 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
      <path d="M19 24 C32 20, 52 22, 60 32 L60 80 C52 72, 32 71, 19 74 Z" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <path d="M101 24 C88 20, 68 22, 60 32 L60 80 C68 72, 88 71, 101 74 Z" fill="#fefce8" stroke="#93c5fd" stroke-width="2"/>
      <g stroke="#64748b" stroke-width="3" stroke-linecap="round">
        <line x1="27" y1="36" x2="50" y2="39"/><line x1="27" y1="46" x2="50" y2="49"/><line x1="27" y1="56" x2="46" y2="58"/>
        <line x1="70" y1="39" x2="93" y2="36"/><line x1="70" y1="49" x2="93" y2="46"/><line x1="70" y1="58" x2="88" y2="56"/>
      </g>
      <path d="M57 32 L63 32 L63 62 L60 56 L57 62 Z" fill="#f43f5e"/>
    </svg>`
  },
  {
    id: 'singing',
    word: 'SINGING',
    meaning: 'Bernyanyi',
    hint: 'Bernyanyi menggunakan mikrofon',
    svgType: 'singing',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <rect x="44" y="84" width="32" height="8" rx="4" fill="#475569"/>
      <rect x="55" y="64" width="10" height="22" rx="3" fill="#64748b"/>
      <path d="M40 42 C40 60, 80 60, 80 42" fill="none" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
      <rect x="46" y="16" width="28" height="40" rx="14" fill="#e2e8f0" stroke="#475569" stroke-width="3.5"/>
      <line x1="48" y1="27" x2="72" y2="27" stroke="#64748b" stroke-width="2.5"/>
      <line x1="48" y1="35" x2="72" y2="35" stroke="#64748b" stroke-width="2.5"/>
      <line x1="48" y1="43" x2="72" y2="43" stroke="#64748b" stroke-width="2.5"/>
      <g fill="#ec4899"><circle cx="24" cy="40" r="6"/><path d="M29 40 L29 18 L40 15 L40 22 L29 25" fill="none" stroke="#ec4899" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g fill="#f59e0b"><circle cx="94" cy="34" r="6"/><path d="M99 34 L99 14 L108 18" fill="none" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/></g>
      <circle cx="88" cy="54" r="4.5" fill="#06b6d4"/><line x1="92" y1="54" x2="92" y2="39" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'dancing',
    word: 'DANCING',
    meaning: 'Menari',
    hint: 'Menggerakkan badan mengikuti irama musik',
    svgType: 'dancing',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <ellipse cx="60" cy="89" rx="30" ry="6" fill="#fbcfe8"/>
      <circle cx="60" cy="21" r="10" fill="#fb7185"/>
      <path d="M32 24 Q45 38 56 38" fill="none" stroke="#ec4899" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M88 20 Q76 34 64 38" fill="none" stroke="#ec4899" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M53 36 L67 36 L77 64 L43 64 Z" fill="#a855f7" stroke="#7e22ce" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M52 64 L40 85" stroke="#ec4899" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M68 64 L82 79" stroke="#ec4899" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M22 46 L25 52 L31 55 L25 58 L22 64 L19 58 L13 55 L19 52 Z" fill="#facc15"/>
      <path d="M98 44 L100 49 L105 51 L100 53 L98 58 L96 53 L91 51 L96 49 Z" fill="#38bdf8"/>
      <circle cx="96" cy="26" r="4" fill="#f97316"/><path d="M99 26 L99 13 L107 15" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'cooking',
    word: 'COOKING',
    meaning: 'Memasak',
    hint: 'Memasak makanan lezat di dapur',
    svgType: 'cooking',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <path d="M40 34 C32 32, 30 18, 42 17 C45 9, 63 9, 66 17 C78 18, 76 32, 68 34 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="3"/>
      <rect x="40" y="32" width="28" height="9" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5"/>
      <path d="M36 53 Q33 47 36 42" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M74 52 Q77 46 74 41" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="78" y="65" width="32" height="9" rx="4.5" fill="#ef4444" stroke="#b91c1c" stroke-width="2.5"/>
      <ellipse cx="52" cy="70" rx="33" ry="17" fill="#334155" stroke="#1e293b" stroke-width="3"/>
      <ellipse cx="52" cy="68" rx="27" ry="12" fill="#475569"/>
      <path d="M35 67 C34 61, 46 58, 55 60 C66 61, 70 67, 65 73 C59 77, 41 76, 35 67 Z" fill="#ffffff"/>
      <circle cx="52" cy="67" r="7.5" fill="#facc15" stroke="#f59e0b" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'fishing',
    word: 'FISHING',
    meaning: 'Memancing',
    hint: 'Memancing ikan di danau atau sungai',
    svgType: 'fishing',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <path d="M8 74 Q22 65 36 74 T64 74 T92 74 T114 74 L114 94 L8 94 Z" fill="#38bdf8"/>
      <path d="M12 84 Q28 77 44 84 T76 84 T108 84" fill="none" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/>
      <path d="M16 74 Q42 20 84 16" fill="none" stroke="#92400e" stroke-width="5" stroke-linecap="round"/>
      <line x1="84" y1="16" x2="84" y2="52" stroke="#64748b" stroke-width="2.5" stroke-dasharray="4 2"/>
      <path d="M84 52 C84 60, 76 60, 76 55" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
      <path d="M40 62 C48 48, 70 48, 76 62 C70 76, 48 76, 40 62 Z" fill="#fb923c" stroke="#ea580c" stroke-width="2.5"/>
      <polygon points="40,62 27,52 27,72" fill="#f97316" stroke="#ea580c" stroke-width="2"/>
      <circle cx="65" cy="59" r="3" fill="#1e293b"/>
      <path d="M64 66 Q69 68 72 64" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'drawing',
    word: 'DRAWING',
    meaning: 'Menggambar',
    hint: 'Menggambar sketsa dengan pensil warna',
    svgType: 'drawing',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <rect x="18" y="16" width="74" height="72" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="3.5"/>
      <g fill="#64748b"><rect x="28" y="11" width="6" height="11" rx="3"/><rect x="44" y="11" width="6" height="11" rx="3"/><rect x="60" y="11" width="6" height="11" rx="3"/><rect x="76" y="11" width="6" height="11" rx="3"/></g>
      <polygon points="52,32 58,45 72,47 62,56 64,70 52,63 40,70 42,56 32,47 46,45" fill="#fef08a" stroke="#eab308" stroke-width="3" stroke-linejoin="round"/>
      <g transform="translate(84, 52) rotate(35)">
        <rect x="-8" y="-32" width="16" height="44" rx="2" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/>
        <rect x="-8" y="-39" width="16" height="9" rx="3" fill="#f472b6" stroke="#db2777" stroke-width="2"/>
        <polygon points="-8,12 8,12 0,26" fill="#fed7aa" stroke="#ca8a04" stroke-width="2"/>
        <polygon points="-3,21 3,21 0,26" fill="#1e293b"/>
      </g>
    </svg>`
  },
  {
    id: 'swimming',
    word: 'SWIMMING',
    meaning: 'Berenang',
    hint: 'Berenang di kolam renang yang sejuk',
    svgType: 'swimming',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <rect x="10" y="50" width="100" height="42" rx="14" fill="#38bdf8"/>
      <circle cx="58" cy="44" r="18" fill="#fed7aa" stroke="#f97316" stroke-width="2"/>
      <path d="M40 42 C40 24, 76 24, 76 42 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
      <rect x="44" y="38" width="12" height="9" rx="4" fill="#bae6fd" stroke="#0284c7" stroke-width="2.5"/>
      <rect x="60" y="38" width="12" height="9" rx="4" fill="#bae6fd" stroke="#0284c7" stroke-width="2.5"/>
      <line x1="56" y1="42" x2="60" y2="42" stroke="#0284c7" stroke-width="2.5"/>
      <path d="M22 52 Q32 32 45 48" fill="none" stroke="#fed7aa" stroke-width="9" stroke-linecap="round"/>
      <path d="M74 52 Q88 38 98 54" fill="none" stroke="#fed7aa" stroke-width="9" stroke-linecap="round"/>
      <path d="M10 66 Q25 56 40 66 T70 66 T100 66 L110 66 L110 92 L10 92 Z" fill="#0ea5e9"/>
      <path d="M18 78 Q34 70 50 78 T82 78 T104 78" fill="none" stroke="#e0f2fe" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'cycling',
    word: 'CYCLING',
    meaning: 'Bersepeda',
    hint: 'Mengayuh sepeda roda dua',
    svgType: 'cycling',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <circle cx="30" cy="68" r="20" fill="none" stroke="#334155" stroke-width="6"/>
      <circle cx="30" cy="68" r="14" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="30" cy="68" r="4" fill="#475569"/>
      <circle cx="90" cy="68" r="20" fill="none" stroke="#334155" stroke-width="6"/>
      <circle cx="90" cy="68" r="14" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="90" cy="68" r="4" fill="#475569"/>
      <path d="M30 68 L54 42 L80 42 L60 68 Z" fill="none" stroke="#ef4444" stroke-width="5" stroke-linejoin="round"/>
      <line x1="90" y1="68" x2="77" y2="28" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>
      <path d="M72 28 L88 28 Q94 28 94 34" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
      <line x1="54" y1="42" x2="49" y2="31" stroke="#64748b" stroke-width="4.5" stroke-linecap="round"/>
      <rect x="39" y="27" width="18" height="6" rx="3" fill="#0f172a"/>
      <circle cx="60" cy="68" r="6" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/>
    </svg>`
  },
  {
    id: 'painting',
    word: 'PAINTING',
    meaning: 'Melukis',
    hint: 'Mewarnai kanvas dengan kuas dan cat',
    svgType: 'painting',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <path d="M58 18 C28 18, 14 40, 18 62 C22 82, 48 88, 66 84 C77 82, 80 71, 74 66 C68 61, 75 53, 86 54 C100 56, 106 42, 98 30 C90 19, 74 18, 58 18 Z" fill="#fde68a" stroke="#d97706" stroke-width="3.5"/>
      <circle cx="36" cy="64" r="7" fill="#ffffff" stroke="#d97706" stroke-width="2.5"/>
      <circle cx="34" cy="40" r="7.5" fill="#ef4444"/><circle cx="52" cy="29" r="7.5" fill="#f59e0b"/><circle cx="72" cy="31" r="7.5" fill="#22c55e"/><circle cx="86" cy="42" r="7.5" fill="#3b82f6"/><circle cx="56" cy="72" r="7" fill="#a855f7"/>
      <g transform="translate(88, 70) rotate(-38)">
        <rect x="-4" y="-28" width="8" height="44" rx="4" fill="#92400e"/>
        <rect x="-5" y="14" width="10" height="8" fill="#cbd5e1"/>
        <path d="M-5 22 Q0 36 5 22 Z" fill="#ec4899"/>
      </g>
    </svg>`
  },
  {
    id: 'camping',
    word: 'CAMPING',
    meaning: 'Berkemah',
    hint: 'Mendirikan tenda dan menyalakan api unggun',
    svgType: 'camping',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <ellipse cx="60" cy="86" rx="50" ry="8" fill="#86efac"/>
      <rect x="21" y="68" width="8" height="16" fill="#78350f"/>
      <polygon points="25,22 10,50 40,50" fill="#16a34a"/>
      <polygon points="25,38 8,70 42,70" fill="#15803d"/>
      <polygon points="62,24 28,84 96,84" fill="#f97316" stroke="#c2410c" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="62,48 48,84 76,84" fill="#1e293b"/>
      <polygon points="62,24 54,48 70,48" fill="#fdba74"/>
      <line x1="92" y1="84" x2="110" y2="78" stroke="#78350f" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="92" y1="78" x2="110" y2="84" stroke="#78350f" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M101 58 C109 66, 108 78, 101 80 C94 78, 93 66, 101 58 Z" fill="#ef4444"/>
      <path d="M101 66 C105 70, 105 77, 101 79 C97 77, 97 70, 101 66 Z" fill="#facc15"/>
    </svg>`
  },
  {
    id: 'running',
    word: 'RUNNING',
    meaning: 'Berlari',
    hint: 'Berlari kencang menggunakan sepatu olahraga',
    svgType: 'running',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <line x1="8" y1="36" x2="28" y2="36" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="4" y1="50" x2="22" y2="50" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="10" y1="64" x2="26" y2="64" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M30 46 L46 32 L58 46 C68 48, 86 50, 98 58 C108 64, 108 76, 98 78 L34 78 C28 78, 26 56, 30 46 Z" fill="#ef4444" stroke="#991b1b" stroke-width="3" stroke-linejoin="round"/>
      <rect x="28" y="72" width="76" height="10" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5"/>
      <path d="M40 60 L66 60 L74 72 L40 72 Z" fill="#3b82f6"/>
      <line x1="56" y1="43" x2="64" y2="38" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="63" y1="47" x2="71" y2="42" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="70" y1="51" x2="78" y2="47" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'gardening',
    word: 'GARDENING',
    meaning: 'Berkebun',
    hint: 'Menanam bunga dan menyiram tanaman',
    svgType: 'gardening',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <polygon points="68,62 98,62 92,88 74,88" fill="#ea580c" stroke="#9a3412" stroke-width="2.5"/>
      <rect x="65" y="56" width="36" height="8" rx="3" fill="#f97316" stroke="#9a3412" stroke-width="2.5"/>
      <line x1="83" y1="56" x2="83" y2="34" stroke="#16a34a" stroke-width="4.5"/>
      <ellipse cx="75" cy="48" rx="7" ry="4" transform="rotate(-25 75 48)" fill="#22c55e"/>
      <ellipse cx="91" cy="48" rx="7" ry="4" transform="rotate(25 91 48)" fill="#22c55e"/>
      <circle cx="83" cy="24" r="6" fill="#ec4899"/><circle cx="91" cy="30" r="6" fill="#ec4899"/><circle cx="75" cy="30" r="6" fill="#ec4899"/><circle cx="79" cy="37" r="6" fill="#ec4899"/><circle cx="87" cy="37" r="6" fill="#ec4899"/><circle cx="83" cy="31" r="5.5" fill="#facc15"/>
      <g transform="translate(34, 40) rotate(22)">
        <rect x="-18" y="-12" width="30" height="24" rx="5" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/>
        <path d="M-18 -8 C-30 -8, -30 10, -18 10" fill="none" stroke="#15803d" stroke-width="4"/>
        <path d="M12 -2 L28 -14 L32 -6 L12 6 Z" fill="#4ade80" stroke="#15803d" stroke-width="2"/>
      </g>
      <circle cx="66" cy="44" r="2.8" fill="#38bdf8"/><circle cx="62" cy="51" r="2.8" fill="#38bdf8"/><circle cx="70" cy="50" r="2.8" fill="#38bdf8"/>
    </svg>`
  },
  {
    id: 'writing',
    word: 'WRITING',
    meaning: 'Menulis',
    hint: 'Menulis catatan cerita dengan pena',
    svgType: 'writing',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <rect x="20" y="14" width="68" height="76" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="3.5"/>
      <line x1="34" y1="16" x2="34" y2="88" stroke="#fca5a5" stroke-width="2"/>
      <g stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"><line x1="40" y1="30" x2="76" y2="30"/><line x1="40" y1="43" x2="76" y2="43"/><line x1="40" y1="56" x2="70" y2="56"/><line x1="40" y1="69" x2="62" y2="69"/></g>
      <path d="M40 28 Q45 23 50 28 T60 28 T70 28" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M40 41 Q46 36 52 41 T64 41" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
      <g transform="translate(86, 56) rotate(32)">
        <rect x="-6" y="-34" width="12" height="48" rx="4" fill="#2563eb" stroke="#1d4ed8" stroke-width="2.5"/>
        <polygon points="-6,14 6,14 0,28" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
        <circle cx="0" cy="27" r="2" fill="#1e293b"/>
        <rect x="4" y="-26" width="4" height="16" rx="2" fill="#facc15"/>
      </g>
    </svg>`
  },
  {
    id: 'baking',
    word: 'BAKING',
    meaning: 'Membuat Kue',
    hint: 'Memanggang kue manis dan lezat di oven',
    svgType: 'baking',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <polygon points="30,58 76,58 69,88 37,88" fill="#f59e0b" stroke="#b45309" stroke-width="2.5"/>
      <line x1="42" y1="59" x2="45" y2="87" stroke="#b45309" stroke-width="2"/><line x1="53" y1="59" x2="53" y2="87" stroke="#b45309" stroke-width="2"/><line x1="64" y1="59" x2="61" y2="87" stroke="#b45309" stroke-width="2"/>
      <path d="M26 58 C22 44, 34 36, 40 38 C42 25, 64 25, 66 38 C74 36, 84 44, 80 58 Z" fill="#f472b6" stroke="#db2777" stroke-width="2.5"/>
      <line x1="38" y1="48" x2="43" y2="45" stroke="#facc15" stroke-width="3" stroke-linecap="round"/><line x1="56" y1="44" x2="61" y2="47" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/><line x1="66" y1="51" x2="70" y2="47" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/>
      <circle cx="53" cy="24" r="7" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
      <path d="M53 17 Q58 10 64 12" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>
      <g transform="translate(95, 58) rotate(12)"><rect x="-4" y="8" width="8" height="24" rx="4" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/><ellipse cx="0" cy="-10" rx="10" ry="18" fill="none" stroke="#64748b" stroke-width="2.5"/><ellipse cx="0" cy="-10" rx="5" ry="18" fill="none" stroke="#64748b" stroke-width="2.5"/></g>
    </svg>`
  },
  {
    id: 'playing',
    word: 'PLAYING',
    meaning: 'Bermain',
    hint: 'Bermain bola dan aneka permainan seru',
    svgType: 'playing',
    svg: `<svg viewBox="0 0 120 100" class="w-full h-full">
      <circle cx="44" cy="58" r="28" fill="#ffffff" stroke="#1e293b" stroke-width="3.5"/>
      <polygon points="44,44 55,52 51,65 37,65 33,52" fill="#1e293b"/>
      <line x1="44" y1="44" x2="44" y2="30" stroke="#1e293b" stroke-width="2.5"/><line x1="55" y1="52" x2="69" y2="48" stroke="#1e293b" stroke-width="2.5"/><line x1="33" y1="52" x2="19" y2="48" stroke="#1e293b" stroke-width="2.5"/><line x1="51" y1="65" x2="59" y2="81" stroke="#1e293b" stroke-width="2.5"/><line x1="37" y1="65" x2="29" y2="81" stroke="#1e293b" stroke-width="2.5"/>
      <rect x="76" y="60" width="28" height="26" rx="5" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/>
      <text x="90" y="79" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="16" fill="#92400e">A</text>
      <rect x="82" y="34" width="26" height="26" rx="5" fill="#4ade80" stroke="#16a34a" stroke-width="2.5"/>
      <text x="95" y="53" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="16" fill="#14532d">B</text>
      <polygon points="72,18 75,24 81,25 76,29 77,35 72,32 67,35 68,29 63,25 69,24" fill="#f472b6"/>
    </svg>`
  }
];

// Peta fallback SVG bawaan jika guru memasukkan tipe gambar tertentu
const SVG_TEMPLATES = {
  default: `<svg viewBox="0 0 120 100" class="w-full h-full">
    <circle cx="60" cy="50" r="38" fill="#fef08a" stroke="#eab308" stroke-width="4"/>
    <polygon points="60,20 68,38 88,40 73,53 77,72 60,62 43,72 47,53 32,40 52,38" fill="#f59e0b"/>
  </svg>`
};
DEFAULT_HOBBY_BANK.forEach(item => {
  SVG_TEMPLATES[item.svgType] = item.svg;
});

const HobbyDataManager = {
  STORAGE_PREFIX: 'bunda_shaumi_hobbies_',
  SHEET_URL_KEY: 'bunda_shaumi_sheet_url',

  /**
   * Mengambil bank soal aktif untuk game tertentu (atau global 'all')
   */
  getHobbies(gameKey = 'all') {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + gameKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed.map(item => ({
            ...item,
            svg: SVG_TEMPLATES[item.svgType] || item.svg || SVG_TEMPLATES.default
          }));
        }
      }
    } catch (e) {
      console.warn('Gagal membaca localStorage:', e);
    }
    // Fallback ke default 15 hobi
    return DEFAULT_HOBBY_BANK.map(item => ({ ...item }));
  },

  /**
   * Menyimpan perubahan bank soal ke localStorage
   */
  saveHobbies(gameKey, hobbiesList) {
    try {
      const sanitized = hobbiesList.map(item => ({
        id: String(item.id || item.word).toLowerCase().replace(/[^a-z0-9]/g, ''),
        word: String(item.word).trim().toUpperCase(),
        meaning: String(item.meaning || '').trim(),
        hint: String(item.hint || '').trim(),
        svgType: item.svgType || 'default'
      }));
      localStorage.setItem(this.STORAGE_PREFIX + gameKey, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('hobby-data-updated', { detail: { gameKey, hobbies: sanitized } }));
      return true;
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e);
      return false;
    }
  },

  /**
   * Mereset bank soal ke kondisi bawaan
   */
  resetHobbies(gameKey = 'all') {
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + gameKey);
      window.dispatchEvent(new CustomEvent('hobby-data-updated', { detail: { gameKey, hobbies: DEFAULT_HOBBY_BANK } }));
      return DEFAULT_HOBBY_BANK.map(item => ({ ...item }));
    } catch (e) {
      console.error('Gagal reset localStorage:', e);
      return DEFAULT_HOBBY_BANK;
    }
  },

  /**
   * Membuat string CSV dari daftar hobi
   */
  generateCSV(hobbiesList = null) {
    const list = hobbiesList || this.getHobbies('all');
    let csv = 'ID,WORD,MEANING,HINT,IMAGE_TYPE\n';
    list.forEach(item => {
      const cleanMeaning = (item.meaning || '').replace(/"/g, '""');
      const cleanHint = (item.hint || '').replace(/"/g, '""');
      csv += `"${item.id}","${item.word}","${cleanMeaning}","${cleanHint}","${item.svgType || item.id}"\n`;
    });
    return csv;
  },

  /**
   * Mengunduh file template CSV ke komputer/HP pengguna
   */
  downloadCSVTemplate(filename = 'template_soal_hobbies.csv') {
    const csvContent = this.generateCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Membaca dan memvalidasi teks CSV menjadi array objek hobi
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('File CSV kosong atau tidak memiliki baris data.');

    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parsing CSV sederhana ramah koma di dalam tanda kutip
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values = [];
      let match;
      while ((match = regex.exec(line)) !== null && values.length < 5) {
        let val = match[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        values.push(val.trim());
        if (regex.lastIndex >= line.length) break;
      }

      if (values.length >= 2) {
        const rawId = values[0] || values[1];
        const word = (values[1] || '').toUpperCase().trim();
        const meaning = values[2] || '';
        const hint = values[3] || '';
        const svgType = (values[4] || rawId).toLowerCase().trim();

        if (word.length >= 2) {
          result.push({
            id: rawId.toLowerCase().replace(/[^a-z0-9]/g, '') || word.toLowerCase(),
            word,
            meaning,
            hint,
            svgType: SVG_TEMPLATES[svgType] ? svgType : 'default',
            svg: SVG_TEMPLATES[svgType] || SVG_TEMPLATES.default
          });
        }
      }
    }

    if (result.length < 4) {
      throw new Error(`Data soal valid yang ditemukan hanya ${result.length}. Minimal butuh 4 soal agar permainan berjalan lancar!`);
    }
    return result;
  },

  /**
   * Menarik data CSV dari link Google Spreadsheet publik
   * Mendukung link /edit, /pubhtml, /export?format=csv, atau /gviz/tq
   */
  async fetchGoogleSheet(sheetUrl) {
    let cleanUrl = sheetUrl.trim();
    if (!cleanUrl) throw new Error('Tautan Google Spreadsheet belum dimasukkan.');

    // Konversi berbagai format URL Google Sheets ke export CSV
    const matchId = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!matchId || !matchId[1]) {
      throw new Error('Format link Google Spreadsheet tidak valid. Pastikan link memiliki format: https://docs.google.com/spreadsheets/d/ID_SPREADSHEET/...');
    }

    const sheetId = matchId[1];
    // Prioritaskan endpoint CSV publik Google Sheets
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    try {
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data dari Google Sheets (Status HTTP: ${response.status}). Pastikan spreadsheet disetel 'Siapa saja yang memiliki link dapat melihat' (Public/Anyone with the link).`);
      }
      const csvText = await response.text();
      const parsedData = this.parseCSV(csvText);

      // Simpan URL untuk sinkronisasi berikutnya
      localStorage.setItem(this.SHEET_URL_KEY, cleanUrl);
      return parsedData;
    } catch (err) {
      console.error('Fetch Google Sheet Error:', err);
      throw err;
    }
  },

  getSavedSheetUrl() {
    return localStorage.getItem(this.SHEET_URL_KEY) || '';
  }
};

window.HobbyDataManager = HobbyDataManager;
window.DEFAULT_HOBBY_BANK = DEFAULT_HOBBY_BANK;
