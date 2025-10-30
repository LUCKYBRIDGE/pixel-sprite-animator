import React, { useState, useMemo, useRef } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { Creation } from './types';

interface StepIntroProps {
  onStart: (prompt: string, image?: File) => void;
  isLoading: boolean;
  initialName?: string;
  error?: string | null;
  onShowHistory: () => void;
  history: Creation[];
  onHistorySelect: (creation: Creation) => void;
}

interface Tag {
  name:string;
  category: 'figure' | 'role' | 'era' | 'topic' | 'style' | 'action' | 'item' | 'setting';
  description?: string;
  prompt_hint?: string;
  nationality?: 'Korean' | 'World';
  era_group?: string;
  sub_category?: string;
}

// Define a logical order for categories
const categoryOrder: Tag['category'][] = [
  'figure', 'role', 'era', 'setting', 'action', 'item', 'style', 'topic'
];

// Define a logical order for historical eras for sorting figures
const koreanEraOrder = [
    'Gojoseon', 'ThreeKingdoms_Goguryeo', 'ThreeKingdoms_Baekje', 'ThreeKingdoms_Silla',
    'UnifiedSilla', 'LaterThreeKingdoms', 'Goryeo', 'Joseon', 'Modern_Korea'
];
const worldEraOrder = [
    'Ancient_Egypt', 'Ancient_China', 'Ancient_Greece', 'Ancient_Rome', 'Medieval', 'Renaissance',
    'Enlightenment', 'Modern_World'
];

const itemSubCategoryOrder = [
    'Korean_Clothing', 'Korean_Props', 'Roman', 'Egyptian', 'Greek', 'Japanese', 'Scottish', 'Indian', 'European_Medieval', 'European_Renaissance', 'General_Weaponry', 'General_Academic', 'General_Royal', 'General_Misc'
];


const categoryDisplayNames: Record<Tag['category'], string> = {
  figure: '인물 (Figure)',
  role: '역할 (Role)',
  era: '시대 (Era)',
  setting: '배경 (Setting)',
  action: '행동 (Action)',
  item: '아이템 (Item)',
  style: '스타일 (Style)',
  topic: '주제 (Topic)',
};

const eraDisplayNames: Record<string, string> = {
    Gojoseon: '고조선',
    ThreeKingdoms_Goguryeo: '삼국시대 - 고구려',
    ThreeKingdoms_Baekje: '삼국시대 - 백제',
    ThreeKingdoms_Silla: '삼국시대 - 신라',
    UnifiedSilla: '통일신라',
    LaterThreeKingdoms: '후삼국시대',
    Goryeo: '고려',
    Joseon: '조선',
    Modern_Korea: '근현대',
    Ancient_Egypt: '고대 이집트',
    Ancient_China: '고대 중국',
    Ancient_Greece: '고대 그리스',
    Ancient_Rome: '고대 로마',
    Medieval: '중세',
    Renaissance: '르네상스',
    Enlightenment: '계몽주의',
    Modern_World: '근현대',
    Uncategorized: '기타'
};

const itemSubCategoryDisplayNames: Record<string, string> = {
    'Korean_Clothing': '한국 전통 의복 (Korean Clothing)',
    'Korean_Props': '한국 전통 소품 (Korean Props)',
    'Roman': '고대 로마 (Ancient Rome)',
    'Egyptian': '고대 이집트 (Ancient Egypt)',
    'Greek': '고대 그리스 (Ancient Greece)',
    'Japanese': '일본 (Japan)',
    'Scottish': '스코틀랜드 (Scotland)',
    'Indian': '인도 (India)',
    'European_Medieval': '유럽 중세 (Medieval Europe)',
    'European_Renaissance': '유럽 르네상스 (Renaissance Europe)',
    'General_Weaponry': '일반 무기류 (General Weaponry)',
    'General_Academic': '일반 학술/예술 (General Academic/Art)',
    'General_Royal': '일반 왕실 (General Royal)',
    'General_Misc': '기타 (Miscellaneous)',
};


