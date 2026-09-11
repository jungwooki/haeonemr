"""Build the three patient guides from the supplied content and shared styles."""
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / 'guides'
TITLES = [('process', '진료는 이런 과정을 거칩니다.'), ('prescription', '해온한의원 한약요법들'), ('treatment', '해온한의원 치료방법들')]
css = (GUIDES / 'guide.css').read_text()
nav = '<nav class="guide-nav" aria-label="안내 페이지 이동"><a href="index.html">← 해온한의원 가이드</a><a href="../index.html" target="_top">처음 화면</a></nav>'
def page(title, body, script=''):
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+' · 해온 AI EMR</title><style>'+css+'</style></head><body>'+nav+body+script+'</body></html>'
for key,title in TITLES[1:]:
    data=json.loads((GUIDES/(key+'.json')).read_text())
    if key=='prescription': data['data'].sort(key=lambda item:item['name'])
    body='<main class="guide-shell"><div class="guide-hero"><span class="guide-eyebrow">HAEON GUIDE</span><h1>'+title+'</h1><p class="guide-muted">궁금한 항목을 선택해 자세한 안내를 확인하세요.</p></div><label for="guide-search">이름 또는 증상 검색</label><input class="guide-search" id="guide-search" type="search" placeholder="'+('약 이름, 증상' if key=='prescription' else '치료법, 증상')+' 검색"><div class="guide-filters" id="guide-filters" aria-label="분류"></div><p class="guide-count" id="guide-count" role="status"></p><div class="guide-grid" id="guide-grid"></div></main><dialog class="guide-detail" id="guide-detail" aria-labelledby="guide-detail-title"><header><h2 id="guide-detail-title"></h2><button type="button">닫기</button></header><article></article></dialog>'
    script='<script id="guide-data" type="application/json">'+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+'</script><script>'+(GUIDES/'guide.js').read_text()+'</script>'
    (GUIDES/(key+'.html')).write_text(page(title,body,script))
source=(GUIDES/'source/process.html').read_text()
source=re.sub(r'<link[^>]*fonts\.google[^>]*>', '', source)
source=source.replace('Noto Sans KR','Pretendard').replace('Noto Serif KR','Pretendard')
source=source.replace('#fdfbf7','#F8FAFC').replace('#1e3a8a','#2563EB').replace('#d97706','#2563EB').replace('#fff1f2','#F2EFFC')
source=re.sub(r'<title>.*?</title>', '<title>'+TITLES[0][1]+' · 해온 AI EMR</title>',source)
source=source.replace('</head>','<style>'+css+'</style></head>').replace('<body class="antialiased">','<body class="antialiased process">'+nav)
source=source.replace('<!-- Intro -->','<div class="guide-hero"><span class="guide-eyebrow">HAEON GUIDE</span><h1>'+TITLES[0][1]+'</h1></div><!-- Intro -->')
source=source.replace('amber-', 'blue-').replace('orange-', 'violet-')
source=source.replace('class="flip-card h-80"', '''class="flip-card h-80" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}"''')
(GUIDES/'process.html').write_text(source)
body='<main class="guide-shell"><div class="guide-hero"><span class="guide-eyebrow">HAEON GUIDE</span><h1>해온한의원 가이드</h1><p class="guide-muted">진료 과정부터 한약요법과 치료방법까지 살펴보세요.</p></div><div class="guide-grid">'+''.join('<a class="guide-card" href="'+key+'.html"><span class="guide-eyebrow">0'+str(i+1)+'</span><h2>'+title+'</h2><p style="color:#2563EB">안내 보기 →</p></a>' for i,(key,title) in enumerate(TITLES))+'</div></main>'
(GUIDES/'index.html').write_text(page('해온한의원 가이드',body))
print('Built guide hub and three guide pages')
