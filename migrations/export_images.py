import json,urllib.request,urllib.parse,concurrent.futures,time,re,base64,hashlib
from pathlib import Path
from admin_connection import private_dir
from datetime import datetime,timezone
backup=private_dir();source=json.loads((backup/'legacy-initial.json').read_text())
legacy=Path(__file__).resolve().parents[2]/'@HAEONEMR/src/scripts/config.js'
url=re.search(r"SHEET_URL: '([^']+)'",legacy.read_text()).group(1)
def get(params):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(url+'?'+urllib.parse.urlencode(dict(type='haeonImages',password='1824',q='__haeon_image_api_probe__',**params)),timeout=60) as response:d=json.load(response)
   if not d.get('ok') or d.get('protocol')!='haeon-images-v2':raise RuntimeError('Legacy image API unavailable')
   return d
  except Exception:
   if attempt==2:raise
   time.sleep(1)
def export(pair):
 pi,ri=pair;p=source['patients'][pi];r=p['records'][ri]
 dt=datetime.fromisoformat(r['ts'].replace('Z','+00:00')).astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
 key=json.dumps(['record',p['name'],dt,r.get('category') or '소아'],ensure_ascii=False,separators=(',',':'))
 d=get({'key':key,'op':'list'});images=[]
 for item in d['images']:
  data=get({'key':key,'op':'read','id':item['id']});raw=base64.b64decode(data['data']);sha=hashlib.sha256(raw).hexdigest();file=backup/(sha+'.image');file.write_bytes(raw);file.chmod(0o600)
  images.append({**item,'mimeType':data['mimeType'],'sha256':sha,'backupFile':file.name,'size':len(raw)})
 return {'patientIndex':pi,'recordIndex':ri,'key':key,'images':images}
pairs=[(pi,ri) for pi,p in enumerate(source['patients']) for ri,_ in enumerate(p['records'])]
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for result in pool.map(export,pairs):
  results.append(result)
  if len(results)%10==0:print('Image audit',len(results),'/',len(pairs),flush=True)
p=backup/'legacy-images.json';p.write_text(json.dumps(results,ensure_ascii=False));p.chmod(0o600)
print('Images exported:',sum(len(x['images']) for x in results),'across',len(results),'records',flush=True)