const popularTags: Tag[] = ([
  // Figures (Korean)
  { name: '단군왕검', category: 'figure', nationality: 'Korean', era_group: 'Gojoseon', description: '고조선을 건국한 시조.' },
  { name: '광개토대왕', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Goguryeo', description: '고구려의 제19대 태왕. 영토를 크게 확장했습니다.' },
  { name: '연개소문', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Goguryeo', description: '고구려의 대막리지. 강력한 권력을 행사했습니다.' },
  { name: '을지문덕', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Goguryeo', description: '고구려의 장군. 살수대첩에서 수나라 군대를 크게 물리쳤습니다.' },
  { name: '주몽', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Goguryeo', description: '고구려를 건국한 시조, 동명성왕.' },
  { name: '계백', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Baekje', description: '백제의 장군. 황산벌 전투에서 신라군에 맞서 싸웠습니다.' },
  { name: '의자왕', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Baekje', description: '백제의 마지막 왕.' },
  { name: '김유신', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Silla', description: '신라의 장군. 삼국 통일에 큰 공을 세웠습니다.' },
  { name: '선덕여왕', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Silla', description: '신라 최초의 여왕. 첨성대를 건립했습니다.' },
  { name: '이사부', category: 'figure', nationality: 'Korean', era_group: 'ThreeKingdoms_Silla', description: '신라의 장군. 우산국(울릉도)을 정복했습니다.' },
  { name: '장보고', category: 'figure', nationality: 'Korean', era_group: 'UnifiedSilla', description: '통일신라 시대의 장군이자 해상 무역가. 청해진을 설치했습니다.' },
  { name: '궁예', category: 'figure', nationality: 'Korean', era_group: 'LaterThreeKingdoms', description: '후고구려를 세운 인물.' },
  { name: '견훤', category: 'figure', nationality: 'Korean', era_group: 'LaterThreeKingdoms', description: '후백제를 건국한 왕. 뛰어난 군사적 재능을 보였습니다.' },
  { name: '강감찬', category: 'figure', nationality: 'Korean', era_group: 'Goryeo', description: '고려 시대의 명장. 귀주대첩을 승리로 이끌었습니다.' },
  { name: '공민왕', category: 'figure', nationality: 'Korean', era_group: 'Goryeo', description: '고려의 제31대 왕. 개혁 정치를 추진했으며, 그림에도 능했습니다.' },
  { name: '서희', category: 'figure', nationality: 'Korean', era_group: 'Goryeo', description: '고려의 외교관. 거란과의 담판으로 강동 6주를 확보했습니다.' },
  { name: '왕건', category: 'figure', nationality: 'Korean', era_group: 'Goryeo', description: '고려를 건국한 초대 황제.' },
  { name: '이성계', category: 'figure', nationality: 'Korean', era_group: 'Goryeo', description: '조선을 건국한 초대 왕, 태조.' },
  { name: '정도전', category: 'figure', nationality: 'Korean', era_group: 'Goryeo', description: '조선 건국의 핵심 설계자이자 정치가.' },
  { name: '최영', category: 'figure', nationality: 'Korean', era_group: 'Goryeo', description: '고려 말기의 장군. "황금 보기를 돌같이 하라"는 명언으로 유명합니다.' },
  { name: '김홍도', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 후기의 화가. 서민들의 생활을 익살스럽게 표현한 풍속화로 유명합니다.' },
  { name: '명성황후', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 말기의 왕후이자 대한제국의 첫 황후.' },
  { name: '세종대왕', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선의 제4대 왕. 훈민정음을 창제했습니다.' },
  { name: '신사임당', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 시대의 예술가이자 율곡 이이의 어머니.' },
  { name: '이순신', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선의 장군. 임진왜란에서 수군을 이끌어 큰 공을 세웠습니다.' },
  { name: '이이', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선의 학자이자 정치가. 호는 율곡.' },
  { name: '이황', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선의 학자. 성리학 발전에 큰 영향을 미쳤습니다. 호는 퇴계.' },
  { name: '장영실', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 시대의 과학자. 측우기, 자격루 등 많은 발명품을 만들었습니다.' },
  { name: '전봉준', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '동학농민운동의 지도자.' },
  { name: '정조', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선의 제22대 왕. 규장각을 설치하고 수원 화성을 건설하는 등 개혁을 이끌었습니다.' },
  { name: '정약용', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 후기의 실학자. 목민심서, 경세유표 등을 저술했습니다.' },
  { name: '허난설헌', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 중기의 여성 시인. 섬세하고 애상적인 시를 남겼습니다.' },
  { name: '허준', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 시대의 의학자. 동의보감을 집필했습니다.' },
  { name: '흥선대원군', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 말기의 정치가. 고종의 아버지이자 섭정.' },
  { name: '황진이', category: 'figure', nationality: 'Korean', era_group: 'Joseon', description: '조선 시대의 유명한 기생이자 시인.' },
  { name: '김구', category: 'figure', nationality: 'Korean', era_group: 'Modern_Korea', description: '대한민국 임시정부의 주석. 독립운동가.' },
  { name: '안중근', category: 'figure', nationality: 'Korean', era_group: 'Modern_Korea', description: '독립운동가. 이토 히로부미를 저격했습니다.' },
  { name: '유관순', category: 'figure', nationality: 'Korean', era_group: 'Modern_Korea', description: '독립운동가. 3.1 운동의 상징적인 인물.' },
  { name: '윤동주', category: 'figure', nationality: 'Korean', era_group: 'Modern_Korea', description: '일제강점기의 시인. "서시", "별 헤는 밤" 등 아름다운 시를 남겼습니다.' },
  { name: '윤봉길', category: 'figure', nationality: 'Korean', era_group: 'Modern_Korea', description: '독립운동가. 상하이 홍커우 공원에서 폭탄을 투척했습니다.' },
  // Figures (World)
  { name: 'Tutankhamun', category: 'figure', nationality: 'World', era_group: 'Ancient_Egypt', description: '(한국어: 투탕카멘) 고대 이집트의 파라오. 거의 온전한 상태로 발견된 황금 가면과 무덤으로 유명합니다.' },
  { name: 'Qin Shi Huang', category: 'figure', nationality: 'World', era_group: 'Ancient_China', description: '(한국어: 진시황) 중국을 최초로 통일한 황제. 만리장성과 병마俑으로 잘 알려져 있습니다.' },
  { name: 'Confucius', category: 'figure', nationality: 'World', era_group: 'Ancient_China', description: '(한국어: 공자) 고대 중국의 사상가이자 철학자. 유교의 창시자.' },
  { name: 'Sun Tzu', category: 'figure', nationality: 'World', era_group: 'Ancient_China', description: '(한국어: 손자) 고대 중국의 장군이자 전략가. "손자병법"의 저자.' },
  { name: 'Alexander the Great', category: 'figure', nationality: 'World', era_group: 'Ancient_Greece', description: '(한국어: 알렉산더 대왕) 고대 그리스 마케도니아 왕국의 왕. 고대 세계 최대 제국 중 하나를 건설했습니다.' },
  { name: 'Archimedes', category: 'figure', nationality: 'World', era_group: 'Ancient_Greece', description: '(한국어: 아르키메데스) 고대 그리스의 수학자, 물리학자, 공학자, 천문학자이자 발명가.' },
  { name: 'Aristotle', category: 'figure', nationality: 'World', era_group: 'Ancient_Greece', description: '(한국어: 아리스토텔레스) 고대 그리스의 철학자. 플라톤의 제자이자 서양 철학의 거두.' },
  { name: 'Plato', category: 'figure', nationality: 'World', era_group: 'Ancient_Greece', description: '(한국어: 플라톤) 고대 그리스 아테네의 철학자. 서양 철학의 근간을 마련한 인물로 평가받습니다.' },
  { name: 'Socrates', category: 'figure', nationality: 'World', era_group: 'Ancient_Greece', description: '(한국어: 소크라테스) 고대 그리스 아테네의 철학자. 서양 철학의 창시자 중 한 명으로 꼽힙니다.' },
  { name: 'Cleopatra', category: 'figure', nationality: 'World', era_group: 'Ancient_Rome', description: '(한국어: 클레오파트라) 고대 이집트, 프톨레마이오스 왕국의 마지막 실질적 통치자.' },
  { name: 'Julius Caesar', category: 'figure', nationality: 'World', era_group: 'Ancient_Rome', description: '(한국어: 율리우스 카이사르) 로마의 장군이자 정치가. 로마 공화정의 몰락과 로마 제국의 부상에 결정적인 역할을 했습니다.' },
  { name: 'Genghis Khan', category: 'figure', nationality: 'World', era_group: 'Medieval', description: '(한국어: 칭기즈 칸) 몽골 제국의 창시자이자 초대 대칸.' },
  { name: 'Joan of Arc', category: 'figure', nationality: 'World', era_group: 'Medieval', description: '(한국어: 잔 다르크) 프랑스의 수호성인. 오를레앙 공성전에서 프랑스를 구한 영웅으로 존경받습니다.' },
  { name: 'Saladin', category: 'figure', nationality: 'World', era_group: 'Medieval', description: '(한국어: 살라딘) 아이유브 왕조의 창시자이자 초대 술탄. 제3차 십자군 전쟁의 주요 인물.' },
  { name: 'William Wallace', category: 'figure', nationality: 'World', era_group: 'Medieval', description: '(한국어: 윌리엄 월리스) 스코틀랜드의 기사. 제1차 스코틀랜드 독립 전쟁의 지도자 중 한 명.' },
  { name: 'Christopher Columbus', category: 'figure', nationality: 'World', era_group: 'Renaissance', description: '(한국어: 크리스토퍼 콜럼버스) 이탈리아의 탐험가이자 항해가. 스페인의 지원을 받아 대서양을 네 번 횡단했습니다.' },
  { name: 'Galileo Galilei', category: 'figure', nationality: 'World', era_group: 'Renaissance', description: '(한국어: 갈릴레오 갈릴레이) 이탈리아의 천문학자, 물리학자, 공학자. 현대 물리학과 천문학의 기초를 닦았습니다.' },
  { name: 'Leonardo da Vinci', category: 'figure', nationality: 'World', era_group: 'Renaissance', description: '(한국어: 레오나르도 다 빈치) 르네상스 시대 이탈리아의 천재. 화가, 소묘가, 공학자, 과학자, 조각가, 건축가로 활동했습니다.' },
  { name: 'Michelangelo', category: 'figure', nationality: 'World', era_group: 'Renaissance', description: '(한국어: 미켈란젤로) 르네상스 시대 이탈리아의 조각가, 화가, 건축가, 시인.' },
  { name: 'Queen Elizabeth I', category: 'figure', nationality: 'World', era_group: 'Renaissance', description: '(한국어: 엘리자베스 1세) 16세기 잉글랜드와 아일랜드의 여왕. 튜더 왕조의 마지막 군주입니다.' },
  { name: 'Shakespeare', category: 'figure', nationality: 'World', era_group: 'Renaissance', description: '(한국어: 셰익스피어) 영국의 극작가, 시인, 배우. 영어권에서 가장 위대한 작가로 널리 인정받습니다.' },
  { name: 'Beethoven', category: 'figure', nationality: 'World', era_group: 'Enlightenment', description: '(한국어: 베토벤) 독일의 작곡가이자 피아니스트. 고전주의와 낭만주의 시대의 전환을 이끈 중요 인물입니다.' },
  { name: 'Isaac Newton', category: 'figure', nationality: 'World', era_group: 'Enlightenment', description: '(한국어: 아이작 뉴턴) 영국의 수학자이자 물리학자. 현대 물리학의 원리를 개발했습니다.' },
  { name: 'Mozart', category: 'figure', nationality: 'World', era_group: 'Enlightenment', description: '(한국어: 모차르트) 고전주의 시대의 매우 영향력 있는 오스트리아의 작곡가.' },
  { name: 'Napoleon Bonaparte', category: 'figure', nationality: 'World', era_group: 'Enlightenment', description: '(한국어: 나폴레옹 보나파르트) 프랑스 혁명 시기에 활약한 프랑스의 군사 및 정치 지도자.' },
  { name: 'George Washington', category: 'figure', nationality: 'World', era_group: 'Enlightenment', description: '(한국어: 조지 워싱턴) 미국의 초대 대통령. 미국 독립 전쟁을 승리로 이끈 총사령관.' },
  { name: 'Abraham Lincoln', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 에이브러햄 링컨) 미국의 제16대 대통령. 남북전쟁으로 국가를 이끌고 노예제를 폐지했습니다.' },
  { name: 'Albert Einstein', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 알베르트 아인슈타인) 독일 태생의 이론 물리학자. 상대성 이론을 개발했습니다.' },
  { name: 'Florence Nightingale', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 플로렌스 나이팅게일) 영국의 사회 개혁가, 통계학자이자 현대 간호학의 창시자.' },
  { name: 'Frida Kahlo', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 프리다 칼로) 멕시코의 화가. 강렬한 자화상으로 유명합니다.' },
  { name: 'Mahatma Gandhi', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 마하트마 간디) 인도의 변호사이자 반식민주의 민족주의자. 비폭력 저항으로 인도의 독립을 이끌었습니다.' },
  { name: 'Marie Curie', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 마리 퀴리) 폴란드 출신의 프랑스 물리학자이자 화학자. 방사능에 대한 선구적인 연구를 수행했습니다.' },
  { name: 'Martin Luther King Jr.', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 마틴 루터 킹 주니어) 미국의 침례교 목사이자 활동가. 민권 운동의 저명한 지도자였습니다.' },
  { name: 'Nelson Mandela', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 넬슨 만델라) 남아프리카 공화국의 반아파르트헤이트 혁명가이자 정치 지도자. 남아공 최초의 대통령을 역임했습니다.' },
  { name: 'Nikola Tesla', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 니콜라 테슬라) 세르비아계 미국인 발명가이자 공학자. 현대 교류(AC) 전력 시스템 설계에 크게 기여했습니다.' },
  { name: 'Picasso', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 피카소) 스페인의 화가, 조각가, 판화가. 20세기 미술에 지대한 영향을 미쳤습니다.' },
  { name: 'Queen Victoria', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 빅토리아 여왕) 19세기 대영 제국의 전성기를 이끈 영국의 여왕.' },
  { name: 'Thomas Edison', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 토머스 에디슨) 미국의 발명가이자 사업가. 축음기, 전구 등 수많은 발명품을 남겼습니다.' },
  { name: 'Vincent van Gogh', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 빈센트 반 고흐) 네덜란드의 후기 인상파 화가. "별이 빛나는 밤", "해바라기" 등의 작품으로 유명합니다.' },
  { name: 'Winston Churchill', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 윈스턴 처칠) 영국의 정치가, 군인, 작가. 제2차 세계 대전 당시 영국 총리를 역임했습니다.' },
  { name: 'Wright brothers', category: 'figure', nationality: 'World', era_group: 'Modern_World', description: '(한국어: 라이트 형제) 세계 최초로 동력 비행기를 발명하고 비행에 성공한 미국의 항공 개척자 형제.' },
  // Roles - Alphabetical
  { name: '개혁가', category: 'role', description: '인물을 사회나 제도를 개혁하는 역할로 설정합니다.' },
  { name: '과학자', category: 'role', description: '인물을 과학 연구에 종사하는 역할로 설정합니다.' },
  { name: '군주', category: 'role', description: '인물을 세습된 최고 통치자(왕, 황제 등)로 설정합니다.' },
  { name: '독립운동가', category: 'role', description: '인물을 나라의 독립을 위해 싸우는 역할로 설정합니다.' },
  { name: '발명가', category: 'role', description: '인물을 새로운 것을 만들어내는 역할로 설정합니다.' },
  { name: '사상가', category: 'role', description: '인물을 깊이 있는 사유로 새로운 사상을 제시하는 역할로 설정합니다.' },
  { name: '소설가', category: 'role', description: '인물을 소설을 쓰는 작가의 역할로 설정합니다.' },
  { name: '시인', category: 'role', description: '인물을 시를 쓰는 예술가의 역할로 설정합니다.' },
  { name: '예술가', category: 'role', description: '인물을 창의적인 예술 활동을 하는 역할로 설정합니다.' },
  { name: '여왕', category: 'role', description: '인물을 국가를 다스리는 여성 군주로 설정합니다.' },
  { name: '왕', category: 'role', description: '인물을 국가를 다스리는 남성 군주로 설정합니다.' },
  { name: '외교관', category: 'role', description: '인물을 국제 관계에서 국가를 대표하는 역할로 설정합니다.' },
  { name: '의사', category: 'role', description: '인물을 질병을 치료하는 의사의 역할로 설정합니다.' },
  { name: '작곡가', category: 'role', description: '인물을 음악을 만드는 예술가의 역할로 설정합니다.' },
  { name: '장군', category: 'role', description: '인물을 군대를 지휘하는 역할로 설정합니다.' },
  { name: '정치인', category: 'role', description: '인물을 국가의 정책을 결정하고 실행하는 역할로 설정합니다.' },
  { name: '천문학자', category: 'role', description: '인물을 천체를 연구하는 과학자의 역할로 설정합니다.' },
  { name: '철학자', category: 'role', description: '인물을 인간과 세계의 근본 원리를 탐구하는 역할로 설정합니다.' },
  { name: '탐험가', category: 'role', description: '인물을 미지의 세계를 탐험하는 역할로 설정합니다.' },
  { name: '학자', category: 'role', description: '인물을 학문을 깊이 연구하는 역할로 설정합니다.' },
  { name: '혁명가', category: 'role', description: '인물을 사회 체제를 급진적으로 바꾸려는 역할로 설정합니다.' },
  { name: '화가', category: 'role', description: '인물을 그림을 그리는 예술가의 역할로 설정합니다.' },
  { name: '황제', category: 'role', description: '인물을 제국을 다스리는 최고 통치자로 설정합니다.' },
  { name: '황후', category: 'role', description: '인물을 황제의 아내 역할로 설정합니다.' },
  // Eras - Chronological
  { name: '고대 그리스', category: 'era', description: '시대적 배경을 고대 그리스 문명 시대로 설정합니다.' },
  { name: '고조선', category: 'era', description: '시대적 배경을 한국 최초의 국가인 고조선으로 설정합니다.' },
  { name: '삼국시대', category: 'era', description: '시대적 배경을 고구려, 백제, 신라가 경쟁하던 시대로 설정합니다.' },
  { name: '고구려', category: 'era', description: '시대적 배경을 삼국시대의 고구려로 설정합니다.' },
  { name: '백제', category: 'era', description: '시대적 배경을 삼국시대의 백제로 설정합니다.' },
  { name: '신라', category: 'era', description: '시대적 배경을 삼국시대의 신라로 설정합니다.' },
  { name: '발해', category: 'era', description: '시대적 배경을 고구려 유민이 세운 발해로 설정합니다.' },
  { name: '통일신라', category: 'era', description: '시대적 배경을 신라가 삼국을 통일한 이후의 시대로 설정합니다.' },
  { name: '후삼국시대', category: 'era', description: '시대적 배경을 통일신라 말기, 고려 건국 이전의 시대로 설정합니다.' },
  { name: '고려', category: 'era', description: '시대적 배경을 왕건이 세운 고려 시대로 설정합니다.' },
  { name: '조선', category: 'era', description: '시대적 배경을 이성계가 세운 조선 시대로 설정합니다.' },
  { name: '일제강점기', category: 'era', description: '시대적 배경을 일본 제국주의에 의해 국권을 상실했던 시기로 설정합니다.' },
  { name: '근현대사', category: 'era', description: '시대적 배경을 개항기 이후부터 현대까지의 시기로 설정합니다.' },
  { name: '로마 제국', category: 'era', description: '시대적 배경을 고대 로마 제국 시대로 설정합니다.' },
  { name: '중세', category: 'era', description: '시대적 배경을 서로마 제국 멸망 후 르네상스 이전까지의 유럽 시대로 설정합니다.' },
  { name: '르네상스', category: 'era', description: '시대적 배경을 14~16세기 유럽의 문예 부흥기로 설정합니다.' },
  { name: '대항해시대', category: 'era', description: '시대적 배경을 15~17세기 유럽의 신항로 개척 시대로 설정합니다.' },
  { name: '산업 혁명', category: 'era', description: '시대적 배경을 18~19세기 기술 혁신과 사회 변화가 일어난 시기로 설정합니다.' },
  { name: '빅토리아 시대', category: 'era', description: '시대적 배경을 19세기 영국 빅토리아 여왕의 통치 시기로 설정합니다.' },
  { name: '세계 대전', category: 'era', description: '시대적 배경을 제1차 또는 제2차 세계 대전이 일어난 시기로 설정합니다.' },
  { name: '냉전', category: 'era', description: '시대적 배경을 제2차 세계 대전 후 미국과 소련 중심의 대립 시기로 설정합니다.' },
  // Topics - Thematic
  { name: '한국사', category: 'topic', description: '초상화의 주제를 한국 역사에 맞춥니다.' },
  { name: '세계사', category: 'topic', description: '초상화의 주제를 세계 역사에 맞춥니다.' },
  { name: '미술사', category: 'topic', description: '초상화의 주제를 미술사에 등장하는 인물이나 화풍에 맞춥니다.' },
  { name: '과학사', category: 'topic', description: '초상화의 주제를 과학사에 등장하는 인물이나 발명품에 맞춥니다.' },
  { name: '전쟁사', category: 'topic', description: '초상화의 주제를 전쟁사에 등장하는 인물이나 장면에 맞춥니다.' },
  // Style - Visual
  { name: '디지털 일러스트', category: 'style', description: '초상화를 현대적인 디지털 일러스트레이션 스타일로 그립니다.' },
  { name: '동양화', category: 'style', description: '초상화를 전통 동양화(수묵화, 채색화 등) 스타일로 그립니다.' },
  { name: '만화 스타일', category: 'style', description: '초상화를 만화나 웹툰 스타일로 그립니다.' },
  { name: '빈티지 사진', category: 'style', description: '초상화를 오래된 빈티지 사진처럼 표현합니다.' },
  { name: '사실주의', category: 'style', description: '초상화를 현실과 같이 매우 사실적으로 그립니다.' },
  { name: '서양화', category: 'style', description: '초상화를 전통 서양화(유화, 수채화 등) 스타일로 그립니다.' },
  { name: '세피아', category: 'style', description: '초상화를 갈색 톤의 세피아 색감으로 표현합니다.' },
  { name: '수채화', category: 'style', description: '초상화를 맑고 투명한 느낌의 수채화 스타일로 그립니다.' },
  { name: '스케치', category: 'style', description: '초상화를 연필이나 펜으로 그린 스케치처럼 표현합니다.' },
  { name: '애니메이션 스타일', category: 'style', description: '초상화를 일본 애니메이션이나 카툰 스타일로 그립니다.' },
  { name: '유화', category: 'style', description: '초상화를 유화 물감의 질감이 느껴지는 스타일로 그립니다.' },
  { name: '컨셉 아트', category: 'style', description: '초상화를 게임이나 영화의 컨셉 아트 스타일로 그립니다.' },
  { name: '한국화', category: 'style', description: '초상화를 먹의 농담과 번짐을 활용한 한국 전통 수묵화 스타일로 그립니다.' },
  { name: '흑백', category: 'style', description: '초상화를 흑백으로 표현합니다.' },
  // Action - Pose/Activity
  { name: '군대를 이끄는', category: 'action', description: '인물이 군대를 이끌고 지휘하는 모습을 묘사합니다.' },
  { name: '글쓰는', category: 'action', description: '인물이 붓이나 펜으로 글을 쓰는 모습을 묘사합니다.' },
  { name: '그림 그리는', category: 'action', description: '인물이 그림을 그리는 모습을 묘사합니다.' },
  { name: '독서하는', category: 'action', description: '인물이 책을 읽고 있는 모습을 묘사합니다.' },
  { name: '말 타는', category: 'action', description: '인물이 말을 타고 있는 모습을 묘사합니다.' },
  { name: '명상하는', category: 'action', description: '인물이 명상에 잠겨 있는 모습을 묘사합니다.' },
  { name: '생각하는 자세', category: 'action', description: '인물이 깊은 생각에 잠겨 있는 자세를 묘사합니다.' },
  { name: '실험하는', category: 'action', description: '인물이 과학 실험을 하고 있는 모습을 묘사합니다.' },
  { name: '연설하는', category: 'action', description: '인물이 대중 앞에서 연설하는 모습을 묘사합니다.' },
  { name: '전신샷', category: 'action', description: '인물의 머리부터 발끝까지 전체 모습을 묘사합니다.' },
  { name: '전투 자세', category: 'action', description: '인물이 무기를 들고 전투에 임하는 자세를 묘사합니다.' },
  { name: '지휘하는', category: 'action', description: '인물이 군대나 오케스트라 등을 지휘하는 모습을 묘사합니다.' },
  { name: '초상화', category: 'action', description: '인물의 얼굴이나 상반신을 중심으로 한 정적인 자세를 묘사합니다.' },
  { name: '협상하는', category: 'action', description: '인물이 외교적인 협상을 하는 모습을 묘사합니다.' },
  // Items
  { name: '갑옷', category: 'item', sub_category: 'General_Weaponry', description: '인물에게 시대와 문화에 맞는 갑옷을 입힙니다. 예를 들어, 이순신에게는 조선 시대 갑옷을, 시저에게는 로마 군단병 갑옷을 적용합니다.' },
  { name: '검', category: 'item', sub_category: 'General_Weaponry', description: '인물이 검을 들고 있도록 합니다. 인물의 문화권에 맞는 형태의 검이 적용됩니다.' },
  { name: '투구', category: 'item', sub_category: 'General_Weaponry', description: '인물에게 전투 시 머리를 보호하기 위한 투구를 씌웁니다. 갑옷 태그와 함께 사용하면 좋습니다.' },
  { name: '활', category: 'item', sub_category: 'General_Weaponry', description: '인물이 활을 들고 있거나 메고 있도록 합니다.' },
  { name: '책', category: 'item', sub_category: 'General_Academic', description: '인물이 책을 들고 있거나 주변에 책을 배치합니다.' },
  { name: '붓', category: 'item', sub_category: 'General_Academic', description: '인물이 글씨를 쓰거나 그림을 그리는 붓을 들고 있도록 합니다.' },
  { name: '두루마리', category: 'item', sub_category: 'General_Academic', description: '인물이 고서나 문서가 적힌 두루마리를 들고 있도록 합니다.' },
  { name: '문서', category: 'item', sub_category: 'General_Academic', description: '인물이 외교 문서나 조약문 등을 들고 있도록 합니다.' },
  { name: '지도', category: 'item', sub_category: 'General_Academic', description: '인물이 지도를 보거나 들고 있도록 합니다.' },
  { name: '지구본', category: 'item', sub_category: 'General_Academic', description: '인물 옆에 지구본을 배치합니다.' },
  { name: '현미경', category: 'item', sub_category: 'General_Academic', description: '인물 옆에 현미경을 배치합니다.' },
  { name: '망원경', category: 'item', sub_category: 'General_Academic', description: '인물이 망원경을 들고 있거나 옆에 있도록 합니다.' },
  { name: '피아노', category: 'item', sub_category: 'General_Academic', description: '인물 옆에 피아노를 배치합니다. 작곡가나 음악가와 잘 어울립니다.' },
  { name: '왕관', category: 'item', sub_category: 'General_Royal', description: '인물에게 왕이나 여왕의 권위를 상징하는 왕관을 씌웁니다.' },
  { name: '왕좌', category: 'item', sub_category: 'General_Royal', description: '인물을 왕의 자리인 왕좌에 앉힙니다.' },
  { name: '왕홀', category: 'item', sub_category: 'General_Royal', description: '인물이 왕의 권위를 상징하는 홀(scepter)을 들고 있도록 합니다.' },
  { name: '옥새', category: 'item', sub_category: 'General_Royal', description: '인물에게 왕의 권위를 상징하는 옥새를 추가합니다.' },
  { name: '망토', category: 'item', sub_category: 'General_Misc', description: '인물에게 망토를 추가하여 위엄을 더합니다.' },
  { name: '안경', category: 'item', sub_category: 'General_Misc', description: '인물에게 안경을 씌웁니다. 시대에 맞는 디자인이 적용될 수 있습니다.' },
  { name: '나침반', category: 'item', sub_category: 'General_Misc', description: '인물에게 탐험이나 항해를 상징하는 나침반을 추가합니다.' },
  { name: '한복', category: 'item', sub_category: 'Korean_Clothing', description: '인물에게 한국의 전통 의상인 한복을 입힙니다. 인물의 시대와 신분에 맞는 종류의 한복이 적용됩니다.' },
  { name: '곤룡포', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Gollyongpo, the formal robe for kings of the Joseon Dynasty', description: '조선시대 왕의 공식 업무복인 곤룡포를 입힙니다. \'왕\' 또는 \'황제\' 역할 태그와 함께 사용하면 효과적입니다.' },
  { name: '면복', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Myeonbok, the highest-ranking ceremonial robe for a Joseon King, worn for ancestral rites', description: '조선시대 국왕이 종묘, 사직 등 국가의 가장 중요한 제사를 지낼 때 입던 최고 등급의 예복.' },
  { name: '단령', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Dallyeong, a formal robe with a rounded collar for civil and military officials of the Goryeo-Joseon period', description: '고려-조선 시대 문무백관이 입던 대표적인 공복. 깃이 둥근 형태가 특징입니다.' },
  { name: '조선 관복', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'official uniform for government officials of the Joseon Dynasty', description: '조선시대 관리들이 입던 공적인 의복. 품계에 따라 색과 장식이 달랐습니다.' },
  { name: '구군복', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Gugunbok, a military uniform for Joseon officers', description: '조선시대 무관들이 입던 군복. 전립, 동다리, 전대 등으로 구성됩니다.' },
  { name: '앵삼', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Aengsam, a yellow ceremonial robe for scholars who passed the state examination in Joseon', description: '조선시대 과거 급제자들이 입던 노란색 예복. 학자 캐릭터와 잘 어울립니다.' },
  { name: '심의', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Simui, a white robe for Confucian scholars in the Goryeo-Joseon period', description: '고려-조선 시대 유학자들이 입던 흰색의 학자복. 도포와 비슷하지만 더 간소한 형태입니다.' },
  { name: '도포', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Dopo, a formal overcoat for scholars and officials in the Joseon Dynasty', description: '조선시대 선비나 관료들이 입던 공식적인 외출복인 도포를 입힙니다. 학자나 정치인 역할과 잘 어울립니다.' },
  { name: '철릭', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Cheollik, a pleated robe for military officials in the Joseon Dynasty', description: '조선시대 무관들이 입던 관복. 허리에 주름이 잡힌 독특한 형태의 옷으로, 장군 캐릭터와 잘 어울립니다.' },
  { name: '두루마기', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Durumagi, a traditional Korean men\'s overcoat', description: '한국 전통 남성 외투인 두루마기를 입힙니다. 시대와 인물의 신분에 따라 적절한 형태가 적용됩니다.' },
  { name: '당의', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Dangui, a ceremonial upper garment for high-ranking women of the Joseon court', description: '조선시대 왕비, 공주, 상궁 등 높은 지위의 여성들이 입던 예복. 저고리 위에 덧입는 옷입니다.' },
  { name: '활옷', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Hwarot, a highly decorated ceremonial robe for princesses or for commoners\' weddings in the Joseon Dynasty', description: '주로 조선시대 공주나 옹주의 대례복이자 서민의 혼례복으로 사용된 화려한 옷입니다.' },
  { name: '원삼', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Wonsam, a ceremonial overcoat for women in the Joseon Dynasty, with colors varying by rank', description: '조선시대 왕비부터 서민까지 신분에 따라 색과 문양을 달리하여 입었던 여성용 예복입니다.' },
  { name: '갓', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Gat, a traditional Korean hat worn by men of the Joseon Dynasty', description: '조선시대 남성, 특히 양반들이 쓰던 전통 모자인 갓을 씌웁니다. 인물의 신분과 시대에 맞는 스타일이 적용됩니다.' },
  { name: '익선관', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'Ikseongwan, the formal winged crown for Joseon kings', description: '인물에게 조선시대 왕이 쓰던 익선관을 씌웁니다.' },
  { name: '가체', category: 'item', sub_category: 'Korean_Props', prompt_hint: 'Gache, a large, elaborate wig worn by women of the Joseon Dynasty', description: '조선시대 여성들이 사용하던 머리 장식인 가체를 추가합니다. 인물의 신분에 맞는 스타일이 적용됩니다.' },
  { name: '비녀', category: 'item', sub_category: 'Korean_Props', prompt_hint: 'Binyeo, a traditional Korean hairpin', description: '인물에게 전통적인 머리 장신구인 비녀를 추가합니다.' },
  { name: '족두리', category: 'item', sub_category: 'Korean_Props', prompt_hint: 'Jokduri, a traditional Korean ceremonial coronet for women', description: '전통 혼례나 행사 때 여성들이 머리에 쓰던 관.' },
  { name: '가야금', category: 'item', sub_category: 'Korean_Props', description: '인물에게 한국 전통 현악기인 가야금을 추가합니다.' },
  { name: '부채', category: 'item', sub_category: 'Korean_Props', description: '인물이 전통적인 부채를 들고 있도록 합니다.' },
  { name: '병풍', category: 'item', sub_category: 'Korean_Props', description: '인물의 배경에 전통적인 병풍을 배치합니다.' },
  { name: '측우기', category: 'item', sub_category: 'Korean_Props', prompt_hint: 'Cheugugi, a Joseon-era rain gauge', description: '인물 옆에 조선시대의 강우량 측정 기구인 측우기를 배치합니다.' },
  { name: '고려 관복', category: 'item', sub_category: 'Korean_Clothing', prompt_hint: 'the official uniform for government officials of the Goryeo Dynasty', description: '고려시대 관리들이 입던 공적인 의복. 시대와 직급에 따라 형태가 달랐습니다.' },
  { name: '신라 금관', category: 'item', sub_category: 'Korean_Props', prompt_hint: 'a highly ornate golden crown from the Silla Kingdom', description: '신라 시대 왕들이 사용했던 화려한 금관. 경주 고분에서 출토되었습니다.' },
  { name: '토가', category: 'item', sub_category: 'Roman', prompt_hint: 'Toga, the formal garment of ancient Roman citizens', description: '고대 로마 시민들이 입던 공식적인 의상인 토가를 입힙니다. 로마 시대 인물에게 적합합니다.' },
  { name: '스톨라', category: 'item', sub_category: 'Roman', prompt_hint: 'Stola, the traditional long dress of ancient Roman women', description: '고대 로마 여성들이 입던 전통적인 긴 드레스.' },
  { name: '로리카 세그멘타타', category: 'item', sub_category: 'Roman', prompt_hint: 'Lorica Segmentata, the iconic plate armor of Roman legionaries', description: '로마 군단병이 입었던 판금 갑옷. 여러 개의 금속판을 겹쳐 만들었습니다.' },
  { name: '네메스', category: 'item', sub_category: 'Egyptian', prompt_hint: 'Nemes, the striped headcloth worn by pharaohs in Ancient Egypt', description: '고대 이집트 파라오가 쓰던 줄무늬 머리쓰개. 투탕카멘의 황금 가면으로 유명합니다.' },
  { name: '칼라시리스', category: 'item', sub_category: 'Egyptian', prompt_hint: 'Kalasiris, a simple sheath dress worn by women in Ancient Egypt', description: '고대 이집트 여성들이 입던 단순한 형태의 긴 드레스.' },
  { name: '셴딧', category: 'item', sub_category: 'Egyptian', prompt_hint: 'Shendyt, a kilt-like garment worn by men in Ancient Egypt', description: '고대 이집트 남성들이 허리에 둘렀던 짧은 치마 형태의 옷.' },
  { name: '키톤', category: 'item', sub_category: 'Greek', prompt_hint: 'Chiton, a basic garment worn by both men and women in Ancient Greece', description: '고대 그리스 남녀가 입던 기본적인 의상인 키톤을 입힙니다. 그리스 철학자나 시민에게 적합합니다.' },
  { name: '기모노', category: 'item', sub_category: 'Japanese', prompt_hint: 'Kimono, the traditional garment of Japan', description: '일본의 전통 의상인 기모노를 입힙니다. 일본 시대 인물에게 적합합니다.' },
  { name: '사리', category: 'item', sub_category: 'Indian', prompt_hint: 'Sari, the traditional garment of women in India', description: '인도의 전통 여성 의상인 사리를 입힙니다. 인도 인물과 잘 어울립니다.' },
  { name: '터번', category: 'item', sub_category: 'Indian', prompt_hint: 'Turban, a type of headwear based on cloth winding', description: '인물에게 터번을 씌웁니다. 중동, 인도 등 다양한 문화권의 인물에게 적용할 수 있습니다.' },
  { name: '킬트', category: 'item', sub_category: 'Scottish', prompt_hint: 'Kilt, the traditional garment of men in Scotland', description: '스코틀랜드의 전통 남성 의상인 킬트를 입힙니다. 윌리엄 월리스와 잘 어울립니다.' },
  { name: '사슬 갑옷', category: 'item', sub_category: 'European_Medieval', prompt_hint: 'Chainmail, armor made of interlinked metal rings, common in medieval Europe', description: '작은 금속 고리를 엮어 만든 갑옷. 중세 기사들이 주로 사용했습니다.' },
  { name: '판금 갑옷', category: 'item', sub_category: 'European_Medieval', prompt_hint: 'Plate armor, full body armor made of metal plates, iconic of late medieval knights', description: '전신을 보호하기 위해 금속판으로 만든 갑옷. 중세 후기 기사들의 상징입니다.' },
  { name: '튜닉', category: 'item', sub_category: 'European_Medieval', prompt_hint: 'Tunic, a basic upper garment worn in medieval Europe', description: '중세 유럽에서 남녀노소 입었던 기본적인 상의. 길이나 소매 형태로 신분을 나타내기도 했습니다.' },
  { name: '더블릿', category: 'item', sub_category: 'European_Renaissance', prompt_hint: 'Doublet, a short, close-fitting jacket worn by men during the Renaissance', description: '르네상스 시대 남성들이 입던 짧고 꼭 맞는 상의.' },
  { name: '러프 칼라', category: 'item', sub_category: 'European_Renaissance', prompt_hint: 'Ruff collar, a large, pleated collar popular in the Renaissance era', description: '르네상스 시대에 유행했던 주름 장식의 큰 옷깃.' },
  { name: '로브', category: 'item', sub_category: 'General_Misc', description: '인물에게 학자나 마법사 등이 입는 로브를 입힙니다.' },
  // Setting - Background/Environment
  { name: '고대 신전', category: 'setting', description: '배경을 고대 그리스나 로마 양식의 신전으로 설정합니다.' },
  { name: '궁전', category: 'setting', description: '배경을 화려한 궁전의 내부나 외부로 설정합니다.' },
  { name: '대장간', category: 'setting', description: '배경을 무기나 도구를 만드는 대장간으로 설정합니다.' },
  { name: '서재', category: 'setting', description: '배경을 책이 가득한 서재로 설정합니다.' },
  { name: '실험실', category: 'setting', description: '배경을 과학 실험 도구가 있는 실험실로 설정합니다.' },
  { name: '왕좌의 방', category: 'setting', 'description': '배경을 왕좌가 놓인 방으로 설정합니다.' },
  { name: '전통 가옥', category: 'setting', description: '배경을 한옥과 같은 전통 가옥으로 설정합니다.' },
  { name: '전쟁터', category: 'setting', description: '배경을 치열한 전투가 벌어지는 전쟁터로 설정합니다.' },
  { name: '항해하는 배', category: 'setting', description: '배경을 바다 위를 항해하는 배의 갑판으로 설정합니다.' },
] as Tag[]).sort((a, b) => {
  // 1. Sort by main category order
  const categoryAIndex = categoryOrder.indexOf(a.category);
  const categoryBIndex = categoryOrder.indexOf(b.category);
  if (categoryAIndex !== categoryBIndex) {
    return categoryAIndex - categoryBIndex;
  }

  // 2. Apply special sorting for 'figure' category
  if (a.category === 'figure' && b.category === 'figure') {
    // 2a. Group by nationality (Korean first)
    if (a.nationality !== b.nationality) {
      return a.nationality === 'Korean' ? -1 : 1;
    }

    // 2b. Inside nationality, sort by era group
    let eraAIndex = -1;
    let eraBIndex = -1;
    if (a.nationality === 'Korean') {
      eraAIndex = koreanEraOrder.indexOf(a.era_group || '');
      eraBIndex = koreanEraOrder.indexOf(b.era_group || '');
    } else { // World figures
      eraAIndex = worldEraOrder.indexOf(a.era_group || '');
      eraBIndex = worldEraOrder.indexOf(b.era_group || '');
    }
    if (eraAIndex !== eraBIndex) {
        // Handle cases where an era might not be in the list
        if (eraAIndex === -1) return 1;
        if (eraBIndex === -1) return -1;
        return eraAIndex - eraBIndex;
    }
  }

  // 3. Default alphabetical sort for all other cases (and within the same figure era group)
  return a.name.localeCompare(b.name, 'ko');
});

const categoryColors: Record<Tag['category'], string> = {
  figure: 'bg-sky-600 hover:bg-sky-500',
  role: 'bg-teal-600 hover:bg-teal-500',
  era: 'bg-amber-600 hover:bg-amber-500',
  topic: 'bg-indigo-600 hover:bg-indigo-500',
  style: 'bg-pink-600 hover:bg-pink-500',
  action: 'bg-orange-600 hover:bg-orange-500',
  item: 'bg-lime-600 hover:bg-lime-500',
  setting: 'bg-green-600 hover:bg-green-500',
};

const figureContext: Record<string, { era: string[], role: string[], recommendations?: string[] }> = {
  // Korean Figures
  '강감찬': { era: ['고려'], role: ['장군'], recommendations: ['장군', '고려', '갑옷', '말 타는'] },
  '견훤': { era: ['후삼국시대', '백제'], role: ['왕', '장군'], recommendations: ['왕', '장군', '갑옷', '검', '말 타는'] },
  '계백': { era: ['백제', '삼국시대'], role: ['장군'], recommendations: ['장군', '백제', '갑옷', '전투 자세'] },
  '공민왕': { era: ['고려'], role: ['왕', '예술가'], recommendations: ['왕', '고려', '왕좌', '그림 그리는'] },
  '광개토대왕': { era: ['고구려', '삼국시대'], role: ['왕', '황제'], recommendations: ['왕', '황제', '고구려', '갑옷', '검', '말 타는'] },
  '궁예': { era: ['후삼국시대'], role: ['왕'], recommendations: ['왕', '왕좌'] },
  '김구': { era: ['일제강점기', '근현대사'], role: ['독립운동가', '정치인'], recommendations: ['독립운동가', '정치인', '일제강점기', '근현대사', '두루마기', '안경'] },
  '김홍도': { era: ['조선'], role: ['화가', '예술가'], recommendations: ['화가', '조선', '한복', '그림 그리는', '붓'] },
  '김유신': { era: ['신라', '통일신라', '삼국시대'], role: ['장군'], recommendations: ['장군', '신라', '갑옷', '검'] },
  '단군왕검': { era: ['고조선'], role: ['왕'], recommendations: ['왕', '고조선'] },
  '명성황후': { era: ['조선', '근현대사'], role: ['황후', '여왕'], recommendations: ['황후', '조선', '한복', '궁전'] },
  '서희': { era: ['고려'], role: ['정치인', '학자', '외교관'], recommendations: ['외교관', '고려', '협상하는', '문서'] },
  '선덕여왕': { era: ['신라', '삼국시대'], role: ['여왕'], recommendations: ['여왕', '신라', '신라 금관', '왕좌'] },
  '세종대왕': { era: ['조선'], role: ['왕'], recommendations: ['왕', '조선', '곤룡포', '익선관', '왕좌', '책', '글쓰는'] },
  '신사임당': { era: ['조선'], role: ['예술가', '화가', '학자'], recommendations: ['예술가', '조선', '한복', '그림 그리는'] },
  '안중근': { era: ['일제강점기', '근현대사'], role: ['독립운동가'], recommendations: ['독립운동가', '일제강점기'] },
  '연개소문': { era: ['고구려', '삼국시대'], role: ['장군', '정치인'], recommendations: ['장군', '정치인', '고구려', '갑옷'] },
  '왕건': { era: ['고려'], role: ['왕', '황제'], recommendations: ['왕', '황제', '고려', '왕좌', '곤룡포'] },
  '의자왕': { era: ['백제', '삼국시대'], role: ['왕'], recommendations: ['왕', '백제', '궁전'] },
  '을지문덕': { era: ['고구려', '삼국시대'], role: ['장군'], recommendations: ['장군', '고구려', '갑옷', '말 타는'] },
  '유관순': { era: ['일제강점기', '근현대사'], role: ['독립운동가'], recommendations: ['독립운동가', '일제강점기', '근현대사'] },
  '윤동주': { era: ['일제강점기', '근현대사'], role: ['시인'], recommendations: ['시인', '일제강점기', '책', '글쓰는', '생각하는 자세'] },
  '윤봉길': { era: ['일제강점기', '근현대사'], role: ['독립운동가'], recommendations: ['독립운동가', '일제강점기'] },
  '이사부': { era: ['신라', '삼국시대'], role: ['장군'], recommendations: ['장군', '신라', '갑옷', '검', '항해하는 배'] },
  '이성계': { era: ['고려', '조선'], role: ['장군', '왕'], recommendations: ['왕', '장군', '조선', '활', '말 타는'] },
  '이이': { era: ['조선'], role: ['학자', '정치인'], recommendations: ['학자', '조선', '책', '도포', '심의'] },
  '이황': { era: ['조선'], role: ['학자'], recommendations: ['학자', '조선', '책', '도포', '심의'] },
  '장보고': { era: ['통일신라'], role: ['장군'], recommendations: ['장군', '통일신라', '항해하는 배', '검'] },
  '장영실': { era: ['조선'], role: ['과학자', '발명가'], recommendations: ['과학자', '조선', '측우기', '한복'] },
  '전봉준': { era: ['조선'], role: ['혁명가'], recommendations: ['혁명가', '조선', '한복'] },
  '정도전': { era: ['고려', '조선'], role: ['학자', '정치인'], recommendations: ['학자', '정치인', '조선', '책', '글쓰는'] },
  '정조': { era: ['조선'], role: ['왕', '개혁가'], recommendations: ['왕', '조선', '개혁가', '책', '곤룡포', '서재'] },
  '정약용': { era: ['조선'], role: ['학자'], recommendations: ['학자', '조선', '책', '글쓰는', '도포'] },
  '주몽': { era: ['고구려', '삼국시대'], role: ['왕'], recommendations: ['왕', '고구려', '활'] },
  '최영': { era: ['고려'], role: ['장군'], recommendations: ['장군', '고려', '갑옷'] },
  '허난설헌': { era: ['조선'], role: ['시인'], recommendations: ['시인', '조선', '한복', '책', '글쓰는'] },
  '허준': { era: ['조선'], role: ['의사'], recommendations: ['의사', '조선', '책', '한복'] },
  '흥선대원군': { era: ['조선', '근현대사'], role: ['정치인'], recommendations: ['정치인', '조선', '한복'] },
  '황진이': { era: ['조선'], role: ['시인', '예술가'], recommendations: ['시인', '예술가', '조선', '한복', '가야금'] },
  // World Figures
  'Abraham Lincoln': { era: ['근현대사'], role: ['정치인'], recommendations: ['정치인', '연설하는'] },
  'Albert Einstein': { era: ['근현대사'], role: ['과학자'], recommendations: ['과학자', '실험실', '생각하는 자세'] },
  'Alexander the Great': { era: ['고대 그리스'], role: ['왕', '장군'], recommendations: ['왕', '장군', '고대 그리스', '말 타는', '갑옷'] },
  'Archimedes': { era: ['고대 그리스'], role: ['과학자', '학자', '발명가'], recommendations: ['과학자', '고대 그리스', '두루마리', '생각하는 자세'] },
  'Aristotle': { era: ['고대 그리스'], role: ['철학자', '학자'], recommendations: ['철학자', '고대 그리스', '책', '키톤'] },
  'Beethoven': { era: ['근현대사'], role: ['작곡가', '예술가'], recommendations: ['작곡가', '예술가', '피아노'] },
  'Christopher Columbus': { era: ['대항해시대', '르네상스'], role: ['탐험가'], recommendations: ['탐험가', '대항해시대', '항해하는 배', '지도', '나침반'] },
  'Cleopatra': { era: ['로마 제국'], role: ['여왕'], recommendations: ['여왕', '로마 제국', '왕좌', '칼라시리스'] },
  'Confucius': { era: [], role: ['철학자', '사상가'], recommendations: ['철학자', '책', '로브'] },
  'Florence Nightingale': { era: ['빅토리아 시대'], role: ['의사'], recommendations: ['의사', '빅토리아 시대'] },
  'Frida Kahlo': { era: ['근현대사'], role: ['화가', '예술가'], recommendations: ['화가', '예술가', '그림 그리는'] },
  'Galileo Galilei': { era: ['르네상스'], role: ['과학자', '천문학자'], recommendations: ['과학자', '천문학자', '르네상스', '망원경', '책'] },
  'Genghis Khan': { era: ['중세'], role: ['황제', '장군'], recommendations: ['황제', '장군', '중세', '말 타는', '활', '갑옷'] },
  'George Washington': { era: ['계몽주의', '근현대사'], role: ['장군', '정치인'], recommendations: ['장군', '정치인', '말 타는'] },
  'Isaac Newton': { era: ['르네상스', '근현대사'], role: ['과학자', '천문학자'], recommendations: ['과학자', '천문학자', '책'] },
  'Joan of Arc': { era: ['중세'], role: [], recommendations: ['장군', '중세', '갑옷', '판금 갑옷', '검'] },
  'Julius Caesar': { era: ['로마 제국'], role: ['정치인', '장군'], recommendations: ['장군', '정치인', '로마 제국', '토가'] },
  'Leonardo da Vinci': { era: ['르네상스'], role: ['화가', '발명가', '과학자'], recommendations: ['화가', '발명가', '르네상스', '그림 그리는', '실험하는'] },
  'Mahatma Gandhi': { era: ['근현대사'], role: ['정치인', '사상가'], recommendations: ['사상가', '인도', '사리', '명상하는'] },
  'Marie Curie': { era: ['근현대사'], role: ['과학자'], recommendations: ['과학자', '실험실', '현미경'] },
  'Martin Luther King Jr.': { era: ['근현대사'], role: ['개혁가'], recommendations: ['개혁가', '연설하는'] },
  'Michelangelo': { era: ['르네상스'], role: ['화가', '예술가'], recommendations: ['화가', '예술가', '르네상스', '그림 그리는'] },
  'Mozart': { era: ['계몽주의'], role: ['작곡가', '예술가'], recommendations: ['작곡가', '피아노'] },
  'Napoleon Bonaparte': { era: ['계몽주의', '근현대사'], role: ['황제', '장군'], recommendations: ['황제', '장군', '군대를 이끄는', '말 타는'] },
  'Nelson Mandela': { era: ['근현대사'], role: ['정치인', '혁명가'], recommendations: ['정치인', '혁명가', '연설하는'] },
  'Nikola Tesla': { era: ['근현대사'], role: ['발명가', '과학자'], recommendations: ['발명가', '과학자', '실험실'] },
  'Picasso': { era: ['근현대사'], role: ['화가', '예술가'], recommendations: ['화가', '예술가', '그림 그리는'] },
  'Plato': { era: ['고대 그리스'], role: ['철학자'], recommendations: ['철학자', '고대 그리스', '책', '토가'] },
  'Qin Shi Huang': { era: ['고대 중국'], role: ['황제'], recommendations: ['황제', '갑옷', '군대를 이끄는', '전쟁터'] },
  'Queen Elizabeth I': { era: ['르네상스'], role: ['여왕'], recommendations: ['여왕', '르네상스', '왕관', '왕좌'] },
  'Queen Victoria': { era: ['빅토리아 시대', '근현대사'], role: ['여왕', '군주'], recommendations: ['여왕', '빅토리아 시대', '왕관', '왕좌', '궁전'] },
  'Saladin': { era: ['중세'], role: ['장군', '군주'], recommendations: ['장군', '중세', '갑옷', '터번', '검'] },
  'Shakespeare': { era: ['르네상스'], role: ['소설가', '시인'], recommendations: ['소설가', '르네상스', '글쓰는', '책'] },
  'Socrates': { era: ['고대 그리스'], role: ['철학자'], recommendations: ['철학자', '고대 그리스', '토가', '생각하는 자세'] },
  'Sun Tzu': { era: ['고대 중국'], role: ['장군', '철학자'], recommendations: ['장군', '철학자', '두루마리', '전쟁터'] },
  'Thomas Edison': { era: ['근현대사'], role: ['발명가'], recommendations: ['발명가', '실험실'] },
  'Tutankhamun': { era: ['고대 이집트'], role: ['왕'], recommendations: ['왕', '고대 신전', '왕좌', '네메스'] },
  'Vincent van Gogh': { era: ['근현대사'], role: ['화가', '예술가'], recommendations: ['화가', '예술가', '그림 그리는', '유화'] },
  'William Wallace': { era: ['중세'], role: ['장군', '혁명가'], recommendations: ['장군', '중세', '킬트', '검', '전투 자세'] },
  'Winston Churchill': { era: ['근현대사', '세계 대전'], role: ['정치인'], recommendations: ['정치인', '연설하는'] },
  'Wright brothers': { era: ['근현대사'], role: ['발명가'], recommendations: ['발명가', '실험하는'] },
};

const eraGroupSuggestions: Record<string, string[]> = {
  Gojoseon: ['고조선'],
  ThreeKingdoms_Goguryeo: ['삼국시대', '고구려'],
  ThreeKingdoms_Baekje: ['삼국시대', '백제'],
  ThreeKingdoms_Silla: ['삼국시대', '신라'],
  UnifiedSilla: ['통일신라'],
  LaterThreeKingdoms: ['후삼국시대'],
  Goryeo: ['고려'],
  Joseon: ['조선'],
  Modern_Korea: ['근현대사'],
  Ancient_Egypt: ['고대 이집트'],
  Ancient_China: ['세계사'],
  Ancient_Greece: ['고대 그리스'],
  Ancient_Rome: ['로마 제국'],
  Medieval: ['중세'],
  Renaissance: ['르네상스'],
  Enlightenment: ['계몽주의'],
  Modern_World: ['근현대사', '세계사'],
};

const getFigureRecommendations = (tag: Tag): string[] => {
  if (tag.category !== 'figure') {
    return [];
  }

  const context = figureContext[tag.name];
  const recommendationSet = new Set<string>(context?.recommendations ?? []);

  if (recommendationSet.size === 0) {
    context?.role?.forEach((role) => recommendationSet.add(role));
    context?.era?.forEach((era) => recommendationSet.add(era));
  }

  if (tag.era_group) {
    eraGroupSuggestions[tag.era_group]?.forEach((eraTag) => recommendationSet.add(eraTag));
  }

  if (tag.nationality === 'Korean') {
    recommendationSet.add('한국사');
  } else if (tag.nationality === 'World') {
    recommendationSet.add('세계사');
  }

  return Array.from(recommendationSet);
};

type ModalAnchor = {
  x: number;
  y: number;
  placement: 'above' | 'below';
};

const StepIntro: React.FC<StepIntroProps> = ({ onStart, isLoading, initialName = '', error, onShowHistory, history, onHistorySelect }) => {
  const [initialState] = useState(() => {
    const tags = initialName.trim() ? initialName.split(',').map(s => s.trim()).filter(Boolean) : ['전신샷'];
    const text = tags.join(', ');
    const tagSet = new Set(tags);
    return { text, tagSet };
  });

  const [name, setName] = useState(initialState.text);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(initialState.tagSet);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagToAdd, setTagToAdd] = useState<Tag | null>(null);
  const [modalAnchor, setModalAnchor] = useState<ModalAnchor | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ file: File, previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groupedTags = useMemo(() => {
    return popularTags.reduce((acc, tag) => {
      if (tag.category !== 'figure' && tag.category !== 'item') {
        if (!acc[tag.category]) {
          acc[tag.category] = [];
        }
        acc[tag.category].push(tag);
      }
      return acc;
    }, {} as Record<string, Tag[]>);
  }, []);

  const groupedItems = useMemo(() => {
    const items = popularTags.filter(tag => tag.category === 'item');
    return items.reduce((acc, item) => {
      const subCat = item.sub_category || 'General_Misc';
      if (!acc[subCat]) {
        acc[subCat] = [];
      }
      acc[subCat].push(item);
      return acc;
    }, {} as Record<string, Tag[]>);
  }, []);

  const groupedFigures = useMemo(() => {
    const figures = popularTags.filter(tag => tag.category === 'figure');
    
    const initialGroups: { Korean: Record<string, Tag[]>, World: Record<string, Tag[]> } = {
        Korean: {},
        World: {},
    };

    return figures.reduce((acc, figure) => {
        const nation = figure.nationality || 'World';
        const era = figure.era_group || 'Uncategorized';
        
        if (!acc[nation][era]) {
            acc[nation][era] = [];
        }
        acc[nation][era].push(figure);
        return acc;
    }, initialGroups);
  }, []);


  const updateInputFromTags = (tags: Set<string>) => {
    setName(Array.from(tags).join(', '));
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    const tagsFromName = newName.split(',').map(s => s.trim()).filter(Boolean);
    setSelectedTags(new Set(tagsFromName));
  };

  const handleTagClick = (tag: Tag, event: React.MouseEvent<HTMLButtonElement>) => {
    if (selectedTags.has(tag.name)) {
        const newTags = new Set<string>(selectedTags);
        newTags.delete(tag.name);
        setSelectedTags(newTags);
        updateInputFromTags(newTags);
    } else {
        if (tag.category === 'figure') {
            const recommendations = getFigureRecommendations(tag);
            if (recommendations.length > 0) {
                const button = event.currentTarget;
                const viewportPadding = 24;
                const estimatedModalHeight = 280;
                const estimatedHalfWidth = 180;

                const openModalNearButton = (attempt: number) => {
                    const rect = button.getBoundingClientRect();
                    const fullyVisible =
                        rect.top >= viewportPadding &&
                        rect.bottom <= window.innerHeight - viewportPadding;

                    if (!fullyVisible && attempt < 5) {
                        button.scrollIntoView({
                            block: 'center',
                            inline: 'center',
                            behavior: attempt === 0 ? 'smooth' as ScrollBehavior : 'auto',
                        });
                        window.setTimeout(() => openModalNearButton(attempt + 1), 80);
                        return;
                    }

                    let placement: 'above' | 'below' = 'below';
                    let anchorY = rect.bottom + 12;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const spaceAbove = rect.top;

                    if (spaceBelow < estimatedModalHeight + viewportPadding && spaceAbove > spaceBelow) {
                        placement = 'above';
                        anchorY = rect.top - 12;
                    }

                    if (placement === 'below') {
                        const maxY = window.innerHeight - viewportPadding - estimatedModalHeight;
                        anchorY = Math.min(anchorY, maxY);
                        anchorY = Math.max(anchorY, viewportPadding);
                    } else {
                        const minY = viewportPadding + estimatedModalHeight;
                        anchorY = Math.max(anchorY, minY);
                        anchorY = Math.min(anchorY, window.innerHeight - viewportPadding);
                    }

                    let centerX = rect.left + rect.width / 2;
                    if (centerX - estimatedHalfWidth < viewportPadding) {
                        centerX = viewportPadding + estimatedHalfWidth;
                    } else if (centerX + estimatedHalfWidth > window.innerWidth - viewportPadding) {
                        centerX = window.innerWidth - viewportPadding - estimatedHalfWidth;
                    }

                    setModalAnchor({ x: centerX, y: anchorY, placement });
                    setTagToAdd(tag);
                    setIsModalOpen(true);
                };

                window.requestAnimationFrame(() => openModalNearButton(0));
                return;
            }
        }
        const newTags = new Set<string>(selectedTags);
        if (tag.category === 'figure') {
            popularTags.forEach(t => {
                if (t.category === 'figure' && newTags.has(t.name)) {
                    newTags.delete(t.name);
                }
            });
        }
        newTags.add(tag.name);
        setSelectedTags(newTags);
        updateInputFromTags(newTags);
    }
  };

  const handleModalConfirm = () => {
    if (!tagToAdd) return;
    const recommendations = getFigureRecommendations(tagToAdd);
    const tagsToAdd = [tagToAdd.name, ...recommendations];
    
    const newTags = new Set<string>(selectedTags);
    
    popularTags.forEach(t => {
      if (t.category === 'figure' && newTags.has(t.name)) {
        newTags.delete(t.name);
      }
    });

    tagsToAdd.forEach(tagName => newTags.add(tagName));

    setSelectedTags(newTags);
    updateInputFromTags(newTags);
    setIsModalOpen(false);
    setTagToAdd(null);
    setModalAnchor(null);
  };

  const handleModalCancel = () => {
    if (!tagToAdd) return;
    const newTags = new Set<string>(selectedTags);
    
    popularTags.forEach(t => {
      if (t.category === 'figure' && newTags.has(t.name)) {
        newTags.delete(t.name);
      }
    });
    
    newTags.add(tagToAdd.name);
    setSelectedTags(newTags);
    updateInputFromTags(newTags);
    setIsModalOpen(false);
    setTagToAdd(null);
    setModalAnchor(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tagMap = new Map(popularTags.map(t => [t.name, t]));
    const selectedTagNames = name.split(',').map(s => s.trim()).filter(Boolean);

    const augmentedPromptParts = selectedTagNames.map(tagName => {
      const tag = tagMap.get(tagName);
      if (tag && tag.prompt_hint) {
        return `${tag.name} (${tag.prompt_hint})`;
      }
      return tagName;
    });

    const finalPrompt = augmentedPromptParts.join(', ');
    onStart(finalPrompt, uploadedImage?.file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setUploadedImage({
            file,
            previewUrl: URL.createObjectURL(file),
        });
    }
  };

  const handleRemoveImage = () => {
    if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  const TagButton: React.FC<{ tag: Tag; }> = ({ tag }) => {
    const context = tag.category === 'figure' ? figureContext[tag.name] : null;
    let description = tag.description || '';
    if (tag.category === 'figure' && tag.nationality === 'World' && tag.name.match(/^[a-zA-Z\s]+$/)) {
      const koreanName = (tag.description || '').match(/\(한국어: (.*?)\)/)?.[1];
      if (koreanName) {
        description = `(한국어: ${koreanName}) ` + description.replace(`(한국어: ${koreanName}) `, '');
      }
    }
    
    const tooltipRecs = tag.category === 'figure'
      ? getFigureRecommendations(tag)
      : context?.recommendations ?? [];

    if (tooltipRecs.length) {
        description += `\n\n추천 태그: ${tooltipRecs.join(', ')}`;
    }

    return (
        <div className="relative group">
            <button
                type="button"
                onClick={(e) => handleTagClick(tag, e)}
                className={`px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap ${
                    selectedTags.has(tag.name)
                        ? `${categoryColors[tag.category]} text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-white`
                        : `bg-gray-700 hover:bg-gray-600 text-gray-300`
                }`}
            >
                {tag.name}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-sm text-white bg-gray-900 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-pre-wrap">
                {description}
            </div>
        </div>
    );
  };

  const placeholderText = uploadedImage 
    ? "e.g., in the style of a renaissance painting, as a Joseon king"
    : "e.g., Yi Sun-sin in armor";

  const recommendedTagsForModal = tagToAdd ? getFigureRecommendations(tagToAdd) : [];

  return (
    <>
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-white">Step 1: Define Your Portrait</h2>
        <p className="text-gray-400 mb-6 text-center">Describe a character using text and tags, or upload an image to create a new version.</p>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder={placeholderText}
            className="w-full max-w-lg px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          
          <div className="mt-8 w-full text-center">
              <div className="flex items-center justify-center my-4">
                  <hr className="w-full border-gray-600" />
                  <span className="px-4 text-gray-400 font-semibold">OR</span>
                  <hr className="w-full border-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-300">Generate from an Image</h3>
              
              {uploadedImage ? (
                  <div className="flex flex-col items-center gap-4">
                      <img src={uploadedImage.previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-purple-500" />
                      <button onClick={handleRemoveImage} type="button" className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
                          Remove Image
                      </button>
                  </div>
              ) : (
                  <div>
                      <input 
                          type="file"
                          ref={fileInputRef}
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all">
                          Upload Image
                      </label>
                      <p className="text-sm text-gray-500 mt-2">Upload a photo to generate a new portrait of the same person.</p>
                  </div>
              )}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Portrait'}
            </button>
          </div>
        </form>

        {history.length > 0 && (
          <div className="w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Recent Creations</h3>
              <button
                type="button"
                onClick={onShowHistory}
                className="text-sm text-purple-400 hover:text-purple-300 transition underline"
              >
                View All ({history.length})
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
              {history.slice(0, 8).map((creation) => (
                <div
                  key={creation.id}
                  onClick={() => onHistorySelect(creation)}
                  className="group cursor-pointer flex-shrink-0 bg-gray-700/50 p-2 rounded-lg border-2 border-transparent hover:border-purple-500 hover:bg-gray-700 transition-all transform hover:-translate-y-1"
                >
                  <img
                    src={creation.baseCharacterUrl}
                    alt={`Pixel art of ${creation.figureName}`}
                    className="w-28 h-28 object-contain rounded bg-gray-800/60"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <p className="text-center text-xs font-semibold mt-2 truncate text-white w-28">{creation.figureName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 w-full">
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-300">Or use tags to build your concept:</h3>
            <div className="space-y-4">
                {categoryOrder.map(category => {
                  if (category === 'figure') {
                      return (
                          <div key={category}>
                              <h4 className="font-bold text-gray-400 mb-2">{categoryDisplayNames.figure}</h4>
                              <div className="space-y-4 bg-gray-800/50 p-3 rounded-md">
                                  <div>
                                      <h5 className="font-semibold text-gray-300 mb-3 pl-1 border-b border-gray-700 pb-1">한국사 (Korean History)</h5>
                                      <div className="pl-2 space-y-3">
                                          {koreanEraOrder.map(eraKey => (
                                              groupedFigures.Korean[eraKey] && (
                                                  <div key={eraKey}>
                                                      <h6 className="text-sm font-medium text-purple-300 mb-2">{eraDisplayNames[eraKey]}</h6>
                                                      <div className="flex flex-wrap gap-2">
                                                          {groupedFigures.Korean[eraKey].map(tag => <TagButton key={tag.name} tag={tag} />)}
                                                      </div>
                                                  </div>
                                              )
                                          ))}
                                      </div>
                                  </div>

                                  <div>
                                      <h5 className="font-semibold text-gray-300 mb-3 pl-1 border-b border-gray-700 pb-1 mt-4">세계사 (World History)</h5>
                                      <div className="pl-2 space-y-3">
                                          {worldEraOrder.map(eraKey => (
                                              groupedFigures.World[eraKey] && (
                                                  <div key={eraKey}>
                                                      <h6 className="text-sm font-medium text-purple-300 mb-2">{eraDisplayNames[eraKey]}</h6>
                                                      <div className="flex flex-wrap gap-2">
                                                          {groupedFigures.World[eraKey].map(tag => <TagButton key={tag.name} tag={tag} />)}
                                                      </div>
                                                  </div>
                                              )
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      );
                  }
                  
                  if (category === 'item') {
                      return (
                        <div key={category}>
                          <h4 className="font-bold text-gray-400 mb-2">{categoryDisplayNames.item}</h4>
                          <div className="space-y-3 bg-gray-800/50 p-3 rounded-md">
                            {itemSubCategoryOrder.map(subCatKey => (
                              groupedItems[subCatKey] && (
                                <div key={subCatKey}>
                                  <h6 className="text-sm font-medium text-lime-300 mb-2">{itemSubCategoryDisplayNames[subCatKey]}</h6>
                                  <div className="flex flex-wrap gap-2">
                                    {groupedItems[subCatKey].map(tag => <TagButton key={tag.name} tag={tag} />)}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      );
                  }
                  
                  if (groupedTags[category]?.length) {
                    return (
                        <div key={category}>
                            <h4 className="font-bold text-gray-400 mb-2">{categoryDisplayNames[category]}</h4>
                            <div className="flex flex-wrap gap-2">
                                {groupedTags[category]?.map(tag => <TagButton key={tag.name} tag={tag} />)}
                            </div>
                        </div>
                    )
                  }
                  
                  return null;
                })}
            </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        title={`Add Recommended Tags?`}
        confirmText="Yes, add recommendations"
        cancelText="No, just add the figure"
        anchorPosition={modalAnchor ?? undefined}
      >
        <p>Would you like to add the recommended tags for <strong className="text-purple-400">{tagToAdd?.name}</strong> to automatically create a more detailed prompt?</p>
        {tagToAdd && recommendedTagsForModal.length > 0 && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-400">Recommended tags:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {recommendedTagsForModal.map(rec => (
                        <span key={rec} className="px-2 py-1 text-xs bg-gray-600 rounded-md text-gray-200">{rec}</span>
                    ))}
                </div>
            </div>
        )}
      </ConfirmationModal>
    </>
  );
};

export default StepIntro;
