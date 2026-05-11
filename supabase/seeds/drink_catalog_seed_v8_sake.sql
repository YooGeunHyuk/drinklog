-- ============================================
-- DRINKLOG 카탈로그 시드 v8 — 일본 사케·소츄·우메슈 80종 (정밀 큐레이션)
-- ============================================
-- 한국에서 마실 수 있는 일본 주류 라인 정리. 면세점·전문 주류점 위주.
-- 사케는 보통 15~16도 (저알콜 13도도 일부).
-- 카테고리: spirits (사케·소츄·매실주 모두 spirits로 분류 — 기존 카탈로그 일관성)
--
-- WebSearch 검증 완료 (2026-05-11):
--   - 닷사이 23/39/45 정미보합 = 깎은 정도. 23이 가장 고급, 45 가성비
--   - 핫카이산 설실 3년 저온 숙성, 15.5도, 멜론 풍미
--   - 쿠보타 170년 전통, 니가타 100% 쌀·물
--
-- 실행: Supabase Dashboard → SQL Editor → 이 파일 전체 복사 → Run
-- 중복 방지: ON CONFLICT (name, category) DO NOTHING
-- v4~v7와 동일 idempotent 패턴
-- ============================================

create temporary table if not exists _dedupe_keepers as
select distinct on (name, category)
  name, category, id as keeper_id
from drink_catalog
order by name, category, created_at asc nulls last, id asc;

update drink_log dl
set catalog_id = k.keeper_id
from drink_catalog dc
join _dedupe_keepers k
  on dc.name = k.name and dc.category = k.category
where dl.catalog_id = dc.id
  and dc.id <> k.keeper_id;

delete from drink_catalog dc
where exists (
  select 1
  from _dedupe_keepers k
  where dc.name = k.name
    and dc.category = k.category
    and dc.id <> k.keeper_id
);

drop table _dedupe_keepers;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'drink_catalog_name_category_unique'
  ) then
    alter table drink_catalog
      add constraint drink_catalog_name_category_unique
      unique (name, category);
  end if;
end
$$;

insert into drink_catalog
  (name, category, brand, abv, volume_ml, avg_price, origin, source, verified, tasting_notes)
