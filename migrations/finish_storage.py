"""Run after the project owner enables Firebase Storage. Never changes billing."""
import json
from pathlib import Path
from admin_connection import connection,PROJECT,private_dir
s=connection();root=Path(__file__).resolve().parents[1]
r=s.get('https://firebasestorage.googleapis.com/v1beta/projects/961426297157/buckets',timeout=30)
if not r.ok:raise SystemExit('Storage is not ready ('+str(r.status_code)+'). Owner setup required.')
buckets=[b['name'].rsplit('/',1)[-1] for b in r.json().get('buckets',[])]
bucket=next((b for b in buckets if b in [PROJECT+'.firebasestorage.app',PROJECT+'.appspot.com']),None)
if not bucket:raise SystemExit('Default bucket is not linked yet. Finish owner setup first.')
# Keep previous Storage rules if present; no other namespace is changed.
release=f'projects/{PROJECT}/releases/firebase.storage/{bucket}'
old=s.get('https://firebaserules.googleapis.com/v1/'+release,timeout=30)
if old.ok:
 previous=s.get('https://firebaserules.googleapis.com/v1/'+old.json()['rulesetName'],timeout=30);previous.raise_for_status()
 p=private_dir()/'storage-rules-before.json'
 if not p.exists():p.write_text(json.dumps(previous.json()));p.chmod(0o600)
 previous_text=previous.json()['source']['files'][0]['content']
 # A new default bucket may have deny-all or temporary allow-all rules.
 # Do not replace custom rules or expose EMR through a permissive wildcard.
 import re
 compact=re.sub(r'\s+','',re.sub(r'//[^\n]*','',previous_text))
 expected=(root/'firebase/storage.rules').read_text()
 known=re.fullmatch(r"rules_version=['\"]2['\"];servicefirebase.storage\{match/b/\{bucket\}/o\{match/\{allPaths=\*\*\}\{allowread,write:if(false|request.auth!=null|request.time<timestamp.date\([0-9,]+\));\}\}\}",compact)
 if not known and previous_text!=expected:
  raise SystemExit('Custom Storage rules present; merge rules before continuing.')
r=s.post(f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/rulesets',json={'source':{'files':[{'name':'storage.rules','content':(root/'firebase/storage.rules').read_text()}]}},timeout=30);r.raise_for_status()
payload={'release':{'name':release,'rulesetName':r.json()['name']}}
r=s.patch('https://firebaserules.googleapis.com/v1/'+release,json=payload,timeout=30) if old.ok else s.post(f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/releases',json=payload['release'],timeout=30)
r.raise_for_status()
r=s.patch(f'https://storage.googleapis.com/storage/v1/b/{bucket}',json={'cors':json.loads((root/'firebase/storage-cors.json').read_text())},timeout=30);r.raise_for_status()
p=root/'src/scripts/config.js';text=p.read_text();import re
text=re.sub(r"storageBucket: '[^']+'",'storageBucket: '+repr(bucket),text).replace('STORAGE_ENABLED: false','STORAGE_ENABLED: true');p.write_text(text)
print('Protected Storage configured:',bucket)
