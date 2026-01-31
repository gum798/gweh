-- User Profiles: 고객 정보 (키, 몸무게, 사진, 위치)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  height DECIMAL,
  weight DECIMAL,
  photo_url TEXT,
  last_lat DECIMAL,
  last_lon DECIMAL,
  birth_date DATE,
  birth_hour INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Daily Readings: 매일 아침 생성되는 괘 + 스타일 추천
CREATE TABLE IF NOT EXISTS daily_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  omen_message TEXT,
  energy_score INTEGER,
  style_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, reading_date)
);

ALTER TABLE daily_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own readings"
  ON daily_readings FOR SELECT
  USING (auth.uid() = user_id);

-- Service role needs to insert readings (from cron worker)
-- No INSERT RLS policy needed since cron uses service_role key

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_daily_readings_user_date ON daily_readings(user_id, reading_date);
