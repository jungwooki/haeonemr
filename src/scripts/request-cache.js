/* Memory only: bounded, short-lived reads; no patient data in browser storage. */
const emrReadCache=new Map();
function clearEmrReadCache(){emrReadCache.clear();}
function invalidateEmrReadCache(prefix){
  for(const key of emrReadCache.keys()) if(key.startsWith(prefix)) emrReadCache.delete(key);
}
function cachedEmrRead(key,read,{ttl=60000,force=false}={}){
  if(force) emrReadCache.delete(key);
  const previous=emrReadCache.get(key);
  if(previous&&(previous.pending||previous.expires>Date.now())) return previous.promise;
  const entry={pending:true,expires:0};
  entry.promise=Promise.resolve().then(read).then(value=>{
    entry.pending=false;entry.expires=Date.now()+ttl;return value;
  },error=>{
    if(emrReadCache.get(key)===entry) emrReadCache.delete(key);
    throw error;
  });
  emrReadCache.delete(key);emrReadCache.set(key,entry);
  while(emrReadCache.size>24) emrReadCache.delete(emrReadCache.keys().next().value);
  return entry.promise;
}
