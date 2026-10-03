"""Verify audit security against isolated synthetic documents, then remove them."""
import json,uuid,requests
from admin_connection import connection,private_dir,PROJECT
admin=connection();account=json.loads((private_dir()/'staff-accounts/jung-jieun.json').read_text())
key='AIzaSyCohqQ3ySjCdWKZSujhKF-7XbSiV1bJPX0'
r=requests.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',params={'key':key},json={'email':account['email'],'password':account['password'],'returnSecureToken':True},timeout=30)
assert r.status_code==200,'Staff authentication failed'
headers={'Authorization':'Bearer '+r.json()['idToken']}
base=f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents'
prefix=f'projects/{PROJECT}/databases/(default)/documents/'
uid='audit_verify_'+uuid.uuid4().hex
paths=['emr_record_content/'+uid,'emr_audit/'+uid,'emr_audit/'+uid+'_forged']
def fields(data):return {k:{'stringValue':v} for k,v in data.items()}
def commit(writes):return requests.post(base+':commit',headers=headers,json={'writes':writes},timeout=30)
def update(path,data):return {'update':{'name':prefix+path,'fields':fields(data)}}
try:
 r=admin.patch(base+'/'+paths[0],json={'fields':fields({'privateNote':'before','data':'original'})},timeout=30);r.raise_for_status()
 write=update(paths[0],{'privateNote':'after','_auditId':uid});write['updateMask']={'fieldPaths':['privateNote','_auditId']}
 assert commit([write]).status_code==403,'Unaudited mutation allowed'
 event={'actorUid':account['uid'],'actorName':account['name'],'action':'note_update','targetId':uid,'patientId':'','field':'privateNote','before':'before','after':'after'}
 log=update(paths[1],event);log['updateTransforms']=[{'fieldPath':'createdAt','setToServerValue':'REQUEST_TIME'}]
 r=commit([write,log]);assert r.status_code==200,'Atomic audited mutation failed: '+str(r.status_code)
 assert commit([{'delete':prefix+paths[1]}]).status_code==403,'Audit deletion allowed'
 assert commit([log]).status_code==403,'Audit replacement allowed'
 forged=update(paths[2],{**event,'actorUid':'someone-else'});forged['updateTransforms']=log['updateTransforms'];assert commit([forged]).status_code==403,'Forged actor allowed'
 assert requests.get(base+'/'+paths[0],timeout=30).status_code==403,'Unauthenticated read allowed'
 data=admin.get(base+'/'+paths[0],timeout=30).json()['fields'];assert data['data']['stringValue']=='original'
 print('PASS: named login, atomic audited update, unaudited write denial, immutable logs, actor verification, private reads, original preservation')
finally:
 for path in paths:
  r=admin.delete(base+'/'+path,timeout=30);assert r.status_code in (200,404)
 print('Synthetic verification documents removed')
