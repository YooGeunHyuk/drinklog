// drink_catalog 에 일괄 업로드할 프리셋 CSV 데이터.
// 각 프리셋은 AdminCSVUploadScreen 에서 "불러오기" 버튼으로 로드됨.
//
// CSV 헤더: name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
//
// 중복 방지: DB UNIQUE (name, category, volume_ml) 로 처리 — upsert(ignoreDuplicates=true) 로 중복 스킵.

export interface CatalogPreset {
  id: string;
  title: string;
  count: number;
  csv: string;
}

// ─────────────────────────────────────────
// 1단계: 지역소주
// ─────────────────────────────────────────
const STEP1_REGIONAL_SOJU = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 부산/경남
시원소주,무학,soju,16.9,360,한국,1800,,self,true
좋은데이,무학,soju,16.9,360,한국,1800,,self,true
좋은데이 컬러시리즈 석류,무학,soju,12,360,한국,1900,,self,true
좋은데이 컬러시리즈 블루베리,무학,soju,12,360,한국,1900,,self,true
대선,대선주조,soju,16.9,360,한국,1800,,self,true
대선 블루,대선주조,soju,16.5,360,한국,1800,,self,true
# 대구/경북
참소주,금복주,soju,16.9,360,한국,1800,,self,true
맛있는 참,금복주,soju,16.5,360,한국,1800,,self,true
# 광주/전남
잎새주,보해양조,soju,16.9,360,한국,1800,,self,true
잎새주 프리미엄,보해양조,soju,16.9,360,한국,1900,,self,true
# 전북
하이트 천년의 아침,하이트진로,soju,16.9,360,한국,1800,,self,true
# 제주
한라산,한라산소주,soju,21,375,한국,2300,투명병 오리지널,self,true
한라산 17,한라산소주,soju,17,375,한국,2200,,self,true
한라산 올래,한라산소주,soju,16.5,360,한국,1900,,self,true
# 강원
처음처럼 깔라만시,롯데칠성,soju,12,360,한국,1900,,self,true
# 충청
맥키스,맥키스컴퍼니,soju,16.9,360,한국,1800,이제우린,self,true
이제우린,맥키스컴퍼니,soju,16.9,360,한국,1800,,self,true
# 그 외
화랑,경주법주,soju,16.9,360,한국,1900,,self,true
# 용량 변형
시원소주,무학,soju,16.9,640,한국,3200,대용량,self,true
좋은데이,무학,soju,16.9,640,한국,3200,대용량,self,true
대선,대선주조,soju,16.9,640,한국,3200,대용량,self,true
한라산,한라산소주,soju,21,750,한국,4500,대용량,self,true
`;

// ─────────────────────────────────────────
// 2단계: 전통주 (증류식 소주/약주/청주/과실주)
// ─────────────────────────────────────────
const STEP2_TRADITIONAL = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 증류식 소주
화요 17,화요,soju,17,375,한국,12000,쌀 증류주,self,true
화요 25,화요,soju,25,375,한국,14000,쌀 증류주,self,true
화요 41,화요,soju,41,375,한국,25000,쌀 증류주 고도주,self,true
화요 53,화요,soju,53,500,한국,75000,프리미엄 증류식,self,true
일품진로,하이트진로,soju,25,375,한국,10000,증류식 소주,self,true
일품진로 1924,하이트진로,soju,23,375,한국,14000,한정판,self,true
미르 40,국순당,soju,40,375,한국,18000,증류식,self,true
문배주,문배술양조원,soju,40,375,한국,35000,평안도 전통 증류주,self,true
고운달 25,명인안동소주,soju,25,375,한국,32000,,self,true
고운달 40,명인안동소주,soju,40,375,한국,45000,,self,true
안동소주 45,민속주안동소주,soju,45,400,한국,28000,전통 안동소주,self,true
안동소주 35,민속주안동소주,soju,35,375,한국,22000,,self,true
이강주,전주이강주,soju,25,375,한국,25000,배·생강·꿀 전통주,self,true
감홍로,감홍로,soju,40,400,한국,35000,평양 전통 증류주,self,true
# 약주/청주
경주법주,경주법주,etc,13,375,한국,8000,쌀 약주,self,true
경주법주 초특선,경주법주,etc,16,500,한국,28000,프리미엄 청주,self,true
백화수복,국순당,etc,13,375,한국,5000,청주,self,true
청하,롯데칠성,etc,13,300,한국,3500,차가운 청주,self,true
설화,배상면주가,etc,13,375,한국,8000,,self,true
하이트 진 참나무통,하이트진로,etc,17,375,한국,9000,오크 숙성 청주,self,true
# 과실주
산사춘,배상면주가,etc,14,375,한국,6000,산사열매주,self,true
복분자 설중매,보해양조,etc,15,375,한국,8000,복분자주,self,true
복분자 고창,고창복분자,etc,15,375,한국,12000,,self,true
오미자주,문경오미자,etc,13,375,한국,15000,,self,true
`;

