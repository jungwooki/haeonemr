"""One source of truth for M-survey choices, question files and review documents."""
import json
import re

CATALOG = 'src/data/mental/catalog.json'


def load_catalog(root, source=CATALOG):
    catalog = (root / source).resolve()
    if not catalog.is_relative_to(root.resolve()) or not catalog.is_file():
        raise ValueError('Invalid or missing mental catalog: ' + source)
    folder = catalog.parent
    entries = json.loads(catalog.read_text())
    datasets = {}
    for entry in entries:
        key = entry['key']
        if not re.fullmatch(r'[a-z][a-z_]*', key) or key in datasets:
            raise ValueError('Invalid or duplicate mental sport key: ' + key)
        if entry['file'] != key + '.json':
            raise ValueError('Unexpected mental question file: ' + entry['file'])
        sport = json.loads((folder / entry['file']).read_text())
        items = [item for section in sport['sections'] for item in section['items']]
        if [item['no'] for item in items] != list(range(1, 52)):
            raise ValueError('Expected 51 ordered questions: ' + key)
        if len(sport['sections']) != 5 or any(not item['text'].strip() for item in items):
            raise ValueError('Missing mental questions or factors: ' + key)
        if key in ('adult_soccer', 'ballet', 'gymnastics', 'ice_skating', 'ice_hockey', 'taekwondo', 'squash'):
            reference = json.loads((folder / 'soccer.json').read_text())
            for a, b in zip(reference['sections'], sport['sections']):
                if ({k: v for k, v in a.items() if k != 'items'} !=
                        {k: v for k, v in b.items() if k != 'items'} or
                        [i['no'] for i in a['items']] != [i['no'] for i in b['items']]):
                    raise ValueError('Changed factor mapping: ' + key)
        datasets[key] = sport
    return entries, datasets


def review_documents(entries, datasets):
    outputs = {}
    index = ['# AI MPS M-서베이 종목별 문항', '',
             '각 문서는 종목별 JSON 원본에서 자동 생성됩니다. 수정은 `emr/src/data/mental/<종목키>.json`에서 하고 `python3 emr/tools/build.py`를 실행하세요.', '',
             '모든 유형은 51문항·5요인·6점 척도입니다. 종목별 대상과 해석 주의는 각 문서를 확인하세요.', '',
             '| 종목 | 대상 | 문항 문서 |', '|---|---|---|']
    for entry in entries:
        key = entry['key']
        sport = datasets[key]
        title = sport['label']
        index.append(f"| {title} | {entry['audience']} | [{title}]({key}.md) |")
        lines = [f'# AI MPS M-서베이 · {title}', '', f"- 대상: {entry['audience']}",
                 f'- 식별자: `{key}`', f'- 원본: `src/data/mental/{key}.json`',
                 '- 응답: 1 전혀 그렇지 않다 / 2 그렇지 않다 / 3 약간 그렇지 않다 / 4 약간 그렇다 / 5 그렇다 / 6 매우 그렇다', '',
                 '문항 번호와 요인 배정은 유소년축구 기준을 유지합니다. 긍정요인은 평균, 부정요인은 `7 - 평균`으로 계산합니다.', '']
        if entry['subtitle']:
            lines += [entry['subtitle'], '']
        if entry['note']:
            lines += [entry['note'], '',
                      '참고: [Hill, MacNamara & Collins의 PCDEQ2 개발 연구](https://pubmed.ncbi.nlm.nih.gov/30362895/). 원 연구의 88문항·7요인 검사지와 이 자체 문항의 구성은 다릅니다.', '']
        for section in sport['sections']:
            lines += ['## ' + section['title'], '', section['factor'] + ' · ' + section['calc'], '',
                      '| 번호 | 문항 |', '|---|---|']
            lines += [f"| {item['no']} | {item['text'].replace('|', '&#124;')} |" for item in section['items']]
            lines += ['']
        outputs[f'guides/mental/{key}.md'] = '\n'.join(lines) + '\n'
    outputs['guides/mental/README.md'] = '\n'.join(index) + '\n'
    # Retain the existing comparison link; regenerate it from the same question sources.
    compared = ['ballet', 'gymnastics', 'ice_skating', 'ice_hockey', 'taekwondo', 'squash']
    lines = ['# 유소년 종목 문항 비교', '',
             '유소년축구의 문항별 의미·번호·요인·계산식을 유지하고 종목 맥락을 조정한 문항입니다. 이 표는 빌드 시 자동 생성됩니다.', '',
             '성인축구를 포함한 전체 종목 문서는 [종목별 목록](mental/README.md)을 확인하세요.', '']
    for i, section in enumerate(datasets['soccer']['sections']):
        lines += ['## ' + section['title'], '',
                  '| 번호 | 유소년축구 원문 | ' + ' | '.join(datasets[k]['label'] for k in compared) + ' |',
                  '|---|---|' + '---|' * len(compared)]
        for j, item in enumerate(section['items']):
            lines.append('| ' + str(item['no']) + ' | ' + item['text'] + ' | ' +
                         ' | '.join(datasets[k]['sections'][i]['items'][j]['text'] for k in compared) + ' |')
        lines += ['']
    outputs['guides/MENTAL_SPORT_ADAPTATIONS.md'] = '\n'.join(lines) + '\n'
    return outputs
