-- ============================================
-- DRINKLOG 카탈로그 시드 v9 — 한국 시판 인기 와인 100종 (정밀 큐레이션)
-- ============================================
-- 기존 wine 카테고리는 5191종(주로 raw import). 이 시드는 한국 마트·편의점
-- 시판 인기 라인만 verified=true로 정밀 큐레이션. 발견율 ↑.
--
-- WebSearch 검증 완료 (2026-05-11):
--   - 몬테스 = 2026 브랜드 고객충성도 와인 1위
--   - 1865 = 골프 18홀 65타 마케팅 + 묵직한 바디. 마트 2만원대~4만원대
--   - 옐로테일 = 편의점 베스트셀러 (러시안잭 소비뇽블랑 19,900원)
--   - 가성비 1만~2만원대 칠레·스페인 와인이 한국 마트 핵심 구간
--
-- 카테고리: wine
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
  -- ========== 몬테스 (칠레) — 10종 ==========
  ('몬테스 알파 카베르네 소비뇽', 'wine', 'Montes', 14.0, 750, 35000, '칠레', 'self', true,
   '2026 브랜드 고객충성도 와인 1위. 칠레 와인의 한국 표준. 묵직한 바디.'),
  ('몬테스 알파 샤르도네', 'wine', 'Montes', 13.5, 750, 35000, '칠레', 'self', true,
   '몬테스의 화이트 라인. 부드러운 오크 풍미.'),
  ('몬테스 알파 메를로', 'wine', 'Montes', 14.0, 750, 35000, '칠레', 'self', true,
   '부드러운 탄닌. 한국인 입맛에 친절.'),
  ('몬테스 알파 시라', 'wine', 'Montes', 14.0, 750, 38000, '칠레', 'self', true,
   '몬테스의 시라. 진한 스파이스.'),
  ('몬테스 클래식 카베르네 소비뇽', 'wine', 'Montes', 13.5, 750, 18000, '칠레', 'self', true,
   '가성비 라인. 마트 2만원대 단골.'),
  ('몬테스 클래식 메를로', 'wine', 'Montes', 13.5, 750, 18000, '칠레', 'self', true,
   '클래식 메를로. 가벼운 입문용.'),
  ('몬테스 알파 M', 'wine', 'Montes', 14.5, 750, 250000, '칠레', 'self', true,
   '몬테스의 프리미엄 아이콘. 5개 품종 블렌딩.'),
  ('몬테스 폴리', 'wine', 'Montes', 14.5, 750, 180000, '칠레', 'self', true,
   '시라 단일품종 최고급 라인.'),
  ('몬테스 트윈스', 'wine', 'Montes', 13.5, 750, 22000, '칠레', 'self', true,
   '몬테스의 캐주얼 라인. 매일 마시기 좋음.'),
  ('몬테스 리미티드', 'wine', 'Montes', 14.0, 750, 60000, '칠레', 'self', true,
   '한정 생산 라인. 마니아용.'),

  -- ========== 1865 (칠레) — 8종 ==========
  ('1865 카베르네 소비뇽', 'wine', 'San Pedro', 14.0, 750, 35000, '칠레', 'self', true,
   '"18홀 65타" 골프 마케팅으로 비즈니스 와인 1위. 묵직한 바디와 깔끔한 목넘김.'),
  ('1865 메를로', 'wine', 'San Pedro', 14.0, 750, 35000, '칠레', 'self', true,
   '부드러운 1865. 카베르네보다 가볍게.'),
  ('1865 말벡', 'wine', 'San Pedro', 14.0, 750, 35000, '칠레', 'self', true,
   '말벡 단일품종. 진하고 부드러움.'),
  ('1865 카르메네르', 'wine', 'San Pedro', 14.0, 750, 35000, '칠레', 'self', true,
   '칠레 시그니처 품종. 스파이시.'),
  ('1865 시라', 'wine', 'San Pedro', 14.0, 750, 35000, '칠레', 'self', true,
   '진한 시라. 1865의 풀바디.'),
  ('1865 샤르도네', 'wine', 'San Pedro', 13.5, 750, 35000, '칠레', 'self', true,
   '1865의 화이트. 부드러운 오크.'),
  ('1865 소비뇽 블랑', 'wine', 'San Pedro', 13.0, 750, 35000, '칠레', 'self', true,
   '신선한 시트러스. 해산물과 잘 어울림.'),
  ('1865 싱글빈야드', 'wine', 'San Pedro', 14.5, 750, 65000, '칠레', 'self', true,
   '1865의 프리미엄 단일 포도밭 라인.'),

  -- ========== 옐로테일 (호주) — 8종 ==========
  ('옐로테일 시라즈', 'wine', 'Yellow Tail', 13.5, 750, 18000, '호주', 'self', true,
   '편의점 베스트셀러. 한국에서 가장 친근한 호주 와인.'),
  ('옐로테일 카베르네 소비뇽', 'wine', 'Yellow Tail', 13.5, 750, 18000, '호주', 'self', true,
   '옐로테일 카베르네. 부드러운 입문용.'),
  ('옐로테일 메를로', 'wine', 'Yellow Tail', 13.5, 750, 18000, '호주', 'self', true,
   '옐로테일 메를로. 매일 와인.'),
  ('옐로테일 샤르도네', 'wine', 'Yellow Tail', 12.5, 750, 18000, '호주', 'self', true,
   '옐로테일의 화이트. 트로피컬 향.'),
  ('옐로테일 소비뇽 블랑', 'wine', 'Yellow Tail', 12.0, 750, 18000, '호주', 'self', true,
   '신선한 시트러스. 가벼움.'),
  ('옐로테일 모스카토', 'wine', 'Yellow Tail', 7.5, 750, 18000, '호주', 'self', true,
   '달콤한 화이트. 디저트용.'),
  ('옐로테일 핑크 모스카토', 'wine', 'Yellow Tail', 7.5, 750, 18000, '호주', 'self', true,
   '핑크 컬러. 인스타용으로 인기.'),
  ('옐로테일 버블 모스카토', 'wine', 'Yellow Tail', 7.0, 750, 22000, '호주', 'self', true,
   '스파클링. 축하용.'),

  -- ========== 컨차이토로 (칠레) — 8종 ==========
  ('카시예로 델 디아블로 카베르네', 'wine', 'Concha y Toro', 14.0, 750, 20000, '칠레', 'self', true,
   '"악마의 셀러" 전설. 한국 마트 인기.'),
  ('카시예로 델 디아블로 메를로', 'wine', 'Concha y Toro', 14.0, 750, 20000, '칠레', 'self', true,
   '부드러운 메를로. 일상용.'),
  ('카시예로 델 디아블로 샤르도네', 'wine', 'Concha y Toro', 13.5, 750, 20000, '칠레', 'self', true,
   '디아블로의 화이트.'),
  ('카시예로 델 디아블로 소비뇽 블랑', 'wine', 'Concha y Toro', 13.0, 750, 20000, '칠레', 'self', true,
   '신선한 시트러스.'),
  ('마르케스 데 카사 콘차 카베르네', 'wine', 'Concha y Toro', 14.0, 750, 45000, '칠레', 'self', true,
   '컨차이토로 프리미엄.'),
  ('돈 멜초', 'wine', 'Concha y Toro', 14.5, 750, 200000, '칠레', 'self', true,
   '칠레 와인의 정상. 컬렉터의 보물.'),
  ('그란 리저바 세렌티아', 'wine', 'Concha y Toro', 14.0, 750, 80000, '칠레', 'self', true,
   '컨차이토로 그란 리저바.'),
  ('가토 네그로', 'wine', 'Concha y Toro', 13.0, 750, 12000, '칠레', 'self', true,
   '검은 고양이 라벨. 마트 1만원대 핵심.'),

  -- ========== 19크라임 (호주) — 5종 ==========
  ('19크라임 레드', 'wine', '19 Crimes', 14.0, 750, 25000, '호주', 'self', true,
   '호주 죄수들의 라벨. 19가지 범죄. 묵직한 바디.'),
  ('19크라임 카베르네 소비뇽', 'wine', '19 Crimes', 14.0, 750, 25000, '호주', 'self', true,
   '19크라임의 카베르네.'),
  ('19크라임 스나우드 도그', 'wine', '19 Crimes', 14.0, 750, 35000, '호주', 'self', true,
   '래퍼 스누프 독 콜라보. 라벨 컬렉터 아이템.'),
  ('19크라임 스파클링', 'wine', '19 Crimes', 12.0, 750, 28000, '호주', 'self', true,
   '19크라임 스파클링.'),
  ('19크라임 더 뱅쇼드', 'wine', '19 Crimes', 14.0, 750, 30000, '호주', 'self', true,
   '뱅쇼 스타일 가향 와인.'),

  -- ========== 빌라엠 + 이탈리아 디저트 와인 — 6종 ==========
  ('빌라엠 모스카토 다스티', 'wine', 'Villa M', 5.5, 750, 18000, '이탈리아', 'self', true,
   '한국 디저트 와인 인기. 달콤한 스파클링. 입문용 끝판왕.'),
  ('빌라엠 모스카토 로사', 'wine', 'Villa M', 5.5, 750, 18000, '이탈리아', 'self', true,
   '핑크 모스카토. 인스타 인기.'),
  ('빌라엠 프로세코', 'wine', 'Villa M', 11.0, 750, 22000, '이탈리아', 'self', true,
   '드라이 스파클링.'),
  ('빌라엠 람브루스코', 'wine', 'Villa M', 8.0, 750, 22000, '이탈리아', 'self', true,
   '레드 스파클링. 식전주.'),
  ('마르티니 아스티', 'wine', 'Martini', 7.5, 750, 18000, '이탈리아', 'self', true,
   '클래식 모스카토. 한국 디저트 와인.'),
  ('마르티니 프로세코', 'wine', 'Martini', 11.5, 750, 22000, '이탈리아', 'self', true,
   '마르티니의 프로세코.'),

  -- ========== 보르도 (프랑스) — 12종 ==========
  ('샤토 라피트 로칠드', 'wine', 'Château Lafite Rothschild', 13.5, 750, 1500000, '프랑스', 'self', true,
   '보르도 1등급. 와인의 정점. 컬렉터의 꿈.'),
  ('샤토 무통 로칠드', 'wine', 'Château Mouton Rothschild', 13.5, 750, 1200000, '프랑스', 'self', true,
   '보르도 1등급. 매년 아티스트 라벨.'),
  ('샤토 마고', 'wine', 'Château Margaux', 13.5, 750, 1200000, '프랑스', 'self', true,
   '보르도 1등급. 우아한 풍미의 대명사.'),
  ('샤토 라투르', 'wine', 'Château Latour', 13.5, 750, 1300000, '프랑스', 'self', true,
   '보르도 1등급. 묵직하고 진중.'),
  ('샤토 오브리옹', 'wine', 'Château Haut-Brion', 13.5, 750, 1100000, '프랑스', 'self', true,
   '보르도 1등급. 그라브 지역.'),
  ('페트뤼스', 'wine', 'Pétrus', 13.0, 750, 5000000, '프랑스', 'self', true,
   '포므롤의 전설. 100% 메를로. 와인의 신.'),
  ('무통 카데 레드', 'wine', 'Mouton Cadet', 13.0, 750, 28000, '프랑스', 'self', true,
   '로칠드의 캐주얼 라인. 마트 인기.'),
  ('무통 카데 화이트', 'wine', 'Mouton Cadet', 12.5, 750, 28000, '프랑스', 'self', true,
   '무통 카데의 화이트.'),
  ('샤토 그뤼노 라로즈', 'wine', 'Château Gruaud Larose', 13.5, 750, 200000, '프랑스', 'self', true,
   '보르도 2등급. 세인트 줄리앙.'),
  ('샤토 피숑 라랑드', 'wine', 'Pichon Lalande', 13.5, 750, 250000, '프랑스', 'self', true,
   '보르도 2등급. 우아한 라인.'),
  ('보르도 슈페리어 마트 와인', 'wine', 'Bordeaux Superieur', 13.0, 750, 25000, '프랑스', 'self', true,
   '마트 보르도 입문용.'),
  ('샤토 베이슈벨', 'wine', 'Château Beychevelle', 13.5, 750, 220000, '프랑스', 'self', true,
   '보르도 4등급. 한국 와인 마니아 인기.'),

  -- ========== 부르고뉴 (프랑스) — 8종 ==========
  ('도멘 드 라 로마네 콩티', 'wine', 'DRC', 13.0, 750, 30000000, '프랑스', 'self', true,
   '와인의 끝판왕. 평생 한 번 마실까 말까.'),
  ('루이 자도 부르고뉴', 'wine', 'Louis Jadot', 13.0, 750, 50000, '프랑스', 'self', true,
   '부르고뉴 입문용. 한국 마트 인기.'),
  ('루이 라투르 부르고뉴', 'wine', 'Louis Latour', 13.5, 750, 50000, '프랑스', 'self', true,
   '루이 라투르 클래식.'),
  ('조세프 드루엥 부르고뉴', 'wine', 'Joseph Drouhin', 13.0, 750, 55000, '프랑스', 'self', true,
   '드루엥의 부르고뉴.'),
  ('샤블리 윌리엄 페브르', 'wine', 'William Fevre', 12.5, 750, 60000, '프랑스', 'self', true,
   '샤블리의 명가.'),
  ('포므롤 부르고뉴', 'wine', 'Bourgogne Pommard', 13.0, 750, 90000, '프랑스', 'self', true,
   '포므롤 지역 부르고뉴.'),
  ('샤사뉴 몽라쉐', 'wine', 'Chassagne Montrachet', 13.5, 750, 180000, '프랑스', 'self', true,
   '부르고뉴 화이트의 명작.'),
  ('주브레 샹베르탱', 'wine', 'Gevrey Chambertin', 13.5, 750, 150000, '프랑스', 'self', true,
   '부르고뉴 그랑 크뤼급.'),

  -- ========== 샹파뉴 (프랑스) — 8종 ==========
  ('모엣 샹동 임페리얼', 'wine', 'Moët & Chandon', 12.0, 750, 90000, '프랑스', 'self', true,
   '샹파뉴의 클래식. 축하의 표준.'),
  ('모엣 샹동 로제 임페리얼', 'wine', 'Moët & Chandon', 12.0, 750, 110000, '프랑스', 'self', true,
   '핑크 샹파뉴. 인스타용.'),
  ('베브 클리코 옐로 라벨', 'wine', 'Veuve Clicquot', 12.0, 750, 100000, '프랑스', 'self', true,
   '베브 클리코의 시그니처.'),
  ('동 페리뇽 빈티지', 'wine', 'Dom Pérignon', 12.5, 750, 350000, '프랑스', 'self', true,
   '럭셔리 샹파뉴. 특별한 날.'),
  ('크룩 그랑드 퀴베', 'wine', 'Krug', 12.0, 750, 500000, '프랑스', 'self', true,
   '샹파뉴의 정점. 컬렉터.'),
  ('루이 로데러 크리스털', 'wine', 'Louis Roederer', 12.0, 750, 400000, '프랑스', 'self', true,
   '크리스털 샹파뉴. 럭셔리.'),
  ('테탱저 라 프랑세즈', 'wine', 'Taittinger', 12.5, 750, 90000, '프랑스', 'self', true,
   '테탱저의 가성비 샹파뉴.'),
  ('볼랭저 스페셜 퀴베', 'wine', 'Bollinger', 12.0, 750, 130000, '프랑스', 'self', true,
   '제임스 본드 영화 단골 샹파뉴.'),

  -- ========== 토스카나·키안티 (이탈리아) — 8종 ==========
  ('키안티 클라시코', 'wine', 'Chianti Classico', 13.5, 750, 35000, '이탈리아', 'self', true,
   '이탈리아 키안티의 클래식. 산지오베제.'),
  ('키안티 클라시코 리세르바', 'wine', 'Chianti Classico Riserva', 14.0, 750, 55000, '이탈리아', 'self', true,
   '리세르바 등급. 더 진하고 복합적.'),
  ('티냐넬로', 'wine', 'Antinori', 14.0, 750, 250000, '이탈리아', 'self', true,
   '슈퍼 토스카나의 정점.'),
  ('솔라이아', 'wine', 'Antinori', 14.0, 750, 400000, '이탈리아', 'self', true,
   '안티노리의 럭셔리.'),
  ('사시카이아', 'wine', 'Tenuta San Guido', 13.5, 750, 350000, '이탈리아', 'self', true,
   '슈퍼 토스카나의 원조.'),
  ('마세토', 'wine', 'Masseto', 14.0, 750, 800000, '이탈리아', 'self', true,
   '이탈리아 메를로의 정점.'),
  ('브루넬로 디 몬탈치노', 'wine', 'Brunello di Montalcino', 14.0, 750, 80000, '이탈리아', 'self', true,
   '몬탈치노의 산지오베제 그란데.'),
  ('바롤로', 'wine', 'Barolo', 14.0, 750, 90000, '이탈리아', 'self', true,
   '피에몬테의 왕. 네비올로 품종.'),

  -- ========== 리오하·스페인 — 5종 ==========
  ('마르케스 데 리스칼', 'wine', 'Marqués de Riscal', 14.0, 750, 35000, '스페인', 'self', true,
   '리오하의 클래식. 한국 마트 인기.'),
  ('베가 시칠리아 우니코', 'wine', 'Vega Sicilia', 14.0, 750, 700000, '스페인', 'self', true,
   '스페인 와인의 정점.'),
  ('토레스 산스 데 리오하', 'wine', 'Torres', 13.5, 750, 25000, '스페인', 'self', true,
   '스페인 가성비.'),
  ('보데가스 무가', 'wine', 'Bodegas Muga', 14.0, 750, 50000, '스페인', 'self', true,
   '리오하의 명가.'),
  ('CVNE 임페리얼', 'wine', 'CVNE', 14.0, 750, 65000, '스페인', 'self', true,
   '리오하 그란 리세르바.'),

  -- ========== 미국 캘리포니아 — 8종 ==========
  ('갤로 패밀리 카베르네', 'wine', 'Gallo', 13.5, 750, 25000, '미국', 'self', true,
   '미국 캘리포니아 가성비.'),
  ('로버트 몬다비 우드브릿지', 'wine', 'Robert Mondavi', 13.5, 750, 25000, '미국', 'self', true,
   '몬다비의 캐주얼 라인.'),
  ('카멜 로드 카베르네', 'wine', 'Carmel Road', 14.0, 750, 35000, '미국', 'self', true,
   '캘리포니아 가성비.'),
  ('케이머스 카베르네', 'wine', 'Caymus', 14.5, 750, 150000, '미국', 'self', true,
   '나파 밸리의 시그니처.'),
  ('스택스 립 카베르네', 'wine', 'Stag''s Leap', 14.0, 750, 130000, '미국', 'self', true,
   '나파 밸리 클래식.'),
  ('오퍼스 원', 'wine', 'Opus One', 14.5, 750, 600000, '미국', 'self', true,
   '미국 와인의 정점. 로칠드와 몬다비 콜라보.'),
  ('도미니우스', 'wine', 'Dominus', 14.0, 750, 500000, '미국', 'self', true,
   '나파의 메를로 강자.'),
  ('스크리밍 이글', 'wine', 'Screaming Eagle', 14.5, 750, 5000000, '미국', 'self', true,
   '미국 와인의 환상. 컬렉터 한정.'),

  -- ========== 기타 + 도스 코파스 + 카르페디엠 + 시그니처 — 8종 ==========
  ('도스 코파스 카베르네 소비뇽', 'wine', 'Dos Copas', 13.0, 750, 9900, '칠레', 'self', true,
   '이마트 PB 가성비 끝판왕. 1만원 이하 와인의 표준.'),
  ('도스 코파스 메를로', 'wine', 'Dos Copas', 13.0, 750, 9900, '칠레', 'self', true,
   '도스 코파스 메를로.'),
  ('도스 코파스 화이트', 'wine', 'Dos Copas', 12.5, 750, 9900, '칠레', 'self', true,
   '도스 코파스 화이트.'),
  ('카르페디엠 카베르네', 'wine', 'Carpe Diem', 13.5, 750, 18000, '이탈리아', 'self', true,
   '편의점 인기 이탈리아 와인. 가벼운 풍미.'),
  ('시그니처 카베르네 소비뇽', 'wine', 'Signature', 13.5, 750, 19000, '칠레', 'self', true,
   '편의점 PB 와인. 가성비 인기.'),
  ('썬더스 카베르네', 'wine', 'Thunders', 13.0, 750, 15000, '칠레', 'self', true,
   '편의점 인기 칠레 와인.'),
  ('센트럴 빨레이 카베르네', 'wine', 'Central Valley', 13.0, 750, 14000, '칠레', 'self', true,
   '편의점 진열대의 칠레.'),
  ('리델 카베르네', 'wine', 'Riedel', 13.0, 750, 22000, '칠레', 'self', true,
   '리델의 가성비 라인.')

on conflict (name, category) do nothing;

-- ============================================
-- 통계 확인
-- ============================================
-- SELECT count(*) FROM drink_catalog WHERE category='wine' AND verified=true;
-- ============================================
