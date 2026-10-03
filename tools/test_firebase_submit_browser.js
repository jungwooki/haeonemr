// Execute in a local page with agent-browser eval --stdin. No database requests.
(async()=>{
 const originalRequest=EmrFirebase.request,originalAdvance=SurveyUX.canAdvance;
 const results=[];let resolveRequest,rejectRequest,ids=[];
 const cases=[
  ['소아','app-shell',()=>{currentStep=getTotalSteps();},()=>nextStep()],
  ['심층진료','deep-app-shell',()=>{deepCurrentStep=deepGetTotalSteps();},()=>deepNextStep()],
  ['다이어트','diet-app-shell',()=>{dietCurrentStep=dietGetTotalSteps();},()=>dietNextStep()],
  ['여성','women-app-shell',()=>{womenCurrentStep=womenTotalSteps;},()=>womenNextStep()],
  ['통증','pain-app-shell',()=>{painCurrentStep=painTotalSteps;},()=>painNextStep()],
  ['유소년스포츠','sports-app-shell',()=>{sportsCurrentStep=sportsTotalSteps;},()=>sportsNextStep()],
  ['산후','postpartum-app-shell',()=>{postpartumCurrentStep=postpartumTotalSteps;},()=>postpartumNextStep()]
 ];
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 SurveyUX.canAdvance=()=>true;
 EmrFirebase.request=async(url,options)=>{ids.push(JSON.parse(options.body).requestId);return new Promise((resolve,reject)=>{resolveRequest=resolve;rejectRequest=reject;});};
 try{
  for(const [name,id,setFinalStep,next] of cases){
   const completion=document.getElementById('completion-view'),shell=document.getElementById(id);
   completion.style.display='none';shell.style.display='flex';setFinalStep();
   const first=next();check(completion.style.display==='none',name+' prematurely completed');check(shell.dataset.saving==='true',name+' not marked busy');
   rejectRequest(Error('Simulated unavailable connection'));check(await first===false,name+' failure not returned');
   check(completion.style.display==='none'&&shell.style.display==='flex',name+' draft lost after failure');check(!shell.querySelector('.emr-submit-status').hidden,name+' error invisible');
   const retry=next();resolveRequest({ok:true,json:async()=>({ok:true})});check(await retry===true,name+' retry failed');
   check(completion.style.display==='flex'&&shell.style.display==='none',name+' success not completed');
   check(ids.at(-1)===ids.at(-2),name+' retry changed submission ID');results.push({category:name,waitsForCommit:true,failureKeepsForm:true,retryKeepsSubmissionId:true});
  }
  return {results};
 }finally{EmrFirebase.request=originalRequest;SurveyUX.canAdvance=originalAdvance;}
})()
