import { ArtistMock, User } from './types';

export const MOCK_ARTISTS: ArtistMock[] = [
  {
    name: "일러스트레이터 봄(BOM)",
    serialNumber: "ART-1004",
    description: "따스한 햇살과 식물이 주는 일상의 평화로움을 수채화 톤의 일러스트로 표현하는 작가 봄입니다. 우리의 작은 공간 속 싱그러운 초록빛을 그립니다.",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    instagramUrl: "https://instagram.com/illust_bom_spring",
    webpageUrl: "https://bom-illust.creatorlink.net",
    recentExhibitions: [
      {
        title: "초록빛 머무는 방",
        period: "2026.08.01 - 2026.08.15",
        venue: "갤러리 그리다 (서울 종로구)"
      }
    ]
  },
  {
    name: "작가 도윤(DOYUN)",
    serialNumber: "ART-2408",
    description: "도시의 깊은 밤, 가로등 불빛과 네온사인이 자아내는 쓸쓸하면서도 서정적인 야경을 현대적인 아날로그 텍스처로 풀어냅니다.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    instagramUrl: "https://instagram.com/doyun_night_city",
    webpageUrl: "https://doyun-night.portfolio.com",
    recentExhibitions: [
      {
        title: "Midnight Blue : 밤의 서정",
        period: "2026.09.10 - 2026.09.28",
        venue: "아라아트센터 3층"
      }
    ]
  },
  {
    name: "아티스트 민지(MINJI)",
    serialNumber: "ART-7721",
    description: "동화 같은 색감과 몽환적인 동물 캐릭터를 통해 일상에 지친 어른들에게 따스한 위로와 동심의 세계를 선물합니다.",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    instagramUrl: "https://instagram.com/minji_dreamy",
    webpageUrl: "https://minjidream.myportfolio.com",
    recentExhibitions: [
      {
        title: "어른이들을 위한 꿈의 숲",
        period: "2026.11.05 - 2026.11.20",
        venue: "복합문화공간 일레븐"
      }
    ]
  }
];

const generateMockFans = () => {
  const lastNames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍"];
  const firstNames = ["민수", "지현", "서준", "하은", "도윤", "예린", "시우", "서연", "지우", "민재", "채원", "준우", "수아", "현우", "지민", "우진", "다은", "건우", "소율", "유준"];
  const englishKeywords = ["art", "canvas", "muse", "sketch", "collector", "gallery", "pencil", "palette", "brush", "frame"];
  
  const fans = [
    { nickname: "김민수", id: "minsu92" },
    { nickname: "엘레나", id: "art_lover" },
    { nickname: "지오", id: "gio_lee" },
    { nickname: "아트러버민", id: "art_lover_min" },
    { nickname: "그림조아", id: "pict_like_99" },
    { nickname: "NFC마스터", id: "nfc_collector" },
    { nickname: "컬렉터K", id: "collector_kim" },
    { nickname: "일러스트덕후", id: "dukhu_illust" }
  ];

  // Generate up to 100 unique fans
  for (let i = 1; fans.length < 100; i++) {
    const lastName = lastNames[i % lastNames.length];
    const firstName = firstNames[(i * 3) % firstNames.length];
    const nickname = `${lastName}${firstName}`;
    
    const kw = englishKeywords[i % englishKeywords.length];
    const randNum = 100 + i;
    const id = `${kw}_${randNum}`;
    
    // Ensure no duplicate IDs
    if (!fans.some(f => f.id === id)) {
      fans.push({ nickname, id });
    }
  }
  return fans;
};

export const MOCK_USER_FANS = generateMockFans();

export const INITIAL_USER: User = {
  id: "user_kakaotalk_987",
  nickname: "김다솔",
  profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  email: "dasol.kim@kakao.com",
  role: "user",
  favoriteArtists: ["ART-1004", "ART-7721"],
  fanUsers: []
};

export const INITIAL_ARTIST_USER: User = {
  id: "artist_kakaotalk_123",
  nickname: "하진(HAJIN)",
  profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
  email: "hajin.art@kakao.com",
  role: "artist",
  serialNumber: "ART-9912",
  instagramUrl: "https://instagram.com/hajin_drawings",
  webpageUrl: "https://hajin-art.imweb.me",
  favoriteArtists: [],
  fanUsers: MOCK_USER_FANS
};

export const INITIAL_ADMIN_USER: User = {
  id: "admin_kakaotalk_777",
  nickname: "최고관리자",
  profileImage: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
  email: "admin@nfcartlink.com",
  role: "admin",
  favoriteArtists: [],
  fanUsers: []
};

