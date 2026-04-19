-- ============================================
-- DRINKLOG 카탈로그 시드 데이터
-- Supabase SQL Editor에서 붙여넣고 실행
-- ============================================
-- 중복 방지: 같은 이름+카테고리가 이미 있으면 무시
-- 실행 방법:
--   1. Supabase 대시보드 → SQL Editor → New query
--   2. 이 파일 전체 복사-붙여넣기
--   3. Run 버튼 클릭
-- ============================================

insert into drink_catalog
  (name, category, brand, abv, volume_ml, avg_price, origin, barcode, source, verified)
values
  -- ────────── 소주 ──────────
  ('참이슬 후레쉬',    'soju', '하이트진로',  16.5, 360, 2000, '한국', '8801048404050', 'api', true),
  ('참이슬 오리지널',  'soju', '하이트진로',  20.1, 360, 2000, '한국', '8801048404067', 'api', true),
  ('처음처럼',         'soju', '롯데칠성',    16.5, 360, 2000, '한국', '8801387103015', 'api', true),
  ('처음처럼 순하리',  'soju', '롯데칠성',    14.0, 360, 2200, '한국', null,           'api', true),
  ('새로',             'soju', '롯데칠성',    16.0, 360, 2000, '한국', null,           'api', true),
  ('좋은데이',         'soju', '무학',        16.9, 360, 2000, '한국', '8801111000017', 'api', true),
  ('진로이즈백',       'soju', '하이트진로',  16.5, 360, 2200, '한국', null,           'api', true),
  ('화요 25',          'soju', '광주요',      25.0, 375, 18000,'한국', null,           'api', true),
  ('화요 41',          'soju', '광주요',      41.0, 375, 45000,'한국', null,           'api', true),
  ('안동소주',         'soju', '민속주안동소주', 40.0, 400, 25000,'한국', null,         'api', true),

  -- ────────── 맥주 (국내) ──────────
  ('카스 후레쉬',      'beer', '오비맥주',    4.5,  500, 3000, '한국', '8801069001234', 'api', true),
  ('카스 라이트',      'beer', '오비맥주',    4.0,  500, 3000, '한국', null,           'api', true),
  ('테라',             'beer', '하이트진로',  4.6,  500, 3000, '한국', '8801048601011', 'api', true),
  ('켈리',             'beer', '하이트진로',  4.5,  500, 3000, '한국', null,           'api', true),
  ('하이트 엑스트라콜드','beer','하이트진로',  4.3,  500, 3000, '한국', null,           'api', true),
  ('클라우드',         'beer', '롯데칠성',    5.0,  500, 3000, '한국', null,           'api', true),
  ('필굿',             'beer', '하이트진로',  4.5,  500, 2500, '한국', null,           'api', true),

  -- ────────── 맥주 (수입) ──────────
  ('하이네켄',         'beer', 'Heineken',    5.0,  330, 3500, '네덜란드','8710970010015','api', true),
  ('버드와이저',       'beer', 'Budweiser',   5.0,  355, 3500, '미국',  '0018200000010', 'api', true),
  ('코로나 엑스트라',  'beer', 'Corona',      4.5,  330, 4000, '멕시코', '7501064102608', 'api', true),
  ('아사히 수퍼드라이','beer','Asahi',       5.0,  330, 4000, '일본',  '4901004014139', 'api', true),
  ('기린 이치방',      'beer', 'Kirin',       5.0,  330, 4000, '일본',  null,           'api', true),
  ('칭따오',           'beer', 'Tsingtao',    4.7,  330, 3500, '중국',  '6901035551953', 'api', true),
  ('블루문',           'beer', 'Blue Moon',   5.4,  330, 4500, '미국',  null,           'api', true),
  ('기네스',           'beer', 'Guinness',    4.2,  440, 5500, '아일랜드','5000213010006','api', true),
  ('스텔라 아르투아',  'beer', 'Stella Artois', 5.0, 330, 4000, '벨기에','5410228118008','api', true),

  -- ────────── 막걸리 ──────────
  ('지평 생막걸리',    'makgeolli', '지평주조', 5.0,  750,  3500, '한국', null, 'api', true),
  ('서울장수 생막걸리','makgeolli', '서울장수', 6.0,  750,  1500, '한국', null, 'api', true),
  ('장수 생막걸리',    'makgeolli', '서울장수', 6.0,  750,  1500, '한국', null, 'api', true),
  ('느린마을 막걸리',  'makgeolli', '배상면주가',6.0,  750,  4500, '한국', null, 'api', true),
  ('복순도가',         'makgeolli', '복순도가', 6.5,  935, 12000, '한국', null, 'api', true),

  -- ────────── 와인 (대중) ──────────
  ('옐로우테일 쉬라즈','wine', 'Yellow Tail',  13.5, 750, 12000, '호주',   null, 'api', true),
  ('몬테스 알파 까베르네','wine','Montes',     14.5, 750, 35000, '칠레',   null, 'api', true),
  ('1865 까베르네 쇼비뇽','wine','1865',       14.0, 750, 35000, '칠레',   null, 'api', true),
  ('카시예로 델 디아블로 까베르네','wine','Concha y Toro',13.5,750,15000,'칠레',null,'api',true),
  ('19 크라임즈 레드',  'wine','19 Crimes',    14.5, 750, 20000, '호주',   null, 'api', true),
  ('무똥까데 레드',    'wine', 'Mouton Cadet', 13.5, 750, 25000, '프랑스', null, 'api', true),

  -- ────────── 위스키 ──────────
  ('조니워커 블랙',    'whiskey', 'Johnnie Walker', 40.0, 700, 55000, '스코틀랜드', '5000267024004', 'api', true),
  ('조니워커 레드',    'whiskey', 'Johnnie Walker', 40.0, 700, 38000, '스코틀랜드', null,           'api', true),
  ('발렌타인 12년',    'whiskey', 'Ballantine''s',  40.0, 700, 55000, '스코틀랜드', null,           'api', true),
  ('발렌타인 17년',    'whiskey', 'Ballantine''s',  40.0, 700, 150000,'스코틀랜드', null,           'api', true),
  ('맥켈란 12년',      'whiskey', 'Macallan',       40.0, 700, 180000,'스코틀랜드', null,           'api', true),
  ('글렌피딕 12년',    'whiskey', 'Glenfiddich',    40.0, 700, 95000, '스코틀랜드', null,           'api', true),
  ('잭다니엘 No.7',    'whiskey', 'Jack Daniel''s', 40.0, 700, 55000, '미국',      '082184090404', 'api', true),
  ('짐빔',             'whiskey', 'Jim Beam',       40.0, 700, 38000, '미국',      null,           'api', true),
  ('산토리 가쿠빈',    'whiskey', 'Suntory',        40.0, 700, 55000, '일본',      null,           'api', true),

  -- ────────── 양주/리큐어 ──────────
  ('앱솔루트 보드카',  'spirits', 'Absolut',    40.0, 700, 42000, '스웨덴', null, 'api', true),
  ('스미노프 보드카',  'spirits', 'Smirnoff',   40.0, 700, 28000, '영국',   null, 'api', true),
  ('바카디 화이트',    'spirits', 'Bacardi',    37.5, 700, 35000, '푸에르토리코', null, 'api', true),
  ('봄베이 사파이어',  'spirits', 'Bombay Sapphire', 40.0, 700, 55000, '영국', null, 'api', true),
  ('헨드릭스 진',      'spirits', 'Hendrick''s', 44.0, 700, 75000, '스코틀랜드', null, 'api', true),
  ('예거마이스터',     'spirits', 'Jägermeister', 35.0, 700, 45000, '독일', null, 'api', true),
  ('말리부',           'spirits', 'Malibu',     21.0, 700, 28000, '바베이도스', null, 'api', true)

on conflict (name, category) do nothing;

-- ============================================
-- UNIQUE 제약이 아직 없다면 먼저 아래를 실행해두세요:
--   alter table drink_catalog
--     add constraint drink_catalog_name_category_unique
--     unique (name, category);
-- (이미 있으면 에러 나는데, 무시하고 넘어가면 됩니다)
-- ============================================

-- 확인용 쿼리:
--   select category, count(*) from drink_catalog group by category order by category;