// ─────────────────────────────────────────
// 3단계: 프리미엄 막걸리 (지역 전통주)
// ─────────────────────────────────────────
const STEP3_MAKGEOLLI = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 주요 지역 프리미엄 막걸리
느린마을 막걸리,배상면주가,makgeolli,6,750,한국,5500,쌀 막걸리,self,true
느린마을 막걸리,배상면주가,makgeolli,6,350,한국,3000,쌀 막걸리 소용량,self,true
복순도가 손막걸리,복순도가,makgeolli,6.5,935,한국,12000,울산 프리미엄,self,true
이화주,배혜정도가,makgeolli,15,375,한국,18000,걸쭉한 전통주,self,true
송명섭막걸리,태인양조,makgeolli,6,750,한국,5000,태인 전통,self,true
지평생막걸리,지평주조,makgeolli,5,750,한국,2500,양평 지평,self,true
지평생막걸리,지평주조,makgeolli,5,375,한국,1500,양평 지평 소용량,self,true
지평 일주,지평주조,makgeolli,6,750,한국,4500,프리미엄 지평,self,true
장수막걸리,서울탁주,makgeolli,6,750,한국,1800,대표 서울 막걸리,self,true
장수 생막걸리,서울탁주,makgeolli,6,750,한국,1800,,self,true
월매 쌀막걸리,국순당,makgeolli,6,750,한국,3500,쌀 100%,self,true
국순당 쌀막걸리,국순당,makgeolli,6,750,한국,3000,,self,true
배혜정 누룩도가,배혜정도가,makgeolli,6,750,한국,5500,,self,true
이동막걸리,이동주조,makgeolli,6,750,한국,2200,포천,self,true
우곡 생쌀막걸리,배혜정도가,makgeolli,6,750,한국,6000,,self,true
해창 막걸리,해창주조,makgeolli,12,500,한국,45000,해남 프리미엄,self,true
해창 막걸리 9도,해창주조,makgeolli,9,500,한국,25000,,self,true
해창 막걸리 6도,해창주조,makgeolli,6,500,한국,12000,,self,true
금정산성 막걸리,금정산성토산주,makgeolli,8,750,한국,6000,부산 지역 민속주,self,true
우리쌀 생막걸리,국순당,makgeolli,6,750,한국,3000,,self,true
대강막걸리,대강양조장,makgeolli,6,750,한국,2500,단양,self,true
백련 막걸리,신평양조장,makgeolli,6,375,한국,5500,연잎 발효,self,true
한강주조 막걸리,한강주조,makgeolli,6,500,한국,6500,,self,true
풍정사계 춘,화양,makgeolli,10,375,한국,18000,청주 프리미엄,self,true
담은 막걸리,담은양조,makgeolli,7,500,한국,8000,,self,true
나루 생막걸리,한강주조,makgeolli,6,500,한국,6500,,self,true
`;

// ─────────────────────────────────────────
// 4단계: 한국 수제맥주 (크래프트)
// ─────────────────────────────────────────
const STEP4_KOREAN_CRAFT_BEER = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 제주맥주
제주 위트 에일,제주맥주,beer,5,355,한국,4500,밀맥주,self,true
제주 펠롱 에일,제주맥주,beer,5.3,355,한국,4500,페일에일,self,true
제주 슬라이스,제주맥주,beer,5,355,한국,4500,패션후르츠,self,true
제주 거멍 에일,제주맥주,beer,6,355,한국,5000,흑맥주,self,true
# 더쎄를라잇브루잉
플래티넘 라거,더쎄를라잇,beer,5,500,한국,4500,,self,true
세르비아,더쎄를라잇,beer,5,500,한국,5000,,self,true
# 플래티넘 브루잉
플래티넘 페일에일,플래티넘,beer,5,355,한국,4800,,self,true
# 코리아크래프트브류어리
아크 IPA,코리아크래프트,beer,6.5,330,한국,5500,,self,true
국민 라거,코리아크래프트,beer,4.5,500,한국,4000,,self,true
# 세븐브로이
강서 맥주,세븐브로이,beer,4.6,500,한국,3500,대표작,self,true
달서 맥주,세븐브로이,beer,4.6,500,한국,3500,,self,true
전라 맥주,세븐브로이,beer,4.6,500,한국,3500,,self,true
# 어메이징브루잉
성수 IPA,어메이징브루잉,beer,6.2,355,한국,5500,,self,true
한강 페일에일,어메이징브루잉,beer,5,355,한국,5000,,self,true
# 기타 크래프트
대강 IPA,더미스터리브루잉,beer,6.5,355,한국,5500,,self,true
광화문,카브루,beer,5.2,355,한국,4500,,self,true
남산 IPA,핸드앤몰트,beer,6.5,355,한국,5500,,self,true
남산 위트,핸드앤몰트,beer,5,355,한국,4500,,self,true
# 편의점 크래프트
곰표 밀맥주,세븐브로이,beer,4.5,500,한국,3000,CU 콜라보,self,true
말표 흑맥주,세븐브로이,beer,4.5,500,한국,3500,,self,true
백양 BYC,세븐브로이,beer,4.5,500,한국,3000,,self,true
경복궁 라거,세븐브로이,beer,4.5,500,한국,3000,,self,true
`;

