import json
from pathlib import Path
from admin_connection import connection,private_dir,PROJECT
s=connection();root=Path(__file__).resolve().parents[1];backup=private_dir()
rules=json.loads((backup/'firestore-rules-before.json').read_text())['source']['files'][0]['content']
extra='''    function emrStaff() {
      return request.auth != null
        && request.auth.token.firebase.sign_in_provider != 'anonymous'
        && (request.auth.token.get('emrAdmin', false) == true || request.auth.token.get('emrStaff', false) == true);
    }
    match /emr_patients/{id} { allow read, write: if emrStaff(); }
    match /emr_records/{id} { allow read, write: if emrStaff(); }
    match /emr_record_content/{id} { allow read, write: if emrStaff(); }
    match /emr_requests/{id} { allow read, write: if emrStaff(); }
    match /emr_migrations/{id} { allow read: if emrStaff(); allow write: if false; }
'''
rules=rules.replace('    match /{collection}/{document=**} {',extra+'    match /{collection}/{document=**} {').replace("allow read, write: if !(collection in [","allow read, write: if !collection.matches('emr_.*') && !(collection in [")
(root/'firebase/firestore.rules').write_text(rules)
current=s.get(f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/releases/cloud.firestore',timeout=30);current.raise_for_status()
current=s.get('https://firebaserules.googleapis.com/v1/'+current.json()['rulesetName'],timeout=30);current.raise_for_status()
current_text=current.json()['source']['files'][0]['content']
original_text=json.loads((backup/'firestore-rules-before.json').read_text())['source']['files'][0]['content']
if current_text not in (original_text,rules):raise SystemExit('Live rules changed; merge them first. Nothing overwritten.')
payload={'source':{'files':[{'name':'firestore.rules','content':rules}]}}
r=s.post(f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/rulesets',json=payload,timeout=30);r.raise_for_status();rule=r.json()['name'];print('EMR rules compiled',flush=True)
r=s.patch(f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}/releases/cloud.firestore',json={'release':{'name':f'projects/{PROJECT}/releases/cloud.firestore','rulesetName':rule}},timeout=30);r.raise_for_status();print('EMR-only restrictions published; other collections preserved',flush=True)
users=json.loads((backup/'auth-admin-before.json').read_text());uid=users[0]['localId']
lookup=s.post(f'https://identitytoolkit.googleapis.com/v1/projects/{PROJECT}/accounts:lookup',json={'localId':[uid]},timeout=30);lookup.raise_for_status()
user=lookup.json()['users'][0];claims=json.loads(user.get('customAttributes','{}'));claims['emrAdmin']=True
r=s.post(f'https://identitytoolkit.googleapis.com/v1/projects/{PROJECT}/accounts:update',json={'localId':user['localId'],'customAttributes':json.dumps(claims)},timeout=30);r.raise_for_status();print('Existing admin authorized for EMR; mental claims preserved',flush=True)
r=s.post(f'https://firebasestorage.googleapis.com/v1alpha/projects/{PROJECT}/defaultBucket',json={'location':'ASIA-NORTHEAST3'},timeout=40)
print('Storage setup',r.status_code,flush=True)
if not r.ok:print(r.json().get('error',{}).get('message','')[:500],flush=True)
else:
 p=backup/'storage-created.json';p.write_text(json.dumps(r.json()));p.chmod(0o600)
