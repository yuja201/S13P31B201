ALTER TABLE domains
ADD COLUMN locales TEXT NOT NULL DEFAULT '["en"]';

UPDATE domains SET locales = '["en","ko"]' WHERE id IN (
  1, -- 이름
  2, -- 성
  3, -- 전체 이름
  6, -- 도시
  8, -- 우편번호
  9, -- 이메일
  10, -- 전화번호
  12, -- 도메인
  13, -- 회사명
  29, -- 과거 날짜
  30, -- 미래 날짜
  31, -- 최근 날짜
  35, -- 버전
  37, -- 정수
  38, -- 실수
  39, -- 불리언
  40, -- 랜덤 문자열
  41, -- 문장
  42, -- 문단
  43, -- 단어
  49, -- 색상명 (color.human)
  50  -- RGB 값
);