// ─────────────────────────────────────────
// 5단계: 수입 크래프트 맥주 (확장)
// ─────────────────────────────────────────
const STEP5_IMPORTED_CRAFT_BEER = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# BrewDog (UK)
펑크 IPA,BrewDog,beer,5.6,330,영국,5500,대표 IPA,self,true
헤이지 제인,BrewDog,beer,7.2,330,영국,6500,뉴잉글랜드 IPA,self,true
엘비스 주스,BrewDog,beer,6.5,330,영국,6500,자몽 IPA,self,true
# Stone Brewing (USA)
IPA,Stone Brewing,beer,6.9,355,미국,6000,,self,true
# Lagunitas
IPA,Lagunitas,beer,6.2,355,미국,5500,,self,true
# Sierra Nevada
페일에일,Sierra Nevada,beer,5.6,355,미국,5500,,self,true
# Goose Island
IPA,Goose Island,beer,5.9,355,미국,5500,,self,true
312 Urban Wheat,Goose Island,beer,4.2,355,미국,5000,,self,true
# 벨기에 수도원
듀벨,Duvel,beer,8.5,330,벨기에,7000,골든 에일,self,true
레페 브라운,Leffe,beer,6.5,330,벨기에,5000,,self,true
레페 블론드,Leffe,beer,6.6,330,벨기에,5000,,self,true
쉬메이 블루,Chimay,beer,9,330,벨기에,9000,트라피스트,self,true
쉬메이 레드,Chimay,beer,7,330,벨기에,8000,트라피스트,self,true
오르발,Orval,beer,6.2,330,벨기에,9500,트라피스트,self,true
베스트말레 뒤벨,Westmalle,beer,7,330,벨기에,8500,트라피스트,self,true
# 독일
파울라너 헤페바이스,Paulaner,beer,5.5,500,독일,4500,밀맥주,self,true
에딩거 헤페바이스,Erdinger,beer,5.3,500,독일,4500,,self,true
바이헨슈테판,Weihenstephan,beer,5.4,500,독일,5000,,self,true
쾨스트리처 슈바르츠,Köstritzer,beer,4.8,500,독일,4500,흑맥주,self,true
# 체코
필스너 우르켈,Pilsner Urquell,beer,4.4,500,체코,4000,원조 필스너,self,true
# 일본
요나요나 에일,야호브루잉,beer,5.5,350,일본,5500,,self,true
인도의 푸른 달,야호브루잉,beer,7,350,일본,6500,IPA,self,true
# 덴마크/네덜란드
투보그 클래식,Tuborg,beer,4.6,500,덴마크,3500,,self,true
# 멕시코 프리미엄
파시피코,Pacifico,beer,4.5,355,멕시코,4500,,self,true
`;

// ─────────────────────────────────────────
// 6단계: 위스키 확장 (싱글몰트/블렌디드)
// ─────────────────────────────────────────
const STEP6_WHISKEY_EXPANSION = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 스코틀랜드 싱글몰트 - 스페이사이드
글렌피딕 12,글렌피딕,whiskey,40,700,스코틀랜드,75000,과일 배 노트,self,true
글렌피딕 15,글렌피딕,whiskey,40,700,스코틀랜드,110000,솔레라 숙성,self,true
글렌피딕 18,글렌피딕,whiskey,40,700,스코틀랜드,200000,,self,true
글렌리벳 12,글렌리벳,whiskey,40,700,스코틀랜드,70000,,self,true
글렌리벳 파운더스 리저브,글렌리벳,whiskey,40,700,스코틀랜드,60000,,self,true
글렌리벳 15,글렌리벳,whiskey,40,700,스코틀랜드,130000,프렌치 오크,self,true
글렌리벳 18,글렌리벳,whiskey,43,700,스코틀랜드,240000,,self,true
맥캘란 12 더블캐스크,맥캘란,whiskey,40,700,스코틀랜드,130000,셰리·버번 이중숙성,self,true
맥캘란 12 셰리오크,맥캘란,whiskey,40,700,스코틀랜드,180000,,self,true
맥캘란 18 셰리오크,맥캘란,whiskey,43,700,스코틀랜드,850000,,self,true
발베니 12 더블우드,발베니,whiskey,40,700,스코틀랜드,120000,,self,true
발베니 14 캐리비안 캐스크,발베니,whiskey,43,700,스코틀랜드,170000,럼 캐스크,self,true
발베니 21 포트우드,발베니,whiskey,40,700,스코틀랜드,450000,,self,true
아벨라워 12,아벨라워,whiskey,40,700,스코틀랜드,85000,,self,true
아벨라워 아부나,아벨라워,whiskey,60.3,700,스코틀랜드,180000,캐스크 스트렝스,self,true
# 하이랜드
글렌모렌지 오리지널,글렌모렌지,whiskey,40,700,스코틀랜드,80000,10년,self,true
글렌모렌지 라산타,글렌모렌지,whiskey,43,700,스코틀랜드,110000,셰리 피니시,self,true
글렌모렌지 넥타도르,글렌모렌지,whiskey,46,700,스코틀랜드,130000,소테른 피니시,self,true
오반 14,오반,whiskey,43,700,스코틀랜드,200000,,self,true
# 아일라 (피트)
라가불린 16,라가불린,whiskey,43,700,스코틀랜드,220000,스모키 피트,self,true
라프로익 10,라프로익,whiskey,40,700,스코틀랜드,120000,피트 요오드,self,true
라프로익 쿼터 캐스크,라프로익,whiskey,48,700,스코틀랜드,150000,,self,true
아드벡 10,아드벡,whiskey,46,700,스코틀랜드,130000,스모키,self,true
아드벡 우갓달,아드벡,whiskey,54.2,700,스코틀랜드,180000,셰리 NAS,self,true
보모어 12,보모어,whiskey,40,700,스코틀랜드,100000,,self,true
쿨일라 12,쿨일라,whiskey,43,700,스코틀랜드,170000,,self,true
# 블렌디드 스카치
조니워커 레드,Johnnie Walker,whiskey,40,700,스코틀랜드,35000,,self,true
조니워커 블랙 12,Johnnie Walker,whiskey,40,700,스코틀랜드,55000,,self,true
조니워커 더블블랙,Johnnie Walker,whiskey,40,700,스코틀랜드,75000,,self,true
조니워커 그린 15,Johnnie Walker,whiskey,43,700,스코틀랜드,95000,블렌디드 몰트,self,true
조니워커 골드 리저브,Johnnie Walker,whiskey,40,700,스코틀랜드,130000,,self,true
조니워커 블루,Johnnie Walker,whiskey,40,700,스코틀랜드,280000,,self,true
시바스 리갈 12,Chivas Regal,whiskey,40,700,스코틀랜드,45000,,self,true
시바스 리갈 18,Chivas Regal,whiskey,40,700,스코틀랜드,130000,,self,true
로얄 살루트 21,Royal Salute,whiskey,40,700,스코틀랜드,280000,,self,true
발렌타인 12,Ballantine's,whiskey,40,700,스코틀랜드,40000,,self,true
발렌타인 17,Ballantine's,whiskey,40,700,스코틀랜드,110000,,self,true
발렌타인 21,Ballantine's,whiskey,40,700,스코틀랜드,280000,,self,true
# 미국 버번
메이커스 마크,Maker's Mark,whiskey,45,700,미국,60000,,self,true
우드포드 리저브,Woodford Reserve,whiskey,43.2,700,미국,80000,,self,true
버팔로 트레이스,Buffalo Trace,whiskey,45,700,미국,65000,,self,true
잭다니엘 No.7,Jack Daniel's,whiskey,40,700,미국,50000,테네시,self,true
잭다니엘 젠틀맨 잭,Jack Daniel's,whiskey,40,700,미국,65000,,self,true
잭다니엘 싱글배럴,Jack Daniel's,whiskey,47,700,미국,110000,,self,true
짐빔 화이트,Jim Beam,whiskey,40,700,미국,35000,,self,true
와일드터키 101,Wild Turkey,whiskey,50.5,700,미국,55000,,self,true
불렛 버번,Bulleit,whiskey,45,700,미국,60000,,self,true
이글레어 10,Eagle Rare,whiskey,45,700,미국,130000,,self,true
# 아일랜드
제임슨,Jameson,whiskey,40,700,아일랜드,40000,,self,true
제임슨 블랙배럴,Jameson,whiskey,40,700,아일랜드,65000,,self,true
레드브레스트 12,Redbreast,whiskey,40,700,아일랜드,130000,,self,true
틸링 스몰배치,Teeling,whiskey,46,700,아일랜드,60000,,self,true
# 일본
야마자키 12,Suntory,whiskey,43,700,일본,350000,,self,true
하쿠슈 12,Suntory,whiskey,43,700,일본,350000,,self,true
히비키 하모니,Suntory,whiskey,43,700,일본,200000,블렌디드,self,true
히비키 21,Suntory,whiskey,43,700,일본,1500000,,self,true
타케츠루 퓨어몰트,Nikka,whiskey,43,700,일본,130000,,self,true
닛카 프롬더배럴,Nikka,whiskey,51.4,500,일본,90000,,self,true
# 캐나다
크라운로얄,Crown Royal,whiskey,40,700,캐나다,50000,,self,true
# 대만
카발란 클래식,Kavalan,whiskey,40,700,대만,130000,,self,true
카발란 솔리스트 셰리,Kavalan,whiskey,57.8,700,대만,450000,,self,true
# 인도
앰룻 포르토노바,Amrut,whiskey,62.1,700,인도,180000,,self,true
`;