export const INITIAL_ALL_USERS: User[] = [
  INITIAL_USER,
  INITIAL_ARTIST_USER,
  INITIAL_ADMIN_USER,
  {
    id: "user_kakaotalk_555",
    nickname: "박수진",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    email: "sujin.park@gmail.com",
    role: "user",
    favoriteArtists: ["ART-1004"],
    fanUsers: []
  },
  {
    id: "user_pending_sa",
    nickname: "윤서아(SEOAH)",
    profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    email: "seoah@naver.com",
    role: "artist_pending",
    instagramUrl: "https://instagram.com/seoah_watercolor",
    webpageUrl: "https://seoah-gallery.com",
    favoriteArtists: [],
    fanUsers: [],
    description: "길가에 핀 흔한 야생화들의 수줍은 미소를 맑고 투명한 수채화 물빛으로 기록하는 윤서아입니다.",
    uploadedFiles: [
      { name: "wildflower_1.png", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=400", type: "image" }
    ]
  },
  {
    id: "user_pending_jh",
    nickname: "최재형(JAEHYUNG)",
    profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    email: "jh.art@daum.net",
    role: "artist_pending",
    instagramUrl: "https://instagram.com/jh_art",
    webpageUrl: "https://jh-portfolio.com",
    favoriteArtists: [],
    fanUsers: [],
    description: "빛과 그림자의 강렬한 대비를 이용해 한국적 사계절을 그리는 오일 파스텔 작가 최재형입니다.",
    uploadedFiles: [
      { name: "forest_pastel.png", url: "https://images.unsplash.com/photo-15797839028591-7240c663f457?auto=format&fit=crop&q=80&w=400", type: "image" }
    ]
  }
];

// Helper to fill users up to 100 and artists up to 50
const fillMockData = () => {
  const profileImages = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
  ];

  const lastNames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍"];
  const userFirstNames = ["민준", "서연", "도윤", "서윤", "시우", "지우", "하준", "서현", "지호", "하은", "지민", "민재", "채원", "윤우", "유나", "준우", "수아", "현우", "지아", "건우"];
  const artistFirstNames = ["도예", "소목", "수묵", "나염", "은빛", "해질녘", "해돋이", "푸른솔", "아틀리에", "가을비", "새벽녘", "단풍", "바람", "물결", "모래"];

  // Current counts
  const currentUsers = INITIAL_ALL_USERS.filter(u => u.role === 'user');
  const currentArtists = INITIAL_ALL_USERS.filter(u => u.role === 'artist');

  // Fill users to 10
  let userIndex = 1;
  while (INITIAL_ALL_USERS.filter(u => u.role === 'user').length < 10) {
    const lastName = lastNames[userIndex % lastNames.length];
    const firstName = userFirstNames[userIndex % userFirstNames.length];
    const nickname = `${lastName}${firstName}${userIndex}`;
    const id = `mock_user_gen_${userIndex}`;
    
    // Check if duplicate ID or nickname
    if (!INITIAL_ALL_USERS.some(u => u.id === id || u.nickname === nickname)) {
      INITIAL_ALL_USERS.push({
        id,
        nickname,
        profileImage: profileImages[userIndex % profileImages.length],
        email: `user_${userIndex}@itbit.com`,
        role: "user",
        favoriteArtists: [],
        fanUsers: []
      });
    }
    userIndex++;
  }

  // No auto-generated mock artists (0 extra artists)
  // This keeps the certified artist lists clean as requested by the user
  let artistIndex = 1;
  while (INITIAL_ALL_USERS.filter(u => u.role === 'artist').length < 0) {
    const lastName = lastNames[artistIndex % lastNames.length];
    const firstName = artistFirstNames[artistIndex % artistFirstNames.length];
    const nickname = `${lastName}${firstName}${artistIndex}`;
    const id = `mock_artist_gen_${artistIndex}`;
    const serialNumber = `ART-${3000 + artistIndex}`;
    
    if (!INITIAL_ALL_USERS.some(u => u.id === id || u.nickname === nickname || u.serialNumber === serialNumber)) {
      INITIAL_ALL_USERS.push({
        id,
        nickname,
        profileImage: profileImages[(artistIndex + 3) % profileImages.length],
        email: `artist_${artistIndex}@itbit.com`,
        role: "artist",
        serialNumber,
        instagramUrl: `https://instagram.com/artist_${artistIndex}_sns`,
        webpageUrl: `https://artist_${artistIndex}_portfolio.com`,
        favoriteArtists: [],
        fanUsers: []
      });
    }
    artistIndex++;
  }
};

fillMockData();


