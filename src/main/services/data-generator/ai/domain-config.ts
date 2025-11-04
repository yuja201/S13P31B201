export interface DomainGuideline {
  id: string
  title: string
  description: string
  category: string
  examples: string[]
  constraints?: string[]
  format?: string
}

export const DOMAIN_GUIDELINES: Record<string, DomainGuideline> = {
  '1': {
    id: '1',
    title: '이름',
    description: '이름(First Name)',
    category: '이름/사람',
    examples: ['지훈', '서연', '민준', '하은', '예준'],
    constraints: ['한국 이름 형식', '2-3글자']
  },
  '2': {
    id: '2',
    title: '성',
    description: '성(Last Name)',
    category: '이름/사람',
    examples: ['김', '이', '박', '최', '정'],
    constraints: ['한국 성씨', '1글자']
  },
  '3': {
    id: '3',
    title: '전체 이름',
    description: '이름과 성을 합친 전체 이름',
    category: '이름/사람',
    examples: ['김지훈', '이서연', '박민준', '최하은', '정예준'],
    constraints: ['성+이름 형식', '3-4글자']
  },
  '4': {
    id: '4',
    title: '직업명',
    description: '직업 또는 직책',
    category: '이름/사람',
    examples: ['개발자', '디자이너', '마케터', '기획자', '데이터 분석가']
  },
  '5': {
    id: '5',
    title: '도로명 주소',
    description: '상세 도로명 주소',
    category: '주소/지역',
    examples: ['서울특별시 강남구 테헤란로 123', '부산광역시 해운대구 마린시티1로 45'],
    format: '시/도 구 도로명 번지'
  },
  '6': {
    id: '6',
    title: '도시',
    description: '도시 이름',
    category: '주소/지역',
    examples: ['서울', '부산', '대구', '인천', '광주', '대전', '울산']
  },
  '7': {
    id: '7',
    title: '국가',
    description: '국가 이름',
    category: '주소/지역',
    examples: ['대한민국', '미국', '일본', '중국', '독일', '프랑스']
  },
  '8': {
    id: '8',
    title: '우편번호',
    description: '우편번호',
    category: '주소/지역',
    examples: ['06234', '48058', '34567', '12345'],
    format: '5자리 숫자',
    constraints: ['00000-99999 범위']
  },
  '9': {
    id: '9',
    title: '이메일',
    description: '이메일 주소',
    category: '연락처/계정',
    examples: ['user@example.com', 'admin@company.co.kr', 'contact@domain.net'],
    format: 'username@domain.extension',
    constraints: ['유효한 이메일 형식']
  },
  '10': {
    id: '10',
    title: '전화번호',
    description: '전화번호',
    category: '연락처/계정',
    examples: ['010-1234-5678', '010-9876-5432', '02-1234-5678'],
    format: '010-XXXX-XXXX 또는 0X-XXXX-XXXX',
    constraints: ['한국 전화번호 형식']
  },
  '11': {
    id: '11',
    title: '사용자명',
    description: '계정 아이디 또는 닉네임',
    category: '연락처/계정',
    examples: ['user123', 'admin_dev', 'john_doe', 'test_account'],
    constraints: ['영문/숫자/언더스코어', '4-20자']
  },
  '12': {
    id: '12',
    title: '도메인',
    description: '도메인 이름',
    category: '연락처/계정',
    examples: ['example.com', 'mycompany.co.kr', 'service.net', 'app.io'],
    format: 'domain.extension'
  },
  '13': {
    id: '13',
    title: '회사명',
    description: '회사 이름',
    category: '회사/조직',
    examples: ['테크코리아', '글로벌소프트', '혁신기술', '스마트솔루션']
  },
  '14': {
    id: '14',
    title: '슬로건',
    description: '회사 슬로건 또는 문구',
    category: '회사/조직',
    examples: ['혁신을 선도하는 기업', '고객과 함께 성장하는 회사', '미래를 만드는 기술']
  },
  '15': {
    id: '15',
    title: '부서',
    description: '부서 이름',
    category: '회사/조직',
    examples: ['개발팀', '마케팅부', '인사팀', '영업부', '기획실']
  },
  '16': {
    id: '16',
    title: '직종',
    description: '직무 분야',
    category: '회사/조직',
    examples: ['소프트웨어 개발', '디지털 마케팅', '데이터 분석', 'UI/UX 디자인']
  },
  '17': {
    id: '17',
    title: '계좌번호',
    description: '은행 계좌번호',
    category: '금융/결제',
    examples: ['110-123-456789', '356-789123-45678'],
    format: 'XXX-XXXXXX-XXXXX',
    constraints: ['숫자와 하이픈']
  },
  '18': {
    id: '18',
    title: '금액',
    description: '거래 금액',
    category: '금융/결제',
    examples: ['15000', '250000', '1000000', '50000'],
    constraints: ['양의 정수']
  },
  '19': {
    id: '19',
    title: '카드번호',
    description: '신용/체크카드 번호',
    category: '금융/결제',
    examples: ['1234-5678-9012-3456', '9876-5432-1098-7654'],
    format: 'XXXX-XXXX-XXXX-XXXX',
    constraints: ['16자리 숫자']
  },
  '20': {
    id: '20',
    title: '거래유형',
    description: '입금, 출금 등 거래 종류',
    category: '금융/결제',
    examples: ['입금', '출금', '이체', '카드결제', '환불']
  },
  '21': {
    id: '21',
    title: '상품명',
    description: '제품 이름',
    category: '상품/상거래',
    examples: ['무선 이어폰', '스마트 워치', '노트북 거치대', 'USB 충전기']
  },
  '22': {
    id: '22',
    title: '카테고리',
    description: '제품 분류',
    category: '상품/상거래',
    examples: ['전자제품', '의류', '식품', '생활용품', '도서']
  },
  '23': {
    id: '23',
    title: '가격',
    description: '제품 가격',
    category: '상품/상거래',
    examples: ['29900', '159000', '5000', '450000'],
    constraints: ['양의 정수', '원 단위']
  },
  '24': {
    id: '24',
    title: '설명',
    description: '제품 설명 또는 소개문',
    category: '상품/상거래',
    examples: [
      '고품질 무선 이어폰으로 깨끗한 음질을 제공합니다',
      '일상에서 활용하기 좋은 실용적인 제품'
    ]
  },
  '25': {
    id: '25',
    title: '제조사',
    description: '차량 브랜드명',
    category: '차량/이동수단',
    examples: ['현대', '기아', '제네시스', '쌍용', '르노삼성']
  },
  '26': {
    id: '26',
    title: '모델명',
    description: '모델 이름',
    category: '차량/이동수단',
    examples: ['그랜저', '쏘나타', 'K5', '아반떼', '투싼']
  },
  '27': {
    id: '27',
    title: '차량번호',
    description: '차량 번호판',
    category: '차량/이동수단',
    examples: ['12가3456', '서울34나5678', '경기89다0123'],
    format: '지역XX타입XXXX'
  },
  '28': {
    id: '28',
    title: '차량 타입',
    description: '차량 종류 (SUV, 트럭 등)',
    category: '차량/이동수단',
    examples: ['세단', 'SUV', '트럭', '승합차', '스포츠카']
  },
  '29': {
    id: '29',
    title: '과거 날짜',
    description: '무작위 과거 일시',
    category: '날짜/시간',
    examples: ['2023-05-15', '2022-11-23', '2021-08-07'],
    format: 'YYYY-MM-DD'
  },
  '30': {
    id: '30',
    title: '미래 날짜',
    description: '무작위 미래 일시',
    category: '날짜/시간',
    examples: ['2025-12-31', '2026-06-15', '2027-03-20'],
    format: 'YYYY-MM-DD'
  },
  '31': {
    id: '31',
    title: '최근 날짜',
    description: '최근 시점의 일시',
    category: '날짜/시간',
    examples: ['2024-10-15', '2024-11-01', '2024-09-30'],
    format: 'YYYY-MM-DD'
  },
  '32': {
    id: '32',
    title: '타임스탬프',
    description: 'UNIX timestamp',
    category: '날짜/시간',
    examples: ['1698768000', '1699372800', '1700582400'],
    format: '10자리 숫자'
  },
  '33': {
    id: '33',
    title: 'UUID',
    description: '고유 식별자(UUID)',
    category: '시스템/기술',
    examples: ['550e8400-e29b-41d4-a716-446655440000', 'c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd'],
    format: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
  },
  '34': {
    id: '34',
    title: '파일명',
    description: '파일 이름',
    category: '시스템/기술',
    examples: ['document.pdf', 'image.jpg', 'data.csv', 'report.xlsx']
  },
  '35': {
    id: '35',
    title: '버전',
    description: '소프트웨어 버전 문자열',
    category: '시스템/기술',
    examples: ['1.0.0', '2.3.1', '0.9.5', '3.12.4'],
    format: 'X.Y.Z (semantic versioning)'
  },
  '36': {
    id: '36',
    title: '커밋 메시지',
    description: 'Git 커밋 메시지',
    category: '시스템/기술',
    examples: ['feat: 새로운 기능 추가', 'fix: 버그 수정', 'docs: 문서 업데이트']
  },
  '37': {
    id: '37',
    title: '정수',
    description: '랜덤 정수 값',
    category: '데이터/숫자',
    examples: ['42', '1000', '-15', '9999'],
    constraints: ['정수형 숫자']
  },
  '38': {
    id: '38',
    title: '실수',
    description: '랜덤 실수 값',
    category: '데이터/숫자',
    examples: ['3.14', '99.99', '0.5', '123.456'],
    constraints: ['소수점 포함']
  },
  '39': {
    id: '39',
    title: '불리언',
    description: 'true 또는 false 값',
    category: '데이터/숫자',
    examples: ['true', 'false'],
    constraints: ['true 또는 false만 가능']
  },
  '40': {
    id: '40',
    title: '랜덤 문자열',
    description: '무작위 문자열 데이터',
    category: '데이터/숫자',
    examples: ['a8f3k2', 'xyz789', 'qwe123rty', 'abc456def']
  },
  '41': {
    id: '41',
    title: '문장',
    description: '짧은 문장',
    category: '텍스트/콘텐츠',
    examples: ['오늘은 날씨가 좋습니다.', '회의가 오후 3시에 시작됩니다.']
  },
  '42': {
    id: '42',
    title: '문단',
    description: '랜덤 긴 문단',
    category: '텍스트/콘텐츠',
    examples: ['여러 문장으로 구성된 긴 텍스트입니다. 다양한 내용을 포함할 수 있습니다.']
  },
  '43': {
    id: '43',
    title: '단어',
    description: '단어 하나',
    category: '텍스트/콘텐츠',
    examples: ['사과', '컴퓨터', '행복', '여행', '음악']
  },
  '44': {
    id: '44',
    title: '키워드',
    description: '주제나 태그용 단어',
    category: '텍스트/콘텐츠',
    examples: ['기술', '비즈니스', '라이프스타일', '교육', '엔터테인먼트']
  },
  '45': {
    id: '45',
    title: '화학 원소',
    description: '화학 원소 이름',
    category: '과학/교육',
    examples: ['수소', '산소', '탄소', '질소', '철']
  },
  '46': {
    id: '46',
    title: '단위',
    description: '물리 단위',
    category: '과학/교육',
    examples: ['kg', 'm', 's', 'A', 'K', 'mol']
  },
  '47': {
    id: '47',
    title: '과목명',
    description: '학교 과목 이름',
    category: '과학/교육',
    examples: ['수학', '영어', '과학', '사회', '국어']
  },
  '48': {
    id: '48',
    title: '학교명',
    description: '학교 또는 기관 이름',
    category: '과학/교육',
    examples: ['서울대학교', '한국과학기술원', '고려대학교', '연세대학교']
  },
  '49': {
    id: '49',
    title: '색상명',
    description: '사람이 읽을 수 있는 색상 이름',
    category: '색상/디자인',
    examples: ['빨강', '파랑', '초록', '노랑', '검정']
  },
  '50': {
    id: '50',
    title: 'RGB 값',
    description: 'RGB 형태의 색상값',
    category: '색상/디자인',
    examples: ['rgb(255,0,0)', 'rgb(0,128,255)', 'rgb(100,200,50)'],
    format: 'rgb(R,G,B)'
  },
  '51': {
    id: '51',
    title: 'HEX 코드',
    description: '16진수 색상 코드',
    category: '색상/디자인',
    examples: ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF'],
    format: '#RRGGBB'
  },
  '52': {
    id: '52',
    title: '이미지 URL',
    description: '랜덤 이미지 주소',
    category: '색상/디자인',
    examples: ['https://example.com/image1.jpg', 'https://cdn.example.com/photo.png'],
    format: 'https://...'
  },
  '53': {
    id: '53',
    title: '음악 장르',
    description: '랜덤 음악 장르',
    category: '엔터테인먼트/기타',
    examples: ['팝', '록', '재즈', '클래식', '힙합']
  },
  '54': {
    id: '54',
    title: '노래 이름',
    description: '랜덤 노래 제목',
    category: '엔터테인먼트/기타',
    examples: ['여름밤의 꿈', '봄날', '그대라는 시', '사랑의 멜로디']
  },
  '55': {
    id: '55',
    title: '동물 이름',
    description: '동물 이름',
    category: '엔터테인먼트/기타',
    examples: ['강아지', '고양이', '토끼', '사자', '코끼리']
  }
}

export function getDomainGuideline(domainName?: string): DomainGuideline | null {
  if (!domainName) return null

  // ID로 찾기
  const byId = Object.values(DOMAIN_GUIDELINES).find((g) => g.id === domainName)
  if (byId) return byId

  // 제목으로 찾기 (부분 매칭)
  const byTitle = Object.values(DOMAIN_GUIDELINES).find(
    (g) => g.title.includes(domainName) || domainName.includes(g.title)
  )
  if (byTitle) return byTitle

  return null
}