// ─────────────────────────────────────────
// 7단계: 사케/바이주 (동양주)
// ─────────────────────────────────────────
const STEP7_SAKE_BAIJIU = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 일본 사케 - 준마이
핫카이산 준마이,핫카이산,etc,15.5,720,일본,45000,니가타 드라이,self,true
쿠보타 센주,쿠보타,etc,15,720,일본,55000,,self,true
쿠보타 만주,쿠보타,etc,15,720,일본,120000,다이긴조,self,true
카모이즈미 슈스이,카모이즈미,etc,15,720,일본,60000,,self,true
닷사이 45 준마이다이긴조,닷사이,etc,16,720,일본,80000,,self,true
닷사이 39 준마이다이긴조,닷사이,etc,16,720,일본,110000,,self,true
닷사이 23 준마이다이긴조,닷사이,etc,16,720,일본,220000,톱급,self,true
고토부키센,고토부키,etc,15,720,일본,40000,,self,true
코시노칸바이,코시노칸바이,etc,15.5,720,일본,65000,,self,true
쥰마이 하쿠쯔루,하쿠쯔루,etc,14.5,720,일본,35000,,self,true
햣쇼,햣쇼슈조,etc,15,720,일본,50000,,self,true
# 사케 소용량/고급
백학 준마이,백학,etc,15,300,일본,15000,,self,true
신세이,신세이,etc,15,720,일본,45000,,self,true
# 우메슈/매실주
쵸야 우메슈,쵸야,etc,14,720,일본,25000,매실주,self,true
쵸야 엑스트라 이어즈,쵸야,etc,17,720,일본,45000,,self,true
카호쿠 매실주,카호쿠,etc,12,720,일본,35000,,self,true
사라리토시타 우메슈,쵸야,etc,10,650,일본,18000,저도수 매실,self,true
# 쇼츄
쿠로키리시마,키리시마슈조,spirits,25,900,일본,25000,검정고구마 쇼츄,self,true
시로키리시마,키리시마슈조,spirits,25,900,일본,22000,흰고구마 쇼츄,self,true
모리이조,모리이조,spirits,25,720,일본,60000,프리미엄 고구마,self,true
리쿠와리,쿠라모토,spirits,25,720,일본,40000,보리 쇼츄,self,true
이치고이치에,,spirits,25,900,일본,30000,보리 쇼츄,self,true
# 중국 바이주 - 장향형
마오타이 비행천,Moutai,spirits,53,500,중국,450000,대표 장향형,self,true
마오타이 왕자주,Moutai,spirits,53,500,중국,120000,,self,true
# 바이주 - 농향형
오량액,五粮液,spirits,52,500,중국,220000,,self,true
수정방,水井坊,spirits,52,500,중국,180000,,self,true
노주노교,泸州老窖,spirits,52,500,중국,45000,,self,true
# 바이주 - 청향형
분주 45,汾酒,spirits,45,500,중국,35000,청향형 대표,self,true
분주 53,汾酒,spirits,53,500,중국,55000,,self,true
# 바이주 - 중저가
우량예 면양,五粮液,spirits,50,500,중국,45000,,self,true
이과두주,红星,spirits,56,500,중국,4000,북경 서민주,self,true
이과두주 6년,红星,spirits,42,500,중국,8000,,self,true
우장,五粮液,spirits,52,125,중국,15000,소용량,self,true
# 기타 동양 증류주
소월란,소월란,spirits,25,500,중국,30000,,self,true
`;

// ─────────────────────────────────────────
// 8단계: 대중 소주·맥주 (편의점/마트 주력)
// 기존 1단계(지역소주)에 없는 전국구 대형 브랜드
// ─────────────────────────────────────────
const STEP8_MAINSTREAM = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 전국구 소주
참이슬 후레쉬,하이트진로,soju,16.5,360,한국,4500,,csv,true
참이슬 오리지널,하이트진로,soju,20.1,360,한국,4500,,csv,true
참이슬 후레쉬,하이트진로,soju,16.5,640,한국,7500,대용량,csv,true
진로 이즈 백,하이트진로,soju,16.5,360,한국,4500,,csv,true
처음처럼,롯데칠성,soju,16.5,360,한국,4500,,csv,true
처음처럼 새로,롯데칠성,soju,16.0,360,한국,4500,,csv,true
새로,롯데칠성,soju,16.0,360,한국,4500,,csv,true
# 과일소주
참이슬 자몽,하이트진로,soju,13.0,360,한국,4500,,csv,true
참이슬 청포도,하이트진로,soju,13.0,360,한국,4500,,csv,true
참이슬 자두,하이트진로,soju,13.0,360,한국,4500,,csv,true
참이슬 딸기,하이트진로,soju,13.0,360,한국,4500,,csv,true
처음처럼 순하리 자몽,롯데칠성,soju,12.0,360,한국,4500,,csv,true
처음처럼 순하리 청포도,롯데칠성,soju,12.0,360,한국,4500,,csv,true
처음처럼 순하리 딸기,롯데칠성,soju,12.0,360,한국,4500,,csv,true
처음처럼 순하리 복숭아,롯데칠성,soju,12.0,360,한국,4500,,csv,true
진로 자몽에이슬,하이트진로,soju,13.0,360,한국,4500,,csv,true
진로 자두에이슬,하이트진로,soju,13.0,360,한국,4500,,csv,true
새로 살구,롯데칠성,soju,12.0,360,한국,4500,,csv,true
# 국산 대형 맥주
카스 프레시,오비맥주,beer,4.5,355,한국,2500,,csv,true
카스 프레시,오비맥주,beer,4.5,500,한국,3500,,csv,true
카스 라이트,오비맥주,beer,4.0,355,한국,2500,,csv,true
카스 레몬 스퀴즈,오비맥주,beer,4.5,355,한국,2500,,csv,true
테라,하이트진로,beer,4.6,355,한국,2500,,csv,true
테라,하이트진로,beer,4.6,500,한국,3500,,csv,true
켈리,하이트진로,beer,4.5,355,한국,2500,,csv,true
켈리,하이트진로,beer,4.5,500,한국,3500,,csv,true
하이트 엑스트라콜드,하이트진로,beer,4.5,355,한국,2500,,csv,true
필라이트,하이트진로,beer,4.5,355,한국,1200,,csv,true
필라이트 후레쉬,하이트진로,beer,4.5,355,한국,1200,,csv,true
필굿,롯데칠성,beer,4.5,355,한국,1200,,csv,true
필굿 세라,롯데칠성,beer,4.5,355,한국,1200,,csv,true
클라우드,롯데칠성,beer,5.0,355,한국,2500,,csv,true
클라우드 생 드래프트,롯데칠성,beer,5.0,355,한국,2500,,csv,true
한맥,오비맥주,beer,4.6,355,한국,2500,,csv,true
OB 라거,오비맥주,beer,4.6,355,한국,2500,,csv,true
# 수입 대형 맥주
하이네켄,하이네켄,beer,5.0,355,네덜란드,3000,,csv,true
하이네켄,하이네켄,beer,5.0,500,네덜란드,4000,,csv,true
하이네켄 실버,하이네켄,beer,4.0,355,네덜란드,3000,,csv,true
칭따오,칭따오,beer,4.7,330,중국,2500,,csv,true
칭따오,칭따오,beer,4.7,500,중국,3500,,csv,true
아사히 수퍼드라이,아사히,beer,5.0,350,일본,3000,,csv,true
아사히 수퍼드라이,아사히,beer,5.0,500,일본,4000,,csv,true
삿포로 프리미엄,삿포로,beer,5.0,350,일본,3000,,csv,true
삿포로 프리미엄,삿포로,beer,5.0,650,일본,4500,,csv,true
기린 이치방,기린,beer,5.0,350,일본,3000,,csv,true
산토리 프리미엄 몰츠,산토리,beer,5.5,350,일본,3500,,csv,true
호가든,ABInBev,beer,4.9,330,벨기에,3500,,csv,true
스텔라 아르투아,ABInBev,beer,5.2,330,벨기에,3500,,csv,true
버드와이저,ABInBev,beer,5.0,355,미국,3000,,csv,true
코로나 엑스트라,AB모델로,beer,4.5,355,멕시코,3500,,csv,true
기네스 드래프트,기네스,beer,4.2,440,아일랜드,4000,,csv,true
에델바이스,하이네켄,beer,5.3,330,오스트리아,3000,,csv,true
블랑1664,크로넨부르,beer,5.0,330,프랑스,3500,,csv,true
타이거,하이네켄,beer,5.0,330,싱가포르,2500,,csv,true
산미구엘 페일필젠,산미구엘,beer,5.0,330,필리핀,2500,,csv,true
카를스버그,카를스버그,beer,5.0,330,덴마크,3000,,csv,true
# 기타 대중 주류
이슬톡톡,하이트진로,etc,3.0,275,한국,2000,탄산주,csv,true
부라더 소다,롯데칠성,etc,3.0,355,한국,2000,탄산주,csv,true
스크루바 복숭아,오비맥주,etc,3.5,355,한국,2000,하드셀처,csv,true
매화수,롯데칠성,etc,14.0,360,한국,3500,과실주,csv,true
매화수,롯데칠성,etc,14.0,750,한국,6000,과실주,csv,true
짐빔 하이볼,짐빔,whiskey,5.0,355,미국,4000,하이볼 캔,csv,true
산토리 토리스 하이볼,산토리,whiskey,7.0,350,일본,4500,하이볼 캔,csv,true
잭콕,잭다니엘,whiskey,5.0,330,미국,4000,하이볼 캔,csv,true
`;

