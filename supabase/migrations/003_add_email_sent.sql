-- daily_readings에 이메일 발송 여부 추적 컬럼 추가
ALTER TABLE daily_readings ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
