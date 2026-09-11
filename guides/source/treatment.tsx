import React, { useState, useMemo } from 'react';
import { 
  Search, X, Activity, Zap, Sparkles, HeartPulse, 
  Flame, Droplets, Bone, Stethoscope, Microscope, 
  CheckCircle2, Info, Wind, Snowflake, Anchor, 
  ArrowRight, ShieldCheck, Waves, Smile, Flower2, 
  Smartphone, MonitorSmartphone
} from 'lucide-react';

// --- 1. 유틸리티 & 컴포넌트 ---

// 레이다 차트 (동적 축 지원)
const RadarChart = ({ data, theme }) => {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  
  // 데이터 키에 따라 축 라벨 자동 설정
  // Medicine: 7축 / Treatment: 4축 (재활 단계)
  const isRehab = data.hasOwnProperty('phase_inflam');
  
  const axes = isRehab 
    ? [
        { key: 'phase_inflam', label: '어혈/염증기', sub: '통증제어' },
        { key: 'phase_prolif', label: '재생/증식기', sub: '조직회복' },
        { key: 'phase_remodel', label: '리모델링기', sub: '기능강화' },
        { key: 'phase_maint', label: '유지/재활기', sub: '재발방지' }
      ]
    : [
        { key: 'qi_def', label: '기허' }, { key: 'qi_stag', label: '기울' },
        { key: 'qi_counter', label: '기역' }, { key: 'blood_def', label: '혈허' },
        { key: 'blood_stasis', label: '어혈' }, { key: 'fluid', label: '수체' },
        { key: 'yin_def', label: '음허' }
      ];

  const angleSlice = (Math.PI * 2) / axes.length;
  
  // 데이터 값 추출
  const values = axes.map(axis => data[axis.key] || 0);

  const getCoordinates = (value, index) => {
    // 4축일 때는 45도(PI/4)부터 시작하여 마름모꼴이 예쁘게 나오도록 조정
    const startAngle = isRehab ? -Math.PI / 2 : -Math.PI / 2;
    const angle = index * angleSlice + startAngle;
    const r = (value / 100) * radius;
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  };

  const points = values.map((v, i) => getCoordinates(v, i)).join(' ');

  const getWebPoints = (r) => {
    return new Array(axes.length).fill(0).map((_, i) => {
      const startAngle = isRehab ? -Math.PI / 2 : -Math.PI / 2;
      const angle = i * angleSlice + startAngle;
      return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
    }).join(' ');
  };

  return (
    <div className={`flex flex-col items-center justify-center animate-slide-in-left ${theme ? theme.text : 'text-slate-600'}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 그리드 */}
        {[20, 40, 60, 80, 100].map((r, i) => (
          <polygon key={i} points={getWebPoints(r)} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 4 ? "0" : "4 2"} />
        ))}
        
        {/* 축 라벨 및 선 */}
        {axes.map((axis, i) => {
          const [x, y] = getCoordinates(115, i);
          const [lineX, lineY] = getCoordinates(100, i);
          return (
            <g key={i}>
              <line x1={center} y1={center} x2={lineX} y2={lineY} stroke="#e2e8f0" strokeWidth="1" />
              <text 
                x={x} 
                y={y} 
                textAnchor="middle" 
                alignmentBaseline="middle"
                className="text-xs font-bold fill-slate-500 font-serif"
                style={{ fontSize: '11px' }}
              >
                {axis.label}
              </text>
              {axis.sub && (
                <text 
                  x={x} 
                  y={y + 12} 
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  className="text-[9px] fill-slate-400 font-sans"
                >
                  {axis.sub}
                </text>
              )}
            </g>
          );
        })}
        
        {/* 데이터 영역 - 라인 중심 디자인 */}
        <polygon 
          points={points} 
          fill="currentColor" 
          fillOpacity="0.1"
          stroke="currentColor" 
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="drop-shadow-sm transition-all duration-1000 ease-out"
        />
        
        {/* 데이터 포인트 */}
        {values.map((v, i) => {
          const [x, y] = getCoordinates(v, i);
          return (
            <circle 
              key={i} 
              cx={x} 
              cy={y} 
              r="4" 
              fill="white" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="transition-all duration-1000 ease-out delay-100"
            />
          );
        })}
      </svg>
      <p className="text-xs text-slate-400 mt-2 font-serif">
        * {isRehab ? '재활 단계별 치료 적합도' : '한의학적 병리 상태 분석'}
      </p>
    </div>
  );
};

// --- 2. 데이터 정의 (치료법) ---
const TREATMENT_DATA = [
  // === 1. 침 (Acupuncture) ===
  {
    id: 'ACU_MS',
    name: '경근침/산침',
    category: '침',
    type: 'physical',
    indication: '근육 뭉침, 통증 유발점(Trigger Point)',
    summary: '굳어진 근육을 직접 풀어주는 가장 기본적인 침 치료',
    analogy: '엉킨 실타래(근육) 바늘 끝으로 살살 풀어내어 매듭을 없애는 과정입니다.',
    mechanism: ['단축된 근섬유의 물리적 이완 (Twitch Response)', '국소 혈류량 증가로 노폐물 배출', '근막 유착 박리'],
    chart: { phase_inflam: 70, phase_prolif: 80, phase_remodel: 60, phase_maint: 40 },
    icon: <Activity />,
    tags: ['근육통', '담결림']
  },
  {
    id: 'ACU_SAAM',
    name: '사암침',
    category: '침',
    type: 'flow',
    indication: '내과 질환, 신경 조절, 만성 통증',
    summary: '팔꿈치와 무릎 아래의 혈자리만 사용하여 전신의 기운을 조절',
    analogy: '꽉 막힌 도심의 교통 정체를 외곽 도로의 신호등을 조작하여 뚫어주는 원격 제어 시스템입니다.',
    mechanism: ['뇌의 신경가소성(Neuroplasticity) 자극', '자율신경계 균형 조절', '경락 순환 개선'],
    chart: { phase_inflam: 40, phase_prolif: 60, phase_remodel: 80, phase_maint: 90 },
    icon: <Sparkles />,
    tags: ['오장육부', '화병', '소화불량']
  },
  {
    id: 'ACU_ELEC',
    name: '전침 (Electro-acu)',
    category: '침',
    type: 'physical',
    indication: '신경통, 마비 질환, 강한 통증',
    summary: '침에 미세한 전류를 흘려 자극을 지속적으로 전달',
    analogy: '사람의 손이 닿지 않는 깊은 곳까지 규칙적으로 두드려주는 전기 마사지기입니다.',
    mechanism: ['관문 조절설(Gate Control Theory)에 의한 진통', '엔도르핀 등 천연 진통 물질 분비 촉진', '신경 재생 자극'],
    chart: { phase_inflam: 90, phase_prolif: 50, phase_remodel: 60, phase_maint: 30 },
    icon: <Zap />,
    tags: ['디스크', '신경마비']
  },
  {
    id: 'ACU_LIPO',
    name: '지방분해전침',
    category: '침',
    type: 'detox',
    indication: '복부 비만, 팔뚝/허벅지 부분 비만, 셀룰라이트',
    summary: '피하 지방층에 긴 침을 놓고 특수 파장의 전류를 흘려 지방을 분해',
    analogy: '딱딱하게 굳은 버터(지방)를 전자레인지(전기자극)로 녹여 액체로 만드는 과정입니다.',
    mechanism: ['카테콜아민 분비 촉진으로 지방 분해 유도', '열 발생을 통한 지방 세포 크기 감소', '림프 순환을 통한 노폐물 배출'],
    chart: { phase_inflam: 50, phase_prolif: 60, phase_remodel: 80, phase_maint: 90 },
    icon: <Zap />,
    tags: ['다이어트', '지방분해', '사이즈감소']
  },
  {
    id: 'ACU_KID',
    name: '소아침/스티커침',
    category: '침',
    type: 'gentle',
    indication: '소아 야경, 야제, 틱, 복통, 근육통 등 다양한 질환',
    summary: '아프지 않게 피부를 자극하거나 붙이는 침',
    analogy: '아이의 놀란 신경을 엄마 손길처럼 부드럽게 쓰다듬어 안정시키는 치료입니다.',
    mechanism: ['C-촉각 섬유 자극을 통한 정서적 안정', '피부 감각 수용체 자극으로 면역 활성', '비침습적 자극으로 통증 없음'],
    chart: { phase_inflam: 30, phase_prolif: 70, phase_remodel: 50, phase_maint: 80 },
    icon: <Smile />,
    tags: ['아프지 않음', '소아전용', '야제증', '스티커침']
  },

  // === 2. 뜸 (Moxibustion) ===
  {
    id: 'MOXA_ELEC',
    name: '기기구 (전자뜸)',
    category: '뜸',
    type: 'warm',
    indication: '냉증, 소화불량, 만성 통증',
    summary: '연기와 냄새 없이 일정한 온열 자극을 깊숙이 전달',
    analogy: '몸속 깊은 곳의 차가운 얼음을 따뜻한 햇살로 서서히 녹여 물길을 터주는 과정입니다.',
    mechanism: ['심부 체온 상승 및 면역 세포 활성화', '혈관 확장을 통한 순환 개선', '열충격단백질(HSP) 생성 촉진'],
    chart: { phase_inflam: 20, phase_prolif: 60, phase_remodel: 90, phase_maint: 90 },
    icon: <Flame />,
    tags: ['따뜻함', '혈액순환']
  },
  {
    id: 'MOXA_DIR',
    name: '직접구/간접구',
    category: '뜸',
    type: 'warm',
    indication: '국소 부위의 강한 염증 혹은 허한증',
    summary: '쑥을 직접 태워 강력한 열 자극을 전달 (해온한의원에서는 주로 간접구 사용)',
    analogy: '아궁이에 불을 지펴 방 전체를 데우듯, 강력한 열원으로 생체 에너지를 북돋습니다.',
    mechanism: ['국소 백혈구 증가 효과', '히스타민 분비를 통한 혈류량 급증', '세포 대사 촉진'],
    chart: { phase_inflam: 30, phase_prolif: 50, phase_remodel: 70, phase_maint: 80 },
    icon: <Flame />,
    tags: ['쑥냄새', '전통방식']
  },

  // === 3. 부항 (Cupping) ===
  {
    id: 'CUP_WET',
    name: '습식 부항 (사혈)',
    category: '부항',
    type: 'detox',
    indication: '급성 염좌, 타박상, 어혈',
    summary: '나쁜 피(어혈)를 직접 밖으로 배출시키며 압력을 낮춤',
    analogy: '꽉 막힌 하수관의 찌꺼기를 직접 퍼내어 물이 콸콸 흐르게 하는 청소 작업입니다.',
    mechanism: ['HO-1(Heme Oxygenase-1) 효소 발현을 통한 항염증 작용', '국소 부종 및 내압 감소', '새로운 혈액 유입 촉진'],
    chart: { phase_inflam: 100, phase_prolif: 40, phase_remodel: 20, phase_maint: 10 },
    icon: <Droplets />,
    tags: ['어혈제거', '혈류순환']
  },
  {
    id: 'CUP_DRY',
    name: '건식/유관법',
    category: '부항',
    type: 'detox',
    indication: '근육통, 피로 회복, 등 결림',
    summary: '피를 뽑지 않고 음압으로 근막을 들어 올림',
    analogy: '진공청소기로 이불의 먼지를 빨아들이듯, 근육 사이의 노폐물을 피부 쪽으로 끌어올려 분산시킵니다.',
    mechanism: ['근막 감압(Myofascial Decompression)', '순환 촉진', '가스 교환 및 노폐물 배출'],
    chart: { phase_inflam: 60, phase_prolif: 80, phase_remodel: 50, phase_maint: 50 },
    icon: <Wind />,
    tags: ['근육이완', '마사지효과']
  },
  {
    id: 'CUP_MOVING',
    name: '주관법 (Moving Cupping)',
    category: '부항',
    type: 'gentle',
    indication: '임산부, 소아, 노약자의 근육 긴장 완화',
    summary: '근육을 따라 부드럽게 밀어주며 완만하게 기혈을 소통시킴',
    analogy: '굳은 땅을 쟁기로 갈아엎는 것이 아니라, 부드러운 빗자루로 쓸어내듯 순환을 돕습니다.',
    mechanism: ['림프 순환 촉진', '피부 자극을 통한 신경 이완', '근막 유착의 부드러운 해소'],
    chart: { phase_inflam: 40, phase_prolif: 90, phase_remodel: 70, phase_maint: 80 },
    icon: <Waves />,
    tags: ['임산부가능', '소아부항', '부드러움']
  },

  // === 4. 약침 (Pharmacopuncture) ===
  {
    id: 'INJ_BV',
    name: '봉독 약침 (Bee Venom)',
    category: '약침',
    type: 'intensive',
    indication: '만성 관절염, 디스크, 인대 손상',
    summary: '정제된 벌의 독을 이용한 강력한 천연 항염증제',
    analogy: '산불을 끄기 위해 맞불을 놓는 것과 같습니다. 면역계를 강하게 깨워 만성적인 염증을 몰아냅니다.',
    mechanism: ['멜리틴(Melittin) 성분의 강력한 항염증 작용', '부신피질호르몬 분비 자극', '혈류량 증대'],
    chart: { phase_inflam: 90, phase_prolif: 80, phase_remodel: 40, phase_maint: 20 },
    icon: <ShieldCheck />,
    tags: ['천연진통제', '면역치료']
  },
  {
    id: 'INJ_PLA',
    name: '태반 약침 (자하거)',
    category: '약침',
    type: 'regen',
    indication: '갱년기, 만성 피로, 조직 재생 불량',
    summary: '성장 인자가 풍부한 태반 추출물 주입',
    analogy: '메마른 땅에 주는 최고급 영양제입니다. 세포가 다시 자라나도록 비료를 뿌려주는 역할입니다.',
    mechanism: ['조직 재생 인자(Growth Factor) 공급', '항산화 및 간 기능 개선', '호르몬 밸런스 조절'],
    chart: { phase_inflam: 20, phase_prolif: 100, phase_remodel: 80, phase_maint: 60 },
    icon: <HeartPulse />,
    tags: ['피로회복', '재생치료']
  },
  {
    id: 'INJ_SO',
    name: '소염/중성어혈 약침',
    category: '약침',
    type: 'detox',
    indication: '급성 통증, 염좌, 교통사고',
    summary: '한약재에서 추출한 항염증 성분을 환부에 주입',
    analogy: '불난 곳에 물을 뿌리듯, 붓고 열나는 상처 부위에 직접 천연소염제를 발라 식혀줍니다.',
    mechanism: ['COX-2 억제를 통한 염증 차단', '부종 감소', '손상 부위 열감 감소'],
    chart: { phase_inflam: 90, phase_prolif: 50, phase_remodel: 30, phase_maint: 10 },
    icon: <Snowflake />,
    tags: ['급성염좌', '교통사고']
  },
  {
    id: 'INJ_SAMGI',
    name: '삼기활력약침',
    category: '약침',
    type: 'regen',
    indication: '만성 피로, 기력 저하, 수험생 체력 관리, 면역력 증진',
    summary: '인삼, 황기 등 기운을 돋우는 약재를 추출하여 경혈에 주입',
    analogy: '방전된 배터리를 급속 충전하듯, 지친 몸에 에너지를 즉각적으로 공급합니다.',
    mechanism: ['면역 세포 활성화', '에너지 대사 촉진', '항산화 작용을 통한 활성산소 제거'],
    chart: { phase_inflam: 20, phase_prolif: 90, phase_remodel: 80, phase_maint: 100 },
    icon: <Sparkles />,
    tags: ['기력회복', '보약주사', '만성피로']
  },
  {
    id: 'INJ_SAN',
    name: '산삼 비만 약침',
    category: '약침',
    type: 'regen',
    indication: '비만, 지방세포 분해, 배출촉진',
    summary: '산양산삼 추출물을 경혈에 주입하여 정상 세포형성 촉진, 노폐물 배출',
    analogy: '방전된 배터리에 고속 충전기를 꽂는 것과 같습니다. 필요없는 지방세포를 빠르게 분해, 배출합니다',
    mechanism: ['진세노사이드의 면역 조절 작용', 'NK세포 활성 증대', '지방 분해 배출 속도 촉진'],
    chart: { phase_inflam: 30, phase_prolif: 70, phase_remodel: 60, phase_maint: 100 },
    icon: <Sparkles />,
    tags: ['기력충전', '지방분해']
  },
  {
    id: 'INJ_ACU',
    name: '무통 약침 (아큐렉스)',
    category: '약침',
    type: 'gentle',
    indication: '연부조직손상, 근막, 힘줄, 인대손상',
    summary: '스포츠 부상, 재생의 1차 선택',
    analogy: '손상된 조직의 재생 속도를 30%이상 빠르게 촉진시킵니다.',
    mechanism: ['염증성 통증 개선', '조직 손상 개선', '혈관 부종 개선'],
    chart: { phase_inflam: 60, phase_prolif: 60, phase_remodel: 50, phase_maint: 50 },
    icon: <CheckCircle2 />,
    tags: ['빠른재생', '스포츠회복']
  },
  {
    id: 'INJ_US',
    name: '초음파 가이드 약침',
    category: '약침',
    type: 'intensive',
    indication: '고위험 부위, 심부 근육, 신경 포착, 만성 인대 손상',
    summary: '초음파로 내부 구조물을 실시간으로 확인하며 정확하게 약침을 주입',
    analogy: '안개 낀 복잡한 도로를 네비게이션 화면을 보며 목적지 앞까지 정확하게 찾아가는 최첨단 주행입니다.',
    mechanism: ['실시간 영상 유도를 통한 표적 정밀 타격', '신경 및 혈관 손상 위험 원천 차단', '약물 주입의 정확도 향상으로 치료 효과 극대화'],
    chart: { phase_inflam: 80, phase_prolif: 90, phase_remodel: 80, phase_maint: 70 },
    icon: <MonitorSmartphone />,
    tags: ['초음파', '정밀치료', '안전시술']
  },

  // === 5. 추나 (Chuna) ===
  {
    id: 'CHUNA_SIM',
    name: '단순 추나 (근막/관절)',
    category: '추나',
    type: 'structural',
    indication: '근막통, 스포츠손상, 거북목, 척추 측만, 비대칭',
    summary: '한의사가 직접 근육과 근막을 밀고 당겨서 풀어줌',
    analogy: '줄어든 옷(근육)을 다림질하여 쫙 펴주는 것과 같습니다. 짧아진 근육을 늘려 통증을 줄입니다.',
    mechanism: ['고유수용성 감각(Proprioception) 자극', '근방추(Muscle Spindle) 재설정', '관절 가동 범위 확보'],
    chart: { phase_inflam: 50, phase_prolif: 90, phase_remodel: 70, phase_maint: 60 },
    icon: <Bone />,
    tags: ['근막이완', '에너지강화']
  },
  {
    id: 'CHUNA_COM',
    name: '복잡 추나 (교정)',
    category: '추나',
    type: 'structural',
    indication: '디스크, 척추 측만, 골반 비대칭',
    summary: '틀어진 뼈와 관절의 위치를 순간적인 힘으로 맞춤',
    analogy: '틀어진 자동차 바퀴의 정렬(휠 얼라인먼트)을 다시 맞춰 타이어 마모와 주행 불안을 해결합니다.',
    mechanism: ['관절 아탈구 교정', '신경 압박 해소', '척추 분절의 기능 회복'],
    chart: { phase_inflam: 30, phase_prolif: 60, phase_remodel: 100, phase_maint: 80 },
    icon: <Anchor />,
    tags: ['골반교정', '척추교정']
  },
  {
    id: 'CHUNA_KID',
    name: '단순추나 (소아)',
    category: '추나',
    type: 'gentle',
    indication: '소아 성장, 야경, 야제, 틱, ADHD',
    summary: '근건이완수기요법 (날척법, 안유법 등)을 통한 소아 맞춤형 이완 치료',
    analogy: '나무가 곧게 자라도록 지지대를 세워주고, 거친 흙을 부드럽게 다져주는 정원사의 손길과 같습니다.',
    mechanism: ['척추 라인 자극(날척)을 통한 자율신경 조절', '근육 이완 및 성장판 자극', '심리적 안정 유도'],
    chart: { phase_inflam: 20, phase_prolif: 90, phase_remodel: 80, phase_maint: 100 },
    icon: <Smile />,
    tags: ['소아성장', '야제증', '틱장애', '날척법']
  },

  // === 6. 기타/물리치료 ===
  {
    id: 'ETC_TAPING',
    name: '밸런스 테이핑 요법',
    category: '기타',
    type: 'structural',
    indication: '근육통, 관절 불안정, 스포츠 손상 예방',
    summary: '신축성 테이프를 이용해 근육 기능을 보조하고 신체 밸런스를 잡음',
    analogy: '약해진 근육 위에 탄력 있는 보조 근육을 하나 더 덧대어 지탱해주는 원리입니다.',
    mechanism: ['피부를 들어올려 림프 및 혈류 순환 개선', '근육의 수축/이완 기능 보조', '관절의 안정성 확보'],
    chart: { phase_inflam: 80, phase_prolif: 80, phase_remodel: 60, phase_maint: 90 },
    icon: <Activity />,
    tags: ['키네시오', '부상방지']
  },
  {
    id: 'ETC_TOGU',
    name: '독일 TOGU 밸런스 치료',
    category: '기타',
    type: 'structural',
    indication: '척추신경 밸런스, 코어 강화, 협응력 강화, 하지 고유수용성감각 향상',
    summary: 'Challenge Disc 2.0 (EU특허 2081651)을 이용한 과학적 밸런스 훈련',
    analogy: '내 몸 안의 수평계(자이로스코프)를 훈련시킵니다. 트레이너 없이도 앱과 센서가 내 몸의 균형을 잡아줍니다.',
    mechanism: ['특허받은 다축 플랫폼을 통한 고유수용성 감각 자극', '블루투스 센서 기반 실시간 피드백', 'Bodyteamwork 앱을 통한 맞춤형 코어/하체 훈련'],
    chart: { phase_inflam: 10, phase_prolif: 50, phase_remodel: 90, phase_maint: 100 },
    icon: <MonitorSmartphone />,
    tags: ['재활운동', '코어강화', '스마트훈련', 'Bodyteamwork']
  },
  {
    id: 'ETC_RESP',
    name: '호흡기 치료',
    category: '기타',
    type: 'flow',
    indication: '비염, 감기, 축농증, 호흡기 질환',
    summary: '네블라이저, 코세척, 레이저침, 호흡기 IR을 이용한 복합 관리',
    analogy: '건조하고 막힌 굴뚝(숨길)을 청소하고, 따뜻한 증기로 촉촉하게 적셔 환기를 돕습니다.',
    mechanism: ['점막 습윤 및 섬모 운동 촉진', '레이저를 통한 혈류 개선 및 염증 완화', '비강 내 노폐물 세척'],
    chart: { phase_inflam: 90, phase_prolif: 60, phase_remodel: 40, phase_maint: 70 },
    icon: <Wind />,
    tags: ['비염관리', '네블라이저', '감기']
  },
  {
    id: 'ETC_AROMA',
    name: '향기(아로마) 치료',
    category: '기타',
    type: 'gentle',
    indication: '스트레스, 불면, 심신 불안, 두통',
    summary: '천연 에센셜 오일의 향기를 이용한 심신 이완 및 치유',
    analogy: '복잡한 도시를 떠나 숲속 깊은 곳에서 피톤치드를 마시듯, 뇌를 쉬게 하고 마음을 진정시킵니다.',
    mechanism: ['후각 신경을 통해 대뇌 변연계 직접 자극', '부교감 신경 활성화를 통한 이완', '신경 전달 물질 조절'],
    chart: { phase_inflam: 30, phase_prolif: 60, phase_remodel: 50, phase_maint: 100 },
    icon: <Flower2 />,
    tags: ['심신안정', '스트레스', '힐링']
  },
  {
    id: 'ETC_MAGNET',
    name: '자기장 치료 Tesla-3000',
    category: '기타',
    type: 'physical',
    indication: '강력한 심부 근육 자극, 만성 통증, 신경통',
    summary: '옷을 입은 채로 강력한 자기장을 체내 깊숙이 침투시켜 통증 유발점을 치료',
    analogy: '무선 충전기처럼 몸에 닿지 않고도 깊은 곳의 방전된 신경과 근육을 강력하게 깨웁니다.',
    mechanism: ['강력한 펄스 자기장의 심부 침투 (Deep Penetration)', '말초 신경 자극 및 근육 수축/이완 유도', '세포막 전위 안정화'],
    chart: { phase_inflam: 50, phase_prolif: 80, phase_remodel: 80, phase_maint: 70 },
    icon: <Zap />,
    tags: ['자기장', 'Tesla-3000', '심부자극']
  },
  {
    id: 'PT_CRYO',
    name: '냉각 치료 (Cryo)',
    category: '기타',
    type: 'cool',
    indication: '급성 부종, 열감, 타박상',
    summary: '극저온 냉각치료로 급성 염증과 통증을 차단',
    analogy: '화재 현장(염증)에 소화기를 뿌려 즉각적으로 불을 끄고 열기를 식히는 처치입니다.',
    mechanism: ['혈관 수축으로 부종 억제', '신경 전도 속도 감소로 진통 효과', '염증 매개 물질 확산 방지'],
    chart: { phase_inflam: 100, phase_prolif: 20, phase_remodel: 10, phase_maint: 10 },
    icon: <Snowflake />,
    tags: ['급성기, 아급성기', '붓기제거']
  },
  {
    id: 'PT_ELEC',
    name: '전기 치료 (ICT/TENS)',
    category: '기타',
    type: 'physical',
    indication: '만성 통증, 근육통',
    summary: '간섭파/저주파를 이용한 물리치료',
    analogy: '통증 신호가 뇌로 가는 전화선을 잠시 끕니다. 전기 신호로 통증을 덮어버려 못 느끼게 합니다.',
    mechanism: ['관문 조절설(통증 신호 차단)', '근육 펌핑 작용으로 노폐물 배출', '국소 순환 증진'],
    chart: { phase_inflam: 60, phase_prolif: 60, phase_remodel: 40, phase_maint: 40 },
    icon: <Waves />,
    tags: ['기본물리치료', '시원함']
  },
  {
    id: 'PT_AUTO',
    name: '심부열 치료 (고주파/Microwave)',
    category: '기타',
    type: 'warm',
    indication: '심부 근육통, 근막 관절 강직',
    summary: '피부 및 조직 깊숙이 열을 전달하여 조직을 부드럽게 함',
    analogy: '전자레인지가 음식 속부터 데우듯이, 뼈와 가까운 깊은 근육까지 따뜻하게 데워줍니다.',
    mechanism: ['심부 조직 온도 상승', '콜라겐 조직의 신전성 증가', '혈류량 증대'],
    chart: { phase_inflam: 30, phase_prolif: 80, phase_remodel: 70, phase_maint: 60 },
    icon: <Flame />,
    tags: ['심부열', '근막관절이완']
  }
];

// 스타일 정의
const STYLE_MAP = {
  physical: {
    bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-800', gradient: 'from-indigo-400 to-blue-500',
    label: '물리적 자극 (Physical)', desc: '근육과 신경을 직접 자극합니다'
  },
  flow: {
    bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-800', gradient: 'from-violet-400 to-purple-500',
    label: '순환/소통 (Flow)', desc: '막힌 기운과 흐름을 뚫습니다'
  },
  warm: {
    bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800', gradient: 'from-orange-400 to-red-500',
    label: '온열 (Warmth)', desc: '심부 체온을 높여 회복시킵니다'
  },
  cool: {
    bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-800', gradient: 'from-cyan-400 to-blue-500',
    label: '냉각/소염 (Cooling)', desc: '열을 내리고 염증을 잡습니다'
  },
  detox: {
    bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800', gradient: 'from-rose-400 to-red-500',
    label: '해독/배출 (Detox)', desc: '노폐물과 어혈을 제거합니다'
  },
  regen: {
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800', gradient: 'from-emerald-400 to-green-500',
    label: '재생/보강 (Regen)', desc: '조직을 재생하고 영양을 줍니다'
  },
  intensive: {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800', gradient: 'from-amber-400 to-yellow-500',
    label: '강력 자극 (Intensive)', desc: '강한 자극으로 회복을 유도합니다'
  },
  structural: {
    bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700',
    badge: 'bg-slate-200 text-slate-800', gradient: 'from-slate-400 to-gray-500',
    label: '구조 교정 (Structure)', desc: '골격과 균형을 바로잡습니다'
  },
  gentle: {
    bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700',
    badge: 'bg-pink-100 text-pink-800', gradient: 'from-pink-300 to-rose-300',
    label: '저자극 (Gentle)', desc: '부드럽고 편안한 치료입니다'
  }
};

const CATEGORIES = ['전체', '침', '뜸', '부항', '약침', '추나', '기타'];

// --- 3. 메인 컴포넌트 ---
export default function TreatmentGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // 모드 상태는 약 처방전(Prescription)과 치료법(Treatment)을 나중에 합칠 수 있도록 대비
  // 현재는 치료법 데이터만 보여줌
  const currentData = TREATMENT_DATA;

  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.includes(searchTerm) ||
        item.tags.some(tag => tag.includes(searchTerm));
      
      const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, currentData]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap');
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        
        .font-serif { font-family: 'Gowun Batang', serif; }
        .font-sans { font-family: 'Pretendard', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
        
        .card-hover { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1); }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal { animation: fadeInScale 0.2s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 font-serif">해온 치료 가이드</h1>
                  <p className="text-xs text-slate-500 font-medium">환자 설명용 비주얼 자료</p>
                </div>
              </div>
              
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all text-sm"
                  placeholder="증상, 치료법 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5 overflow-x-auto pb-2 custom-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <main className="max-w-7xl mx-auto px-4 py-8 pb-32">
          {filteredData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredData.map((item) => {
                const style = STYLE_MAP[item.type] || STYLE_MAP.physical;
                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer card-hover group relative overflow-hidden"
                  >
                    {/* Background Icon Watermark */}
                    <div className={`absolute -right-4 -bottom-4 opacity-[0.07] transform rotate-12 group-hover:scale-110 transition-transform duration-500 ${style.text}`}>
                       {React.cloneElement(item.icon, { size: 100 })}
                    </div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${style.badge}`}>
                        {item.category}
                      </span>
                      <div className={`p-1.5 rounded-full bg-slate-50 ${style.text}`}>
                        {React.cloneElement(item.icon, { size: 18 })}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1 font-serif group-hover:text-indigo-700 transition-colors relative z-10">
                      {item.name}
                    </h3>
                    <p className="text-[13px] text-slate-500 mb-4 line-clamp-2 min-h-[40px] relative z-10">
                      {item.indication}
                    </p>

                    <div className="flex flex-wrap gap-1.5 relative z-10">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-slate-50 text-slate-500 text-[10px] px-2 py-1 rounded-md border border-slate-100 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">검색 결과가 없습니다.</p>
              <p className="text-sm">다른 키워드로 검색해보세요.</p>
            </div>
          )}
        </main>

        {/* Detail Modal */}
        {selectedItem && (() => {
          const item = selectedItem;
          const style = STYLE_MAP[item.type] || STYLE_MAP.physical;
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedItem(null)}
              ></div>

              <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row animate-modal z-50">
                
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white rounded-full transition-colors backdrop-blur-md shadow-sm border border-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>

                {/* Left Side: Visual & Chart */}
                <div className="w-full md:w-5/12 bg-slate-50/80 border-r border-slate-100 p-8 flex flex-col justify-center items-center relative overflow-hidden">
                   {/* Decorative Gradients */}
                   <div className={`absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br ${style.gradient} rounded-full opacity-10 blur-3xl`}></div>
                   <div className={`absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl ${style.gradient} rounded-full opacity-10 blur-3xl`}></div>

                   <div className="z-10 w-full flex flex-col items-center">
                      <div className={`mb-8 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center gap-4 w-full max-w-xs ${style.text}`}>
                        <div className={`p-3 rounded-xl ${style.bg} ${style.text}`}>
                          {React.cloneElement(style.icon || item.icon, { size: 28 })}
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-slate-500">Therapy Type</p>
                          <p className="font-serif font-bold text-lg leading-tight">{style.label}</p>
                          <p className="text-xs text-slate-400 font-sans mt-0.5">{style.desc}</p>
                        </div>
                      </div>
                      
                      {/* Radar Chart */}
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                        <RadarChart data={item.chart} theme={style} />
                      </div>
                   </div>
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-7/12 p-8 overflow-y-auto custom-scrollbar bg-white">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${style.badge}`}>{item.category}</span>
                      <span className="text-slate-400 text-xs font-medium px-2 py-0.5 border border-slate-100 rounded-md">Code: {item.id}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-serif mb-3 leading-tight">
                      {item.name}
                    </h2>
                    <p className={`text-lg font-medium ${style.text} flex items-center gap-2`}>
                      <Info className="w-5 h-5" />
                      {item.indication}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Summary Section */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Summary
                      </h3>
                      <p className="text-slate-700 font-medium text-lg leading-relaxed font-serif">
                        {item.summary}
                      </p>
                    </div>

                    {/* Analogy Section (For Staff/Patients) */}
                    <div className={`rounded-2xl p-6 border ${style.border} ${style.bg}`}>
                      <h3 className={`text-lg font-bold font-serif mb-3 flex items-center gap-2 ${style.text}`}>
                        <Sparkles className="w-5 h-5" />
                        쉽게 이해하는 비유
                      </h3>
                      <p className="text-slate-700 leading-relaxed text-lg font-medium">
                        "{item.analogy}"
                      </p>
                    </div>

                    {/* Mechanism Section (EBM) */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-serif mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Microscope className="w-5 h-5 text-indigo-500" />
                        과학적 치료 기전 (Mechanism)
                      </h3>
                      <ul className="space-y-3">
                        {item.mechanism.map((txt, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${style.text}`} />
                            <span className="text-slate-700 font-medium">{txt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Footer Tags */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                     <p className="text-xs font-bold text-slate-400 uppercase mb-3">Related Keywords</p>
                     <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors cursor-default">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </>
  );
}