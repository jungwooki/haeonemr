"""Create named EMR-only identities; credentials never enter the web workspace."""
import os,json,secrets,string
from pathlib import Path
import firebase_admin
from firebase_admin import auth,credentials
from admin_connection import connection,private_dir,PROJECT
connection()
app=firebase_admin.initialize_app(credentials.Certificate(os.environ['GOOGLE_APPLICATION_CREDENTIALS']),{'projectId':PROJECT},name='emr-staff-provision')
users=[('jung-jieun','정지은'),('han-yookyung','한유경'),('lee-jungwook','이정욱'),('park-soohyun','박수현'),('yoo-seungmi','유승미'),('lee-namhee','이남희'),('lim-sehee','임세희'),('cho-naekyung','조내경'),('jung-kyungah','정경아')]
folder=private_dir()/'staff-accounts';folder.mkdir(exist_ok=True);folder.chmod(0o700)
created=0
for key,name in users:
 uid='mps-emr-'+key;email=key+'@staff.mps-emr.invalid';file=folder/(key+'.json')
 try:user=auth.get_user(uid,app=app)
 except auth.UserNotFoundError:
  password=''.join(secrets.choice(string.ascii_letters+string.digits+'!@#-_=+') for _ in range(20))
  # Save locally before creation so a interrupted run never loses a generated password.
  file.write_text(json.dumps({'name':name,'id':key,'email':email,'uid':uid,'password':password},ensure_ascii=False,indent=2));file.chmod(0o600)
  user=auth.create_user(uid=uid,email=email,password=password,display_name=name,app=app);created+=1
 if user.email!=email:raise RuntimeError('Existing UID has unexpected email; no account overwritten')
 claims={**(user.custom_claims or {}),'emrStaff':True,'emrName':name};auth.set_custom_user_claims(uid,claims,app=app)
rows=['MPS EMR 개인별 초기 로그인 정보','이 문서는 웹에 업로드하지 마세요. 각 직원에게 본인 비밀번호만 전달하세요.','admin은 기존 비밀번호를 그대로 사용합니다.','']
for key,name in users:
 file=folder/(key+'.json');record=json.loads(file.read_text()) if file.exists() else {}
 rows.extend([name+' ('+key+')','초기 비밀번호: '+record.get('password','기존 계정 비밀번호 사용'),''])
output=folder/'MPS-EMR-초기계정.txt';output.write_text('\n'.join(rows));output.chmod(0o600)
print('EMR staff accounts configured:',len(users),'new:',created,'credentials saved in private staff-accounts directory')
