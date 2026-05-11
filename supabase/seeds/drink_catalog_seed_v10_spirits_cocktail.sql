-- ============================================
-- DRINKLOG 카탈로그 시드 v10 — 진·럼·보드카·데킬라·리큐어·칵테일 베이스 85종
-- ============================================
-- 한국 시판 + 칵테일 베이스로 자주 쓰이는 양주류. 비어있던 영역 보강.
-- 카테고리: spirits (양주 통합 분류)
--
-- 큐레이션 기준:
--   - 한국 마트/면세점/주류 전문점 시판
--   - 칵테일 베이스로 자주 등장
--   - 셀프 홈바·바테더 표준
--
-- 실행: Supabase Dashboard → SQL Editor → 이 파일 전체 복사 → Run
-- 중복 방지: ON CONFLICT (name, category) DO NOTHING
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
  -- ========== 진 (Gin) — 15종 ==========
  ('봄베이 사파이어', 'spirits', 'Bombay Sapphire', 47.0, 750, 45000, '영국', 'self', true,
   '진토닉의 정석. 푸른 병이 시그니처. 10가지 보태니컬.'),
  ('봄베이 사파이어 프리미어', 'spirits', 'Bombay Sapphire', 47.0, 750, 80000, '영국', 'self', true,
   '봄베이의 프리미엄 라인.'),
  ('탱커레이 런던 드라이', 'spirits', 'Tanqueray', 43.1, 750, 45000, '영국', 'self', true,
   '클래식 런던 드라이 진. 주니퍼가 강렬.'),
  ('탱커레이 No. 10', 'spirits', 'Tanqueray', 47.3, 750, 90000, '영국', 'self', true,
   '탱커레이의 프리미엄. 신선한 시트러스.'),
  ('헨드릭스', 'spirits', 'Hendrick''s', 41.4, 750, 75000, '스코틀랜드', 'self', true,
   '오이와 장미를 베이스로 한 독특한 진. 한국 진토닉 트렌드의 주역.'),
  ('헨드릭스 그랜드 카베나', 'spirits', 'Hendrick''s', 43.4, 750, 110000, '스코틀랜드', 'self', true,
   '헨드릭스의 한정 라인. 부드러운 미들.'),
  ('헨드릭스 오키드', 'spirits', 'Hendrick''s', 43.4, 750, 95000, '스코틀랜드', 'self', true,
   '난초 향 라인.'),
  ('비피터 런던 드라이', 'spirits', 'Beefeater', 47.0, 750, 40000, '영국', 'self', true,
   '런던 드라이 진의 클래식. 칵테일 베이스.'),
  ('시그램 진', 'spirits', 'Seagram''s', 40.0, 750, 30000, '미국', 'self', true,
   '미국식 가성비 진.'),
  ('더 보타니스트', 'spirits', 'The Botanist', 46.0, 750, 90000, '스코틀랜드', 'self', true,
   '아일레이 진. 22가지 보태니컬.'),
  ('몽키 47', 'spirits', 'Monkey 47', 47.0, 500, 130000, '독일', 'self', true,
   '독일 흑림 진. 47가지 보태니컬. 마니아 사랑.'),
  ('진메어 메디테라네', 'spirits', 'Gin Mare', 42.7, 700, 80000, '스페인', 'self', true,
   '지중해 진. 올리브와 로즈마리.'),
  ('포드 진', 'spirits', 'Ford''s', 45.0, 750, 65000, '영국', 'self', true,
   '바테더의 진. 칵테일 베이스에 최적.'),
  ('스타 오브 봄베이', 'spirits', 'Star of Bombay', 47.5, 750, 95000, '영국', 'self', true,
   '봄베이의 한정 라인.'),
  ('서울 진', 'spirits', '쓰리소사이어티', 47.0, 500, 90000, '한국', 'self', true,
   '한국 크래프트 진. 쓰리소사이어티의 한국적 보태니컬.'),

  -- ========== 럼 (Rum) — 12종 ==========
  ('바카디 슈페리어', 'spirits', 'Bacardi', 40.0, 750, 30000, '쿠바', 'self', true,
   '세계 1위 럼. 모히토·다이키리의 표준.'),
  ('바카디 골드', 'spirits', 'Bacardi', 40.0, 750, 32000, '쿠바', 'self', true,
   '오크 숙성. 부드럽고 진한 풍미.'),
  ('바카디 블랙', 'spirits', 'Bacardi', 40.0, 750, 35000, '쿠바', 'self', true,
   '다크 럼. 진한 풍미.'),
  ('캡틴 모건 오리지널', 'spirits', 'Captain Morgan', 35.0, 750, 35000, '자메이카', 'self', true,
   '스파이스드 럼의 대표. 콜라·사이다와 잘 어울림.'),
  ('캡틴 모건 블랙', 'spirits', 'Captain Morgan', 40.0, 750, 38000, '자메이카', 'self', true,
   '캡틴 모건 다크.'),
  ('하바나 클럽 3년', 'spirits', 'Havana Club', 40.0, 750, 35000, '쿠바', 'self', true,
   '쿠바 럼의 표준. 모히토 베이스.'),
  ('하바나 클럽 7년', 'spirits', 'Havana Club', 40.0, 750, 55000, '쿠바', 'self', true,
   '7년 숙성. 마시기 좋은 다크 럼.'),
  ('자카파 23', 'spirits', 'Zacapa', 40.0, 750, 130000, '과테말라', 'self', true,
   '럼의 명품. 23년 솔레라 숙성. 스트레이트로.'),
  ('자카파 XO', 'spirits', 'Zacapa', 40.0, 750, 250000, '과테말라', 'self', true,
   '자카파 럭셔리 라인.'),
  ('디플로마티코 리저바 익스클루시바', 'spirits', 'Diplomático', 40.0, 700, 90000, '베네수엘라', 'self', true,
   '베네수엘라 럼. 진하고 달콤.'),
  ('마운트 게이 일라이트', 'spirits', 'Mount Gay', 43.0, 750, 80000, '바베이도스', 'self', true,
   '세계에서 가장 오래된 럼 양조장.'),
  ('메이어스 다크 럼', 'spirits', 'Myer''s', 40.0, 750, 50000, '자메이카', 'self', true,
   '베이킹·칵테일의 단골.'),

  -- ========== 보드카 (Vodka) — 12종 ==========
  ('앱솔루트 오리지널', 'spirits', 'Absolut', 40.0, 750, 35000, '스웨덴', 'self', true,
   '보드카의 표준. 칵테일 베이스.'),
  ('앱솔루트 시트론', 'spirits', 'Absolut', 40.0, 750, 38000, '스웨덴', 'self', true,
   '레몬향 보드카.'),
  ('앱솔루트 만다린', 'spirits', 'Absolut', 40.0, 750, 38000, '스웨덴', 'self', true,
   '만다린 오렌지향.'),
  ('앱솔루트 바닐라', 'spirits', 'Absolut', 40.0, 750, 38000, '스웨덴', 'self', true,
   '바닐라향 보드카.'),
  ('그레이 구스', 'spirits', 'Grey Goose', 40.0, 750, 70000, '프랑스', 'self', true,
   '프리미엄 보드카. 부드러움.'),
  ('그레이 구스 시트론', 'spirits', 'Grey Goose', 40.0, 750, 75000, '프랑스', 'self', true,
   '그레이 구스 시트러스.'),
  ('스미노프 레드', 'spirits', 'Smirnoff', 37.5, 750, 25000, '러시아', 'self', true,
   '세계에서 가장 많이 팔리는 보드카.'),
  ('스미노프 블루', 'spirits', 'Smirnoff', 50.0, 750, 30000, '러시아', 'self', true,
   '50도 강한 스미노프.'),
  ('벨베디어', 'spirits', 'Belvedere', 40.0, 750, 80000, '폴란드', 'self', true,
   '폴란드 프리미엄 보드카.'),
  ('켓원', 'spirits', 'Ketel One', 40.0, 750, 65000, '네덜란드', 'self', true,
   '네덜란드 보드카. 부드러움.'),
  ('시락', 'spirits', 'Cîroc', 40.0, 750, 75000, '프랑스', 'self', true,
   '포도 베이스 보드카. P. 디디 콜라보.'),
  ('침볼 보드카', 'spirits', 'Chymbol', 40.0, 750, 25000, '러시아', 'self', true,
   '러시아 가성비.'),

  -- ========== 데킬라 (Tequila) — 10종 ==========
  ('호세 쿠에르보 골드', 'spirits', 'Jose Cuervo', 38.0, 750, 35000, '멕시코', 'self', true,
   '데킬라의 가성비 표준. 마가리타 베이스.'),
  ('호세 쿠에르보 실버', 'spirits', 'Jose Cuervo', 40.0, 750, 38000, '멕시코', 'self', true,
   '블랑코 라인. 깔끔.'),
  ('호세 쿠에르보 1800 실버', 'spirits', 'Jose Cuervo', 40.0, 750, 50000, '멕시코', 'self', true,
   '쿠에르보의 프리미엄.'),
  ('호세 쿠에르보 1800 레포사도', 'spirits', 'Jose Cuervo', 40.0, 750, 55000, '멕시코', 'self', true,
   '6개월 숙성. 부드러움.'),
  ('패트론 실버', 'spirits', 'Patrón', 40.0, 750, 80000, '멕시코', 'self', true,
   '프리미엄 데킬라의 표준.'),
  ('패트론 레포사도', 'spirits', 'Patrón', 40.0, 750, 90000, '멕시코', 'self', true,
   '숙성된 패트론.'),
  ('패트론 아네호', 'spirits', 'Patrón', 40.0, 750, 110000, '멕시코', 'self', true,
   '1년 이상 숙성.'),
  ('돈 훌리오 70', 'spirits', 'Don Julio', 40.0, 750, 130000, '멕시코', 'self', true,
   '70주년 기념 라인.'),
  ('돈 훌리오 1942', 'spirits', 'Don Julio', 38.0, 750, 280000, '멕시코', 'self', true,
   '데킬라의 정점. 럭셔리.'),
  ('카사미고스 블랑코', 'spirits', 'Casamigos', 40.0, 750, 95000, '멕시코', 'self', true,
   '조지 클루니 콜라보. 한국에서도 인기.'),

  -- ========== 리큐어 (Liqueur) — 15종 ==========
  ('베일리스 오리지널', 'spirits', 'Bailey''s', 17.0, 750, 35000, '아일랜드', 'self', true,
   '아이리시 크림 리큐어. 디저트 단골.'),
  ('베일리스 솔트 카라멜', 'spirits', 'Bailey''s', 17.0, 750, 38000, '아일랜드', 'self', true,
   '솔트 카라멜 향.'),
  ('베일리스 스트로베리', 'spirits', 'Bailey''s', 17.0, 750, 38000, '아일랜드', 'self', true,
   '딸기 향. 시즌 한정.'),
  ('캄파리', 'spirits', 'Campari', 25.0, 750, 35000, '이탈리아', 'self', true,
   '네그로니 베이스. 쌉쌀한 비터스.'),
  ('아페롤', 'spirits', 'Aperol', 11.0, 750, 30000, '이탈리아', 'self', true,
   '아페롤 스프리츠의 주인공. 가벼운 입문 비터.'),
  ('쿠앵트로', 'spirits', 'Cointreau', 40.0, 750, 50000, '프랑스', 'self', true,
   '오렌지 리큐어. 코스모폴리탄·마가리타.'),
  ('그랑 마니에르', 'spirits', 'Grand Marnier', 40.0, 750, 70000, '프랑스', 'self', true,
   '코냑 베이스 오렌지 리큐어.'),
  ('디사론노 아마레토', 'spirits', 'Disaronno', 28.0, 750, 40000, '이탈리아', 'self', true,
   '아몬드 향 리큐어. 아마레토 사워.'),
  ('깔루아', 'spirits', 'Kahlúa', 20.0, 750, 35000, '멕시코', 'self', true,
   '커피 리큐어. 깔루아밀크·에스프레소 마티니.'),
  ('미들오리 멜론', 'spirits', 'Midori', 20.0, 750, 30000, '일본', 'self', true,
   '멜론 리큐어. 그린 컬러.'),
  ('샹보르', 'spirits', 'Chambord', 16.5, 750, 50000, '프랑스', 'self', true,
   '블랙 라즈베리 리큐어.'),
  ('말리부 코코넛', 'spirits', 'Malibu', 21.0, 750, 30000, '바베이도스', 'self', true,
   '코코넛 럼. 트로피컬 칵테일.'),
  ('야거마이스터', 'spirits', 'Jägermeister', 35.0, 700, 35000, '독일', 'self', true,
   '56가지 허브 리큐어. 샷의 클래식.'),
  ('샘부카', 'spirits', 'Sambuca', 38.0, 750, 35000, '이탈리아', 'self', true,
   '아니스 리큐어. 커피와.'),
  ('피쉬 럼', 'spirits', 'Pisco', 40.0, 750, 45000, '페루', 'self', true,
   '피스코 사워의 주인공. 페루 국민술.'),

  -- ========== 베르무트 + 비터스 + 칵테일 베이스 — 8종 ==========
  ('마르티니 비앙코', 'spirits', 'Martini', 15.0, 1000, 25000, '이탈리아', 'self', true,
   '클래식 화이트 베르무트.'),
  ('마르티니 로쏘', 'spirits', 'Martini', 15.0, 1000, 25000, '이탈리아', 'self', true,
   '레드 베르무트. 네그로니 베이스.'),
  ('마르티니 엑스트라 드라이', 'spirits', 'Martini', 18.0, 1000, 28000, '이탈리아', 'self', true,
   '드라이 마티니의 단골.'),
  ('노일리 프라트', 'spirits', 'Noilly Prat', 18.0, 1000, 35000, '프랑스', 'self', true,
   '프랑스 드라이 베르무트.'),
  ('카르파노 안티카 포뮬라', 'spirits', 'Carpano', 16.5, 1000, 50000, '이탈리아', 'self', true,
   '베르무트의 명품. 만하탄·네그로니 업그레이드.'),
  ('친자노 비앙코', 'spirits', 'Cinzano', 15.0, 1000, 22000, '이탈리아', 'self', true,
   '친자노의 화이트 베르무트.'),
  ('앙고스투라 비터스', 'spirits', 'Angostura', 44.7, 200, 25000, '트리니다드토바고', 'self', true,
   '칵테일 비터스의 표준. 올드패션드.'),
  ('페이쇼드 비터스', 'spirits', 'Peychaud''s', 35.0, 296, 25000, '미국', 'self', true,
   '뉴올리언스 비터스. 사제락.'),

  -- ========== 한국 시판 RTD 칵테일 — 6종 ==========
  ('처음처럼 가나슈', 'spirits', '롯데칠성', 13.0, 360, 2000, '한국', 'self', true,
   '한국 칵테일 소주. 초콜릿 가나슈.'),
  ('막소 (막걸리+소주)', 'spirits', '국순당', 8.0, 750, 4500, '한국', 'self', true,
   '막걸리와 소주의 조합 RTD.'),
  ('호로요이 캔 (한국 출시)', 'spirits', 'Suntory', 3.0, 350, 3500, '일본', 'self', true,
   '한국 GS25 인기. 가벼운 알콜 음료.'),
  ('롯데 까꿍 RTD', 'spirits', '롯데칠성', 5.0, 350, 2800, '한국', 'self', true,
   '한국 RTD 칵테일.'),
  ('롯데 처음처럼 그린애플', 'spirits', '롯데칠성', 13.0, 360, 1900, '한국', 'self', true,
   '사과향 처음처럼.'),
  ('진로 막사', 'spirits', '하이트진로', 6.0, 360, 1800, '한국', 'self', true,
   '진로의 막걸리·사케 스타일 RTD.'),

  -- ========== 코냑·브랜디 — 7종 ==========
  ('헤네시 VS', 'spirits', 'Hennessy', 40.0, 700, 80000, '프랑스', 'self', true,
   '코냑의 시그니처. VS 입문용.'),
  ('헤네시 VSOP', 'spirits', 'Hennessy', 40.0, 700, 130000, '프랑스', 'self', true,
   'VSOP 등급. 4년 이상 숙성.'),
  ('헤네시 XO', 'spirits', 'Hennessy', 40.0, 700, 280000, '프랑스', 'self', true,
   '엑스트라 올드. 럭셔리.'),
  ('레미마틴 VSOP', 'spirits', 'Rémy Martin', 40.0, 700, 130000, '프랑스', 'self', true,
   '레미마틴 VSOP.'),
  ('레미마틴 XO', 'spirits', 'Rémy Martin', 40.0, 700, 300000, '프랑스', 'self', true,
   '레미마틴 럭셔리.'),
  ('마르텔 VS', 'spirits', 'Martell', 40.0, 700, 70000, '프랑스', 'self', true,
   '마르텔 입문용.'),
  ('쿠르부아지에 VSOP', 'spirits', 'Courvoisier', 40.0, 700, 130000, '프랑스', 'self', true,
   '쿠르부아지에 VSOP.')

on conflict (name, category) do nothing;

-- ============================================
-- 통계 확인
-- ============================================
-- SELECT count(*) FROM drink_catalog WHERE category='spirits' AND verified=true;
-- ============================================
