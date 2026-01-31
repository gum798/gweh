-- daily_readings 테이블에 운세/개인괘 캐시 컬럼 추가
ALTER TABLE daily_readings ADD COLUMN IF NOT EXISTS fortune_data JSONB;
ALTER TABLE daily_readings ADD COLUMN IF NOT EXISTS personal_omen_data JSONB;
