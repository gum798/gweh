-- fashion_usage: 구독자의 패션 컨설팅 1일 1회 제한 추적
--
-- functions/api/fashion-usage.ts 가 이 테이블을 읽고 쓰지만 마이그레이션 정의가
-- 누락되어 있었다. 즉 DB 스키마의 진실이 저장소에 없었다. 2026-07 프로젝트
-- 정지·복구 사건에서 이것이 실제 위험으로 드러나 뒤늦게 추가한다.
--
-- UNIQUE(user_id, used_date) 는 장식이 아니다. fashion-usage.ts 의 POST 는
-- `Prefer: resolution=ignore-duplicates` 를 보내는데, 이 헤더는 유니크 제약이
-- 있어야 동작한다. 제약이 없으면 중복 행이 조용히 쌓이고 제한이 무력해진다.

CREATE TABLE IF NOT EXISTS fashion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, used_date)
);

ALTER TABLE fashion_usage ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 기록만 조회 가능.
-- INSERT 정책은 두지 않는다 — 쓰기는 service_role 키를 쓰는 Pages Function 만
-- 수행하며, service_role 은 RLS 를 우회한다. 클라이언트가 직접 쓸 수 있으면
-- 사용량 제한을 스스로 조작할 수 있게 된다.
CREATE POLICY "Users can read own fashion usage"
  ON fashion_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fashion_usage_user_date
  ON fashion_usage(user_id, used_date);
