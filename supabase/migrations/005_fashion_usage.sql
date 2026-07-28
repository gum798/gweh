-- fashion_usage: 구독자의 패션 컨설팅 1일 1회 제한 추적
--
-- functions/api/fashion-usage.ts 가 이 테이블을 읽고 쓰지만 마이그레이션 정의가
-- 누락되어 있었다. 즉 DB 스키마의 진실이 저장소에 없었다. 2026-07 프로젝트
-- 정지·복구 사건에서 이것이 실제 위험으로 드러나 뒤늦게 추가한다.
--
-- UNIQUE(user_id, used_date) 는 장식이 아니다. fashion-usage.ts 의 POST 는
-- `Prefer: resolution=ignore-duplicates` 를 보내는데, 이 헤더는 유니크 제약이
-- 있어야 동작한다. 제약이 없으면 중복 행이 조용히 쌓이고 제한이 무력해진다.
--
-- 이 파일은 아래 세 상태에서 모두 안전하게 재실행할 수 있도록 작성했다:
--   (1) 테이블 없음
--   (2) 테이블 있음 + 유니크 제약 있음
--   (3) 테이블 있음 + 유니크 제약 없음
-- 정지·복구를 겪은 프로젝트에서 (3)은 가정이 아니라 실제로 가능한 상태다.

CREATE TABLE IF NOT EXISTS fashion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, used_date)
);

-- 왜 이 블록이 필요한가:
-- 위의 CREATE TABLE IF NOT EXISTS 는 테이블이 이미 있으면 아무 일도 하지 않고
-- 조용히 넘어간다. 인라인 UNIQUE(user_id, used_date) 까지 통째로 무시된다는 뜻이다.
-- 따라서 과거에 제약 없이 만들어진 테이블이 남아 있으면, 이 마이그레이션을 돌려도
-- 정작 막으려던 실패(중복 행 누적 → 1일 1회 제한 무력화)가 그대로 남는다.
-- "테이블이 존재하는가"만 확인해서는 이 상태를 잡아낼 수 없다.
-- 아래 블록은 pg_constraint 를 직접 보고 (3)의 경우를 실제로 복구한다.
-- 제약 이름은 인라인 UNIQUE 가 자동 생성했을 이름과 같게 맞춰, 신규 DB와 복구된
-- DB의 스키마가 결국 동일해지도록 한다.
--
-- 주의: 이미 중복 행이 쌓여 있다면 아래 ALTER 는 실패한다. 그것이 의도한 동작이다.
-- 마이그레이션이 행을 조용히 지우는 것은 시끄럽게 실패하는 것보다 나쁘다. 여기서
-- 실패했다면 그동안 제한이 동작하지 않아 중복이 누적됐다는 증거이므로, 중복을 사람이
-- 눈으로 검토해 손으로 정리한 뒤 다시 실행해야 한다.
DO $$
DECLARE
  target_cols smallint[];
BEGIN
  SELECT array_agg(attnum ORDER BY attnum)
    INTO target_cols
    FROM pg_attribute
   WHERE attrelid = 'fashion_usage'::regclass
     AND attname IN ('user_id', 'used_date');

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'fashion_usage'::regclass
       AND contype = 'u'
       AND (SELECT array_agg(k ORDER BY k) FROM unnest(conkey) AS k) = target_cols
  ) THEN
    ALTER TABLE fashion_usage
      ADD CONSTRAINT fashion_usage_user_id_used_date_key UNIQUE (user_id, used_date);
  END IF;
END $$;

ALTER TABLE fashion_usage ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 기록만 조회 가능.
-- INSERT 정책은 두지 않는다 — 쓰기는 service_role 키를 쓰는 Pages Function 만
-- 수행하며, service_role 은 RLS 를 우회한다. 클라이언트가 직접 쓸 수 있으면
-- 사용량 제한을 스스로 조작할 수 있게 된다.
--
-- CREATE POLICY 에는 IF NOT EXISTS 가 없어 그냥 두면 재실행 시 42710 으로 죽는다.
-- 먼저 DROP 해서 002~004 의 IF NOT EXISTS 가드와 같은 결을 유지한다. 덤으로,
-- 정책이 다른 내용으로 이미 존재하더라도 아래 정의로 수렴시킨다.
DROP POLICY IF EXISTS "Users can read own fashion usage" ON fashion_usage;
CREATE POLICY "Users can read own fashion usage"
  ON fashion_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fashion_usage_user_date
  ON fashion_usage(user_id, used_date);