// ─────────────────────────────────────────
// 9단계: 와인 (대중~중급)
// ─────────────────────────────────────────
const STEP9_WINE = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 칠레 — 한국 인기 1위 수입국
몬테스 알파 까베르네 소비뇽,몬테스,wine,14.5,750,칠레,25000,레드,csv,true
몬테스 알파 메를로,몬테스,wine,14.5,750,칠레,25000,레드,csv,true
몬테스 알파 시라,몬테스,wine,14.5,750,칠레,25000,레드,csv,true
몬테스 클래식 까베르네 소비뇽,몬테스,wine,14.0,750,칠레,15000,레드,csv,true
몬테스 클래식 메를로,몬테스,wine,14.0,750,칠레,15000,레드,csv,true
몬테스 클래식 샤르도네,몬테스,wine,13.5,750,칠레,15000,화이트,csv,true
1865 까베르네 소비뇽,산 페드로,wine,14.5,750,칠레,18000,레드,csv,true
1865 카르메네르,산 페드로,wine,14.5,750,칠레,18000,레드,csv,true
1865 소비뇽 블랑,산 페드로,wine,13.0,750,칠레,18000,화이트,csv,true
1865 시라,산 페드로,wine,14.5,750,칠레,18000,레드,csv,true
산타 리타 120 까베르네 소비뇽,산타 리타,wine,13.5,750,칠레,12000,레드,csv,true
산타 리타 120 메를로,산타 리타,wine,13.5,750,칠레,12000,레드,csv,true
산타 리타 120 소비뇽 블랑,산타 리타,wine,13.0,750,칠레,12000,화이트,csv,true
코노 수르 비시클레타 까베르네 소비뇽,코노 수르,wine,13.0,750,칠레,10000,레드,csv,true
코노 수르 비시클레타 메를로,코노 수르,wine,13.0,750,칠레,10000,레드,csv,true
코노 수르 비시클레타 소비뇽 블랑,코노 수르,wine,13.0,750,칠레,10000,화이트,csv,true
코노 수르 비시클레타 피노 누아,코노 수르,wine,13.0,750,칠레,10000,레드,csv,true
운두라가 시바리스 까베르네 소비뇽,운두라가,wine,13.5,750,칠레,15000,레드,csv,true
카사 라포스톨 까사 까베르네 소비뇽,카사 라포스톨,wine,14.0,750,칠레,18000,레드,csv,true
에밀리아나 어도비 까베르네 소비뇽,에밀리아나,wine,13.5,750,칠레,12000,유기농 레드,csv,true
# 호주
옐로우 테일 쉬라즈,옐로우테일,wine,13.5,750,호주,14900,레드,csv,true
옐로우 테일 까베르네 소비뇽,옐로우테일,wine,13.5,750,호주,14900,레드,csv,true
옐로우 테일 샤르도네,옐로우테일,wine,13.0,750,호주,14900,화이트,csv,true
옐로우 테일 메를로,옐로우테일,wine,13.5,750,호주,14900,레드,csv,true
옐로우 테일 피노 누아,옐로우테일,wine,13.0,750,호주,14900,레드,csv,true
옐로우 테일 모스카토,옐로우테일,wine,7.5,750,호주,14900,스위트,csv,true
펜폴즈 빈 389,펜폴즈,wine,14.5,750,호주,120000,프리미엄 레드,csv,true
제이콥스 크릭 쉬라즈 까베르네,제이콥스 크릭,wine,13.5,750,호주,14000,레드,csv,true
# 프랑스
바롱 필립 드 로칠드 무통 까데,로칠드,wine,13.0,750,프랑스,18000,보르도 레드,csv,true
샤또 라 투르 드 비,투르 드 비,wine,13.0,750,프랑스,15000,보르도,csv,true
루이 자도 보졸레 빌라주,루이 자도,wine,13.0,750,프랑스,20000,보졸레,csv,true
가시아 까리냥,가시아,wine,12.0,750,프랑스,9900,남프랑스,csv,true
앙리 라퐁 소뮈르,앙리 라퐁,wine,12.5,750,프랑스,18000,루아르,csv,true
# 이탈리아
안티노리 산타 크리스티나,안티노리,wine,12.5,750,이탈리아,15000,토스카나,csv,true
루피노 키안티,루피노,wine,12.5,750,이탈리아,18000,키안티,csv,true
바로네 피니 핀 그리지오,바로네 피니,wine,12.0,750,이탈리아,12000,화이트,csv,true
# 미국
베린저 까베르네 소비뇽,베린저,wine,13.5,750,미국,15000,캘리포니아,csv,true
로버트 몬다비 프라이빗 셀렉션 까베르네,로버트 몬다비,wine,13.5,750,미국,25000,나파밸리,csv,true
# 스페인
투레스 상그레 데 토로,투레스,wine,13.5,750,스페인,12000,레드,csv,true
마르께스 데 카세레스 크리안자,마르께스 데 카세레스,wine,13.5,750,스페인,18000,리오하,csv,true
# 아르헨티나
트리비엔토 리저브 말벡,트리비엔토,wine,14.0,750,아르헨티나,15000,멘도사,csv,true
카테나 말벡,카테나,wine,13.5,750,아르헨티나,25000,멘도사,csv,true
# 스파클링/샴페인
모엣 샹동 임페리얼,모엣 샹동,wine,12.0,750,프랑스,69000,샴페인,csv,true
뵈브 클리코 옐로우 라벨,뵈브 클리코,wine,12.0,750,프랑스,75000,샴페인,csv,true
마르티니 아스티,마르티니,wine,7.5,750,이탈리아,18000,스파클링,csv,true
프레시넷 코르돈 네그로,프레시넷,wine,11.5,750,스페인,15000,까바,csv,true
라 스피네타 모스카토 다스티,라 스피네타,wine,5.5,750,이탈리아,22000,스위트 스파클링,csv,true
산테로 피노 샤르도네,산테로,wine,11.0,750,이탈리아,12000,프로세코,csv,true
# 한국 와인
칠성 산타,롯데칠성,wine,12.0,750,한국,5000,레드,csv,true
마주앙 레드,롯데칠성,wine,12.0,750,한국,6000,레드,csv,true
마주앙 화이트,롯데칠성,wine,11.0,750,한국,6000,화이트,csv,true
# 뱅쇼/와인음료
뱅쇼,CJ,wine,6.5,500,한국,4500,멀드와인,csv,true
`;

// ─────────────────────────────────────────
// 10단계: 양주·스피릿 (보드카/진/럼/데킬라/리큐르)
// ─────────────────────────────────────────
const STEP10_SPIRITS = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# 보드카
앱솔루트 보드카,앱솔루트,spirits,40.0,700,스웨덴,28000,,csv,true
앱솔루트 시트론,앱솔루트,spirits,40.0,700,스웨덴,28000,레몬,csv,true
앱솔루트 바닐라,앱솔루트,spirits,40.0,700,스웨덴,28000,,csv,true
스미노프 보드카,스미노프,spirits,40.0,700,러시아,20000,,csv,true
스미노프 그린애플,스미노프,spirits,37.5,700,러시아,20000,,csv,true
그레이구스 보드카,그레이구스,spirits,40.0,700,프랑스,55000,프리미엄,csv,true
벨루가 노블,벨루가,spirits,40.0,700,러시아,65000,프리미엄,csv,true
스카이 보드카,스카이,spirits,40.0,700,미국,18000,,csv,true
핀란디아 보드카,핀란디아,spirits,40.0,700,핀란드,22000,,csv,true
# 진
봄베이 사파이어,봄베이,spirits,47.0,700,영국,35000,,csv,true
비피터 진,비피터,spirits,40.0,700,영국,25000,,csv,true
비피터 24,비피터,spirits,45.0,700,영국,35000,프리미엄,csv,true
헨드릭스 진,헨드릭스,spirits,41.4,700,영국,45000,오이·장미,csv,true
탱커레이 진,탱커레이,spirits,43.1,700,영국,32000,,csv,true
탱커레이 No. Ten,탱커레이,spirits,47.3,700,영국,50000,프리미엄,csv,true
고든스 진,고든스,spirits,37.5,700,영국,20000,,csv,true
몽키 47 진,몽키47,spirits,47.0,500,독일,55000,,csv,true
로쿠 진,산토리,spirits,43.0,700,일본,45000,일본식 크래프트,csv,true
# 럼
바카디 화이트,바카디,spirits,40.0,700,쿠바,25000,화이트럼,csv,true
바카디 골드,바카디,spirits,40.0,700,쿠바,25000,골드럼,csv,true
바카디 블랙,바카디,spirits,40.0,700,쿠바,25000,다크럼,csv,true
캡틴모건 스파이스드,캡틴모건,spirits,35.0,700,자메이카,25000,,csv,true
말리부,말리부,spirits,21.0,700,바베이도스,22000,코코넛 럼,csv,true
하바나 클럽 3년,하바나 클럽,spirits,40.0,700,쿠바,30000,,csv,true
# 데킬라
호세 쿠엘보 골드,호세 쿠엘보,spirits,40.0,700,멕시코,35000,,csv,true
호세 쿠엘보 실버,호세 쿠엘보,spirits,40.0,700,멕시코,35000,,csv,true
사우자 실버,사우자,spirits,38.0,700,멕시코,30000,,csv,true
사우자 골드,사우자,spirits,38.0,700,멕시코,30000,,csv,true
패트론 실버,패트론,spirits,40.0,700,멕시코,70000,프리미엄,csv,true
올메카 실버,올메카,spirits,38.0,700,멕시코,30000,,csv,true
# 리큐르/비터
예거마이스터,예거마이스터,spirits,35.0,700,독일,30000,허브 리큐르,csv,true
예거마이스터,예거마이스터,spirits,35.0,350,독일,18000,허브 리큐르 소용량,csv,true
깔루아,깔루아,spirits,20.0,700,멕시코,25000,커피 리큐르,csv,true
베일리스,베일리스,spirits,17.0,700,아일랜드,30000,크림 리큐르,csv,true
캄파리,캄파리,spirits,25.0,700,이탈리아,30000,비터,csv,true
아페롤,아페롤,spirits,11.0,700,이탈리아,25000,비터,csv,true
마르티니 드라이,마르티니,spirits,18.0,750,이탈리아,18000,베르무트,csv,true
마르티니 비앙코,마르티니,spirits,15.0,750,이탈리아,18000,베르무트,csv,true
마르티니 로쏘,마르티니,spirits,15.0,750,이탈리아,18000,베르무트,csv,true
디사론노 아마레또,디사론노,spirits,28.0,700,이탈리아,35000,,csv,true
코앵트로,코앵트로,spirits,40.0,700,프랑스,35000,오렌지 리큐르,csv,true
미도리,미도리,spirits,20.0,700,일본,25000,메론 리큐르,csv,true
말리부 파인애플,말리부,spirits,21.0,700,바베이도스,22000,,csv,true
히프노틱,히프노틱,spirits,17.0,700,프랑스,35000,블루 리큐르,csv,true
# 브랜디/코냑
헤네시 VS,헤네시,spirits,40.0,700,프랑스,65000,코냑,csv,true
헤네시 VSOP,헤네시,spirits,40.0,700,프랑스,110000,코냑,csv,true
헤네시 XO,헤네시,spirits,40.0,700,프랑스,350000,코냑,csv,true
레미마르탱 VSOP,레미마르탱,spirits,40.0,700,프랑스,100000,코냑,csv,true
`;

