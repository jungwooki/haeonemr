"""Publish the additive write-only intake rules, preserving all existing policies."""
import json
from pathlib import Path
from datetime import datetime, timezone
from admin_connection import connection,private_dir,PROJECT
s=connection();root=Path(__file__).resolve().parents[1]
desired=(root/'firebase/firestore.rules').read_text()
start=desired.index('    // Public write-only intake.')
end=desired.index('    match /emr_patients/{id}',start)
prior=desired[:start]+desired[end:]
release_url=f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/releases/cloud.firestore'
r=s.get(release_url,timeout=30);r.raise_for_status();release=r.json()
r=s.get('https://firebaserules.googleapis.com/v1/'+release['rulesetName'],timeout=30);r.raise_for_status();current=r.json()
live=current['source']['files'][0]['content']
if live==desired:print('Public intake rules already active');raise SystemExit()
if live!=prior:raise SystemExit('Live rules differ from the known baseline. No rules changed.')
backup=private_dir()/('rules-before-public-intake-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.json')
backup.write_text(json.dumps({'release':release,'ruleset':current}));backup.chmod(0o600)
r=s.post(f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/rulesets',json={'source':{'files':[{'name':'firestore.rules','content':desired}]}},timeout=30);r.raise_for_status();name=r.json()['name']
r=s.patch(release_url,json={'release':{'name':f'projects/{PROJECT}/releases/cloud.firestore','rulesetName':name}},timeout=30);r.raise_for_status()
print('Published additive public-intake rules; existing EMR and mental restrictions preserved.')
