"""Publish reviewed audit rules only when the live pre-audit baseline still matches."""
import json
from pathlib import Path
from datetime import datetime,timezone
from admin_connection import connection,private_dir,PROJECT
s=connection();root=Path(__file__).resolve().parents[1];desired=(root/'firebase/firestore.rules').read_text()
start=desired.index('    function auditFor(data)');end=desired.index('    match /emr_requests/{id}',start)
prior=desired[:start]+''.join('    match /'+name+'/{id} { allow read, write: if emrStaff(); }\n' for name in ['emr_patients','emr_records','emr_record_content'])+desired[end:]
url=f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/releases/cloud.firestore'
r=s.get(url,timeout=30);r.raise_for_status();release=r.json();r=s.get('https://firebaserules.googleapis.com/v1/'+release['rulesetName'],timeout=30);r.raise_for_status();current=r.json();live=current['source']['files'][0]['content']
if live==desired:print('Audit rules already active');raise SystemExit()
if live!=prior:raise SystemExit('Live rules changed; no overwrite performed.')
backup=private_dir()/('rules-before-audit-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.json');backup.write_text(json.dumps({'release':release,'ruleset':current}));backup.chmod(0o600)
r=s.post(f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/rulesets',json={'source':{'files':[{'name':'firestore.rules','content':desired}]}},timeout=30);r.raise_for_status();name=r.json()['name']
r=s.patch(url,json={'release':{'name':f'projects/{PROJECT}/releases/cloud.firestore','rulesetName':name}},timeout=30);r.raise_for_status();print('Immutable actor-verified audit and atomic change requirements published')