// ─────────────────────────────────────────
// 11단계: 생맥주 (드래프트) — 잔/피처 사이즈
// 가게에서 마시는 생맥주는 brand가 불명확한 경우가 많아 generic 옵션도 포함
// ─────────────────────────────────────────
const STEP11_DRAFT_BEER = `name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified
# Generic — 가게에서 "생맥주"라고 부를 때
생맥주 (한 잔 300ml),,beer,4.5,300,한국,3000,일반 생맥주 작은 잔,csv,true
생맥주 (한 잔 500ml),,beer,4.5,500,한국,4000,일반 생맥주 표준 잔,csv,true
생맥주 (1L),,beer,4.5,1000,한국,7000,일반 생맥주 1L,csv,true
생맥주 피처 (1.7L),,beer,4.5,1700,한국,12000,일반 생맥주 피처 (소),csv,true
생맥주 피처 (3L),,beer,4.5,3000,한국,18000,일반 생맥주 피처 (표준),csv,true
생맥주 피처 (5L),,beer,4.5,5000,한국,28000,일반 생맥주 피처 (대),csv,true
# 카스 생맥주
카스 생맥주 (500ml),오비맥주,beer,4.5,500,한국,4000,잔,csv,true
카스 생맥주 (1L),오비맥주,beer,4.5,1000,한국,7000,1L 잔,csv,true
카스 생맥주 피처 (3L),오비맥주,beer,4.5,3000,한국,18000,피처,csv,true
카스 생맥주 피처 (5L),오비맥주,beer,4.5,5000,한국,28000,대 피처,csv,true
# 테라 생맥주
테라 생맥주 (500ml),하이트진로,beer,4.6,500,한국,4500,잔,csv,true
테라 생맥주 (1L),하이트진로,beer,4.6,1000,한국,8000,1L 잔,csv,true
테라 생맥주 피처 (3L),하이트진로,beer,4.6,3000,한국,20000,피처,csv,true
테라 생맥주 피처 (5L),하이트진로,beer,4.6,5000,한국,30000,대 피처,csv,true
# 켈리 생맥주
켈리 생맥주 (500ml),하이트진로,beer,4.5,500,한국,4500,잔,csv,true
켈리 생맥주 (1L),하이트진로,beer,4.5,1000,한국,8000,1L 잔,csv,true
켈리 생맥주 피처 (3L),하이트진로,beer,4.5,3000,한국,20000,피처,csv,true
# 클라우드 생 드래프트
클라우드 생 생맥주 (500ml),롯데칠성,beer,5.0,500,한국,4500,잔,csv,true
클라우드 생 생맥주 (1L),롯데칠성,beer,5.0,1000,한국,8000,1L 잔,csv,true
# 한맥 생맥주
한맥 생맥주 (500ml),오비맥주,beer,4.6,500,한국,4500,잔,csv,true
한맥 생맥주 (1L),오비맥주,beer,4.6,1000,한국,8000,1L 잔,csv,true
# 수입 생맥주
하이네켄 생맥주 (500ml),하이네켄,beer,5.0,500,네덜란드,5500,잔,csv,true
하이네켄 생맥주 (1L),하이네켄,beer,5.0,1000,네덜란드,9500,1L 잔,csv,true
아사히 수퍼드라이 생맥주 (500ml),아사히,beer,5.0,500,일본,5500,잔,csv,true
아사히 수퍼드라이 생맥주 (1L),아사히,beer,5.0,1000,일본,9500,1L 잔,csv,true
삿포로 생맥주 (500ml),삿포로,beer,5.0,500,일본,5500,잔,csv,true
삿포로 생맥주 (1L),삿포로,beer,5.0,1000,일본,9500,1L 잔,csv,true
기네스 드래프트 (1파인트 568ml),기네스,beer,4.2,568,아일랜드,9000,파인트 잔,csv,true
필스너 우르켈 생맥주 (500ml),Pilsner Urquell,beer,4.4,500,체코,5500,잔,csv,true
파울라너 생맥주 (500ml),Paulaner,beer,5.5,500,독일,6000,잔,csv,true
호가든 생맥주 (500ml),ABInBev,beer,4.9,500,벨기에,5500,잔,csv,true
스텔라 아르투아 생맥주 (500ml),ABInBev,beer,5.2,500,벨기에,5500,잔,csv,true
`;

