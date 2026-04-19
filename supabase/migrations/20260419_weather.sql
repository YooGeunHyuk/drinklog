-- 날씨 정보 컬럼 추가
-- weather: 정규화된 날씨 코드 (sunny, cloudy, rainy, snowy, stormy, foggy)
-- temperature: 섭씨 (소수점 1자리)
-- location_name: 도시/구 이름 (좌표 대신 저장하여 프라이버시 보호)

ALTER TABLE drink_log
  ADD COLUMN IF NOT EXISTS weather VARCHAR(20),
  ADD COLUMN IF NOT EXISTS temperature NUMERIC(4, 1),
  ADD COLUMN IF NOT EXISTS location_name TEXT;

-- 날씨별 검색용 인덱스 (통계/분석에서 사용)
CREATE INDEX IF NOT EXISTS idx_drink_log_weather ON drink_log(user_id, weather) WHERE weather IS NOT NULL;

COMMENT ON COLUMN drink_log.weather IS '정규화된 날씨 코드: sunny | cloudy | rainy | snowy | stormy | foggy';
COMMENT ON COLUMN drink_log.temperature IS '기록 시점 기온 (섭씨)';
COMMENT ON COLUMN drink_log.location_name IS '역지오코딩된 도시/구 이름 (예: 서울 강남구)';
