"""Idempotent, create-only migration. Patient backup stays outside the repository."""
import hashlib,json,datetime
from admin_connection import connection,private_dir,PROJECT
BASE=f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents'
def digest(value):return hashlib.sha256(value.encode()).hexdigest()
def enc(v):
 if v is None:return {'nullValue':None}
 if isinstance(v,bool):return {'booleanValue':v}
 if isinstance(v,int):return {'integerValue':str(v)}
 if isinstance(v,float):return {'doubleValue':v}
 if isinstance(v,str):return {'stringValue':v}
 if isinstance(v,list):return {'arrayValue':{'values':[enc(x) for x in v]}}
 return {'mapValue':{'fields':{k:enc(x) for k,x in v.items()}}}
def dec(v):
 if 'mapValue'in v:return {k:dec(x) for k,x in v['mapValue'].get('fields',{}).items()}
 if 'arrayValue'in v:return [dec(x) for x in v['arrayValue'].get('values',[])]
 if 'integerValue'in v:return int(v['integerValue'])
 return next(iter(v.values()))
def main():
 s=connection();source=json.loads((private_dir()/'legacy-initial.json').read_text());patients=source['patients'];docs=[];n=0
 for p in patients:
  pid='legacy_'+digest(json.dumps([p['name'],str(p.get('chartNumber') or '')],ensure_ascii=False,separators=(',',':')))[:40]
  records=p['records'];latest=records[0] if records else {}
  summary={'name':p['name'],'chartNumber':p.get('chartNumber') or '', 'birthDate':next((r['birthDate'] for r in records if r.get('birthDate')),''),'gender':next((r['gender'] for r in records if r.get('gender')),''),'lastRecordAt':latest.get('ts',''),'recordCount':len(records),'migration':'legacy-v1'}
  docs.append(('emr_patients/'+pid,summary))
  for i,r in enumerate(records):
   rid='legacy_'+digest(pid+'|'+str(i)+'|'+r['ts']+'|'+r.get('category',''))[:40]
   content={k:r.get(k,'') for k in ['data','doctorNote','privateNote','interpretationNote']};content['patientId']=pid
   metadata={k:v for k,v in r.items() if k not in content};metadata.update(patientId=pid,deleted=False,images=[],migration='legacy-v1')
   docs.extend([('emr_records/'+rid,metadata),('emr_record_content/'+rid,content)]);n+=1
 created=0
 for path,data in docs:
  old=s.get(BASE+'/'+path,timeout=30)
  if old.status_code==200:
   actual={k:dec(v) for k,v in old.json()['fields'].items()}
   if actual!=data:raise RuntimeError('Existing document differs; stopped without overwriting: '+path.split('/')[0])
   continue
  if old.status_code!=404:old.raise_for_status()
  collection,docid=path.split('/')
  r=s.post(BASE+'/'+collection,params={'documentId':docid},json={'fields':{k:enc(v) for k,v in data.items()}},timeout=30);r.raise_for_status();created+=1
  if created%30==0:print('Created',created,'documents',flush=True)
 # Independent read-back equality verification of EVERY migrated field.
 for path,data in docs:
  r=s.get(BASE+'/'+path,timeout=30);r.raise_for_status()
  if {k:dec(v) for k,v in r.json()['fields'].items()}!=data:raise RuntimeError('Read-back mismatch')
 report={'patients':len(patients),'records':n,'documents':len(docs),'verified':True,'sourceSha256':digest((private_dir()/'legacy-initial.json').read_text()),'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 (private_dir()/'migration-verified.json').write_text(json.dumps(report,indent=2));(private_dir()/'migration-verified.json').chmod(0o600)
 r=s.patch(BASE+'/emr_migrations/legacy-v1',json={'fields':{k:enc(v) for k,v in report.items()}},timeout=30);r.raise_for_status()
 print(json.dumps(report),flush=True)
if __name__=='__main__':main()