export const PRESET_CATALOGS: CatalogPreset[] = [
  {
    id: 'step1_regional_soju',
    title: '1단계 · 지역소주',
    count: countRows(STEP1_REGIONAL_SOJU),
    csv: STEP1_REGIONAL_SOJU,
  },
  {
    id: 'step2_traditional',
    title: '2단계 · 전통주',
    count: countRows(STEP2_TRADITIONAL),
    csv: STEP2_TRADITIONAL,
  },
  {
    id: 'step3_makgeolli',
    title: '3단계 · 프리미엄 막걸리',
    count: countRows(STEP3_MAKGEOLLI),
    csv: STEP3_MAKGEOLLI,
  },
  {
    id: 'step4_korean_craft',
    title: '4단계 · 한국 수제맥주',
    count: countRows(STEP4_KOREAN_CRAFT_BEER),
    csv: STEP4_KOREAN_CRAFT_BEER,
  },
  {
    id: 'step5_imported_craft',
    title: '5단계 · 수입 크래프트',
    count: countRows(STEP5_IMPORTED_CRAFT_BEER),
    csv: STEP5_IMPORTED_CRAFT_BEER,
  },
  {
    id: 'step6_whiskey',
    title: '6단계 · 위스키 확장',
    count: countRows(STEP6_WHISKEY_EXPANSION),
    csv: STEP6_WHISKEY_EXPANSION,
  },
  {
    id: 'step7_sake_baijiu',
    title: '7단계 · 사케/바이주',
    count: countRows(STEP7_SAKE_BAIJIU),
    csv: STEP7_SAKE_BAIJIU,
  },
  {
    id: 'step8_mainstream',
    title: '8단계 · 대중 소주/맥주',
    count: countRows(STEP8_MAINSTREAM),
    csv: STEP8_MAINSTREAM,
  },
  {
    id: 'step9_wine',
    title: '9단계 · 와인',
    count: countRows(STEP9_WINE),
    csv: STEP9_WINE,
  },
  {
    id: 'step10_spirits',
    title: '10단계 · 양주/스피릿',
    count: countRows(STEP10_SPIRITS),
    csv: STEP10_SPIRITS,
  },
  {
    id: 'step11_draft_beer',
    title: '11단계 · 생맥주 (잔/피처)',
    count: countRows(STEP11_DRAFT_BEER),
    csv: STEP11_DRAFT_BEER,
  },
];

function countRows(csv: string): number {
  let n = 0;
  for (const line of csv.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    n++;
  }
  // 헤더 1줄 차감
  return Math.max(0, n - 1);
}
