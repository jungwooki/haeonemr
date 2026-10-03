"""Exercise the published public-intake boundary with temporary synthetic documents."""
import json,uuid
import requests
from admin_connection import connection,PROJECT
s=connection();ident=str(uuid.uuid4());base=f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents';docbase=f'projects/{PROJECT}/databases/(default)/documents'
intake=f'emr_intakes/{ident}';receipt=f'emr_intake_receipts/{ident}'
def value(v):
 if isinstance(v,bool):return {'booleanValue':v}
 return {'stringValue':v}
fields={k:value(v) for k,v in {'requestId':ident,'name':'__MPS_INTAKE_VERIFY_'+ident,'birthDate':'2000-01-01','gender':'여','ageGroup':'','category':'유산후','data':json.dumps({'misChiefComplaint':'synthetic verification only'}),'imported':False}.items()}
writes=[{'update':{'name':docbase+'/'+intake,'fields':fields},'updateTransforms':[{'fieldPath':'createdAt','setToServerValue':'REQUEST_TIME'}]},{'update':{'name':docbase+'/'+receipt,'fields':{'state':value('complete')}}}]
try:
 r=requests.post(base+':commit',json={'writes':writes},timeout=30);assert r.ok,('public submission',r.status_code,r.text[:400])
 r=requests.get(base+'/'+receipt,timeout=20);assert r.ok and set(r.json()['fields'])=={'state'},'receipt'
 for collection in ['emr_intakes','emr_intake_receipts','emr_patients','emr_records','emr_record_content']:
  r=requests.get(base+'/'+collection,timeout=20);assert r.status_code==403,('public list',collection,r.status_code)
 for path in [intake,'emr_patients/'+ident,'emr_records/'+ident,'emr_record_content/'+ident]:
  r=requests.get(base+'/'+path,timeout=20);assert r.status_code==403,('public get',path,r.status_code)
 r=requests.patch(base+'/'+intake,json={'fields':fields},timeout=20);assert r.status_code==403,'immutable intake'
 r=requests.post(base+':commit',json={'writes':[writes[1]]},timeout=20);assert r.status_code==403,'immutable receipt'
 fake=str(uuid.uuid4());r=requests.patch(base+'/emr_intake_receipts/'+fake,json={'fields':{'state':value('complete')}},timeout=20);assert r.status_code==403,'standalone receipt forged'
 print('PASS: unauthenticated atomic submission and receipt; public reads/lists/updates and forged receipt denied')
finally:
 # Only delete this UUID's synthetic artifacts. No existing patient is changed.
 req=s.get(base+'/emr_requests/'+ident,timeout=20)
 if req.ok:
  patient_id=req.json()['fields'].get('patientId',{}).get('stringValue')
  for path in ['emr_records/r_'+ident,'emr_record_content/r_'+ident,'emr_requests/'+ident]:s.delete(base+'/'+path,timeout=20).raise_for_status()
  if patient_id:
   patient=s.get(base+'/emr_patients/'+patient_id,timeout=20)
   if patient.ok and patient.json()['fields']['name']['stringValue']=='__MPS_INTAKE_VERIFY_'+ident:s.delete(base+'/emr_patients/'+patient_id,timeout=20).raise_for_status()
 for path in [intake,receipt]:s.delete(base+'/'+path,timeout=20).raise_for_status()
 print('Temporary verification documents removed')