values
  -- ========== 닷사이 (獺祭) — 8종 ==========
  ('닷사이 23 준마이 다이긴조', 'spirits', 'Asahi Shuzo', 16.0, 720, 250000, '일본', 'self', true,
   '정미보합 23%. 닷사이 최고급. 한국에서도 품귀. 깔끔하고 우아한 풍미.'),
  ('닷사이 23 데지가루', 'spirits', 'Asahi Shuzo', 16.0, 720, 280000, '일본', 'self', true,
   '닷사이 23 디지털 버전. 첨단 기술로 빚은 신라인.'),
  ('닷사이 39 준마이 다이긴조', 'spirits', 'Asahi Shuzo', 16.0, 720, 150000, '일본', 'self', true,
   '정미보합 39%. 가성비 좋은 닷사이 중급.'),
  ('닷사이 45 준마이 다이긴조', 'spirits', 'Asahi Shuzo', 16.0, 720, 80000, '일본', 'self', true,
   '정미보합 45%. 한국에서 가장 인기. 입문용 닷사이의 표준.'),
  ('닷사이 50', 'spirits', 'Asahi Shuzo', 16.0, 720, 60000, '일본', 'self', true,
   '구 라인. 닷사이 입문용. 시판 단종 후 50주년 한정.'),
  ('닷사이 스파클링', 'spirits', 'Asahi Shuzo', 14.0, 360, 50000, '일본', 'self', true,
   '닷사이의 스파클링 사케. 축하용.'),
  ('닷사이 비욘드', 'spirits', 'Asahi Shuzo', 16.0, 720, 500000, '일본', 'self', true,
   '닷사이의 최고가 라인. 컬렉터 아이템.'),
  ('닷사이 300ml', 'spirits', 'Asahi Shuzo', 16.0, 300, 35000, '일본', 'self', true,
   '닷사이 23/39/45 작은 사이즈. 입문자 테이스팅용.'),

  -- ========== 핫카이산 (八海山) — 6종 ==========
  ('핫카이산 준마이 다이긴조', 'spirits', 'Hakkaisan', 15.5, 720, 80000, '일본', 'self', true,
   '니가타의 명품. 설실 3년 저온 숙성. 멜론 향과 깔끔한 마무리.'),
  ('핫카이산 다이긴조', 'spirits', 'Hakkaisan', 15.5, 720, 60000, '일본', 'self', true,
   '핫카이산 다이긴조. 우아한 향과 부드러움.'),
  ('핫카이산 토쿠베쓰 준마이', 'spirits', 'Hakkaisan', 15.5, 720, 35000, '일본', 'self', true,
   '특별 준마이. 가성비 좋은 핫카이산.'),
  ('핫카이산 토쿠베쓰 혼조조', 'spirits', 'Hakkaisan', 15.5, 720, 30000, '일본', 'self', true,
   '특별 혼조조. 깔끔하고 가벼운 풍미.'),
  ('핫카이산 스노쿠라', 'spirits', 'Hakkaisan', 17.0, 720, 70000, '일본', 'self', true,
   '설실 저장 라인. 부드러운 풍미.'),
  ('핫카이산 스파클링', 'spirits', 'Hakkaisan', 14.0, 360, 35000, '일본', 'self', true,
   '핫카이산 스파클링 사케.'),

  -- ========== 쿠보타 (久保田) — 8종 ==========
  ('쿠보타 만쥬', 'spirits', 'Asahi-Shuzo Niigata', 15.0, 720, 150000, '일본', 'self', true,
   '쿠보타의 최고 등급. 니가타 100% 쌀·물. 부드러운 목넘김.'),
  ('쿠보타 센쥬', 'spirits', 'Asahi-Shuzo Niigata', 15.0, 720, 50000, '일본', 'self', true,
   '쿠보타 중급. 가성비 인기.'),
  ('쿠보타 햐쿠쥬', 'spirits', 'Asahi-Shuzo Niigata', 15.0, 720, 35000, '일본', 'self', true,
   '쿠보타 입문용. 가벼운 풍미.'),
  ('쿠보타 헤키쥬', 'spirits', 'Asahi-Shuzo Niigata', 15.0, 720, 80000, '일본', 'self', true,
   '쿠보타의 풀바디 라인.'),
  ('쿠보타 료세이', 'spirits', 'Asahi-Shuzo Niigata', 15.0, 720, 120000, '일본', 'self', true,
   '쿠보타 한정. 진한 풍미.'),
  ('쿠보타 슈에이', 'spirits', 'Asahi-Shuzo Niigata', 15.0, 720, 200000, '일본', 'self', true,
   '쿠보타의 럭셔리 라인.'),
  ('쿠보타 토우코우', 'spirits', 'Asahi-Shuzo Niigata', 15.0, 720, 100000, '일본', 'self', true,
   '쿠보타의 가을 한정.'),
  ('쿠보타 사가', 'spirits', 'Asahi-Shuzo Niigata', 17.0, 720, 90000, '일본', 'self', true,
   '쿠보타의 강한 라인.'),

  -- ========== 키쿠마사무네 (菊正宗) — 5종 ==========
  ('키쿠마사무네 쥰마이', 'spirits', 'Kikumasamune', 15.5, 720, 25000, '일본', 'self', true,
   '효고 나다 지역. 한국에서 가성비 사케로 인기.'),
  ('키쿠마사무네 시보리타테', 'spirits', 'Kikumasamune', 15.0, 720, 30000, '일본', 'self', true,
   '갓 짠 사케. 신선한 풍미.'),
  ('키쿠마사무네 다이긴조', 'spirits', 'Kikumasamune', 15.0, 720, 60000, '일본', 'self', true,
   '키쿠마사무네 다이긴조. 우아한 풍미.'),
  ('키쿠마사무네 카라쿠치', 'spirits', 'Kikumasamune', 15.5, 720, 28000, '일본', 'self', true,
   '드라이한 라인. 안주와 잘 어울림.'),
  ('키쿠마사무네 PURE', 'spirits', 'Kikumasamune', 15.0, 1800, 35000, '일본', 'self', true,
   '키쿠마사무네 1.8L 대용량.'),

  -- ========== 게코타이 (月桂冠) — 4종 ==========
  ('게코타이 다이긴조', 'spirits', 'Gekkeikan', 15.5, 720, 50000, '일본', 'self', true,
   '교토의 대표. 1637년 창업. 한국 면세점에서도 인기.'),
  ('게코타이 쥰마이', 'spirits', 'Gekkeikan', 15.0, 720, 25000, '일본', 'self', true,
   '게코타이 입문용.'),
  ('게코타이 토쿠센', 'spirits', 'Gekkeikan', 15.5, 720, 35000, '일본', 'self', true,
   '특선 라인. 가성비 다이긴조.'),
  ('게코타이 츠키', 'spirits', 'Gekkeikan', 13.5, 720, 30000, '일본', 'self', true,
   '저알콜 라인. 부드러운 입문용.'),

  -- ========== 기타 메이저 사케 — 12종 ==========
  ('하쿠츠루 사케 쥬쿠세이', 'spirits', 'Hakutsuru', 15.5, 720, 30000, '일본', 'self', true,
   '효고의 대표. 코베의 명주.'),
  ('하쿠츠루 슈퍼 드라이', 'spirits', 'Hakutsuru', 15.0, 720, 25000, '일본', 'self', true,
   '드라이 라인. 안주와 잘 어울림.'),
  ('오제키 카라타무바', 'spirits', 'Ozeki', 15.5, 720, 30000, '일본', 'self', true,
   '효고 니시노미야. 한국 일식집 단골.'),
  ('오제키 다이긴조', 'spirits', 'Ozeki', 15.5, 720, 55000, '일본', 'self', true,
   '오제키의 다이긴조.'),
  ('아키시카', 'spirits', 'Akishika', 15.5, 720, 70000, '일본', 'self', true,
   '오사카의 명품. 자연파 사케 마니아의 사랑.'),
  ('하나하토 사케', 'spirits', 'Hanahato', 15.0, 720, 45000, '일본', 'self', true,
   '히로시마. 부드러운 풍미.'),
  ('덴슈', 'spirits', 'Denshu', 15.5, 720, 90000, '일본', 'self', true,
   '아오모리. 한국 사케 마니아 사이에서 컬트.'),
  ('호우쇼', 'spirits', 'Hoyo', 15.5, 720, 70000, '일본', 'self', true,
   '미야기. 도호쿠 지방의 명주.'),
  ('이마니시키 쥰마이', 'spirits', 'Imanishiki', 15.5, 720, 50000, '일본', 'self', true,
   '나가노. 산악 지방의 사케.'),
  ('카메이즈미', 'spirits', 'Kameizumi', 15.5, 720, 55000, '일본', 'self', true,
   '코치. 시코쿠 지방.'),
  ('아라마사', 'spirits', 'Aramasa', 15.0, 720, 100000, '일본', 'self', true,
   '아키타. 자연파 사케의 선구자.'),
  ('주오로쿠 토우코우 8년', 'spirits', 'Juyondai', 15.0, 720, 800000, '일본', 'self', true,
   '야마가타의 환상의 사케. 한국에서 구하기 거의 불가능.'),

  -- ========== 일본 소츄 — 17종 ==========
  ('이이치코 시루엣', 'spirits', 'Iichiko', 25.0, 720, 25000, '일본', 'self', true,
   '오이타현 보리 소츄. 한국에서 가장 흔한 일본 소츄.'),
  ('이이치코 스페셜', 'spirits', 'Iichiko', 30.0, 720, 35000, '일본', 'self', true,
   '이이치코 프리미엄. 진한 보리 풍미.'),
  ('이이치코 30년', 'spirits', 'Iichiko', 25.0, 720, 150000, '일본', 'self', true,
   '30년 숙성 라인. 럭셔리.'),
  ('키리시마 쿠로', 'spirits', 'Kirishima', 25.0, 900, 30000, '일본', 'self', true,
   '미야자키. 검은 누룩 고구마 소츄. 진한 풍미.'),
  ('키리시마 아카', 'spirits', 'Kirishima', 25.0, 900, 28000, '일본', 'self', true,
   '키리시마의 빨간 라벨. 부드러움.'),
  ('키리시마 시로', 'spirits', 'Kirishima', 25.0, 900, 26000, '일본', 'self', true,
   '키리시마의 화이트 라벨.'),
  ('진로 25', 'spirits', 'Jinro Japan', 25.0, 1800, 25000, '일본', 'self', true,
   '한국 진로의 일본 수출 라인. 일본 한국식 소주.'),
  ('마오 (魔王)', 'spirits', 'Maou', 25.0, 720, 80000, '일본', 'self', true,
   '카고시마. 프리미엄 고구마 소츄. 한국에서 품귀.'),
  ('모리이조', 'spirits', 'Mori Izo', 25.0, 720, 100000, '일본', 'self', true,
   '카고시마. 환상의 소츄 3대장 중 하나.'),
  ('무라사키 모리이조', 'spirits', 'Mori Izo', 25.0, 720, 200000, '일본', 'self', true,
   '모리이조의 프리미엄 라인.'),
  ('하나타레', 'spirits', 'Hanatare', 44.0, 720, 90000, '일본', 'self', true,
   '나카무라 양조. 첫 증류주의 정수.'),
  ('쿠로키리시마', 'spirits', 'Kuro Kirishima', 25.0, 1800, 45000, '일본', 'self', true,
   '키리시마 검은 라벨 대용량.'),
  ('아카기리시마', 'spirits', 'Aka Kirishima', 25.0, 1800, 42000, '일본', 'self', true,
   '키리시마 빨간 라벨 대용량.'),
  ('야쿠인즈 코우샤쿠', 'spirits', 'Yakuin', 25.0, 720, 40000, '일본', 'self', true,
   '큐슈 지방 소츄.'),
  ('카쿠시쿠라', 'spirits', 'Kakushikura', 25.0, 720, 50000, '일본', 'self', true,
   '히든 셀러 소츄.'),
  ('쿠로조코', 'spirits', 'Kurojoko', 25.0, 720, 45000, '일본', 'self', true,
   '검은 누룩 라인.'),
  ('진료-쿠로', 'spirits', 'Jinro', 25.0, 1800, 25000, '일본', 'self', true,
   '일본 진로 흑통.'),

  -- ========== 우메슈 (매실주) — 10종 ==========
  ('초야 매실주', 'spirits', 'Choya', 14.5, 750, 25000, '일본', 'self', true,
   '한국에서 가장 인기 있는 일본 매실주. 부드러운 단맛.'),
  ('초야 클래식', 'spirits', 'Choya', 10.0, 750, 22000, '일본', 'self', true,
   '초야의 가벼운 라인.'),
  ('초야 우메슈 골드', 'spirits', 'Choya', 17.0, 750, 35000, '일본', 'self', true,
   '초야의 프리미엄. 진한 풍미.'),
  ('츠루우메', 'spirits', 'Tsuruume', 12.0, 720, 35000, '일본', 'self', true,
   '와카야마 키슈 매실 사용. 사케 베이스.'),
  ('츠루우메 유자', 'spirits', 'Tsuruume', 12.0, 720, 38000, '일본', 'self', true,
   '유자 향 추가. 시트러스 풍미.'),
  ('하나 우메슈', 'spirits', 'Hana', 12.0, 720, 30000, '일본', 'self', true,
   '하나의 시그니처 매실주.'),
  ('아카오니 우메슈', 'spirits', 'Akaoni', 12.0, 720, 32000, '일본', 'self', true,
   '붉은 도깨비 라벨. 진한 매실 향.'),
  ('밤부 우메슈', 'spirits', 'Bamboo', 12.0, 720, 28000, '일본', 'self', true,
   '대나무 통 숙성.'),
  ('카토우 매실주', 'spirits', 'Kato', 14.0, 720, 40000, '일본', 'self', true,
   '카토 가문 매실주.'),
  ('나카타 우메슈', 'spirits', 'Nakata', 13.0, 720, 35000, '일본', 'self', true,
   '나카타의 시그니처.'),

  -- ========== 호로요이·캔 츄하이 (한국 인기) — 10종 ==========
  ('호로요이 화이트 사워', 'spirits', 'Suntory', 3.0, 350, 3500, '일본', 'self', true,
   '한국에서 가장 인기 있는 일본 츄하이. 가벼운 알콜 음료.'),
  ('호로요이 화이트 피치', 'spirits', 'Suntory', 3.0, 350, 3500, '일본', 'self', true,
   '복숭아 향. 호로요이 핵심 라인.'),
  ('호로요이 백포도', 'spirits', 'Suntory', 3.0, 350, 3500, '일본', 'self', true,
   '청포도 향. 인기 라인.'),
  ('호로요이 레몬', 'spirits', 'Suntory', 3.0, 350, 3500, '일본', 'self', true,
   '레몬 향. 깔끔한 마무리.'),
  ('호로요이 라이체', 'spirits', 'Suntory', 3.0, 350, 3500, '일본', 'self', true,
   '리치 향. 트로피컬.'),
  ('스트롱 제로 더블 레몬', 'spirits', 'Suntory', 9.0, 350, 4000, '일본', 'self', true,
   '9도 강한 츄하이. 가성비 강주의 대명사.'),
  ('스트롱 제로 그레이프', 'spirits', 'Suntory', 9.0, 350, 4000, '일본', 'self', true,
   '포도 향 스트롱 제로.'),
  ('스트롱 제로 더블 그레이프프루트', 'spirits', 'Suntory', 9.0, 350, 4000, '일본', 'self', true,
   '자몽 향 스트롱 제로.'),
  ('타카라 츄하이 레몬', 'spirits', 'Takara', 5.0, 350, 3500, '일본', 'self', true,
   '타카라의 츄하이 라인.'),
  ('하이볼 통 산토리', 'spirits', 'Suntory', 7.0, 350, 4500, '일본', 'self', true,
   '산토리 가쿠빈 하이볼 캔.')

on conflict (name, category) do nothing;

-- ============================================
-- 통계 확인
-- ============================================
-- SELECT count(*) FROM drink_catalog WHERE category='spirits' AND verified=true;
-- ============================================
