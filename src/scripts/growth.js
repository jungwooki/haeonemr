/* ===================== 8. 성장 백분위 참조 데이터 ===================== */
const growthReferenceData = {
  male:{ ages:[2,4,6,8,10,12,14,16,18],
    height:{p3:[82.5,95.8,107.3,118.8,129.8,139.7,152.8,164.0,167.2],p10:[84.5,98.2,110.2,121.7,133.0,143.3,156.4,167.0,169.8],p25:[86.0,100.7,113.0,124.5,136.0,146.5,160.0,170.0,172.4],p50:[87.8,103.2,115.5,127.5,138.8,149.8,163.5,172.0,174.2],p75:[89.7,105.7,118.0,130.3,142.0,153.3,167.0,174.0,176.5],p90:[91.2,107.8,120.5,133.0,145.0,156.0,170.0,177.0,179.5],p97:[93.0,110.0,123.0,136.0,148.0,159.0,173.0,180.0,182.5]},
    weight:{p3:[10.2,13.1,16.3,20.2,24.8,31.2,40.3,49.7,53.2],p10:[10.9,14.1,17.8,22.0,27.3,34.5,44.5,53.8,57.0],p25:[11.6,15.2,19.2,24.1,30.2,38.5,49.0,58.5,61.5],p50:[12.4,16.5,21.0,27.0,34.5,45.0,56.0,63.0,66.0],p75:[13.4,18.0,23.5,30.5,39.5,51.8,63.5,69.8,73.5],p90:[14.4,19.7,26.0,34.0,44.8,58.5,69.0,76.0,80.5],p97:[15.2,21.2,28.5,37.8,49.5,64.5,74.8,82.0,87.0]}},
  female:{ ages:[2,4,6,8,10,12,14,16,18],
    height:{p3:[81.5,95.0,106.8,118.0,129.5,142.8,150.8,152.0,152.3],p10:[83.5,97.2,109.5,121.0,132.8,146.2,153.5,154.8,155.2],p25:[85.0,99.5,112.0,123.8,136.0,149.2,156.0,157.8,158.2],p50:[87.0,102.0,115.0,126.8,139.0,152.0,159.5,161.3,161.8],p75:[88.8,104.5,117.5,129.8,142.0,154.8,162.0,163.8,164.2],p90:[90.5,106.8,120.0,132.5,145.0,157.0,164.2,165.8,166.0],p97:[92.0,109.0,122.5,135.0,148.0,159.2,166.0,167.3,167.8]},
    weight:{p3:[9.8,12.8,16.0,20.2,25.5,33.5,41.8,45.3,46.0],p10:[10.5,13.9,17.5,22.2,28.3,36.8,45.0,48.5,49.0],p25:[11.2,15.0,19.0,24.6,31.8,40.8,48.5,52.2,53.0],p50:[12.0,16.2,20.8,26.8,34.2,46.0,53.5,56.5,57.3],p75:[13.1,17.8,23.2,30.8,39.8,52.8,59.5,62.2,63.0],p90:[14.1,19.5,25.8,34.5,44.8,58.8,64.5,68.0,69.0],p97:[15.0,21.0,28.0,38.2,49.5,64.5,69.8,74.0,75.0]}}
};
function interpolateAtAge(x,xs,ys){ if(x<=xs[0]) return ys[0]; if(x>=xs[xs.length-1]) return ys[ys.length-1]; let i=0; while(x>xs[i+1]) i++; const t=(x-xs[i])/(xs[i+1]-xs[i]); return ys[i]*(1-t)+ys[i+1]*t; }
function calcPercentile(value, refAtAge){
  const levels=[3,10,25,50,75,90,97], keys=['p3','p10','p25','p50','p75','p90','p97'];
  for(let i=0;i<keys.length-1;i++){ const a=refAtAge[keys[i]], b=refAtAge[keys[i+1]]; if(value>=a && value<=b){ const t=(value-a)/((b-a)||1); return +(levels[i]+t*(levels[i+1]-levels[i])).toFixed(1); } }
  if(value<refAtAge.p3) return 1.0; if(value>refAtAge.p97) return 99.0; return 50.0;
}
function getHeightComment(p){ if(p>=90) return '또래 대비 매우 큰 편입니다.'; if(p>=75) return '또래 대비 큰 편입니다.'; if(p>=25) return '또래 평균 범위입니다.'; if(p>=10) return '또래 대비 작은 편입니다.'; return '또래 대비 매우 작은 편으로, 성장 경과 관찰이 필요합니다.'; }
function getWeightComment(p){ if(p>=90) return '체중이 또래보다 매우 높은 편입니다.'; if(p>=75) return '체중이 또래보다 높은 편입니다.'; if(p>=25) return '체중은 평균 범위입니다.'; if(p>=10) return '체중이 또래보다 낮은 편입니다.'; return '체중이 또래보다 매우 낮은 편으로, 식습관 관리가 필요합니다.'; }

let rpHeightChart, rpWeightChart;
function drawGrowthChart(canvasId, ref, ageLabels, dataKey, age, value, pointColor){
  const ctx=document.getElementById(canvasId).getContext('2d');
  const styles={p3:{c:'#e2e8f0',w:1,d:[2,2]},p10:{c:'#cbd5e1',w:1,d:[3,3]},p25:{c:'#94a3b8',w:1,d:[4,3]},p50:{c:'#334155',w:1.8,d:[]},p75:{c:'#94a3b8',w:1,d:[4,3]},p90:{c:'#cbd5e1',w:1,d:[3,3]},p97:{c:'#e2e8f0',w:1,d:[2,2]}};
  const datasets=['p3','p10','p25','p50','p75','p90','p97'].map(k=>({label:k.replace('p','')+'th',data:ref[dataKey][k],borderColor:styles[k].c,borderWidth:styles[k].w,borderDash:styles[k].d,pointRadius:0,tension:.35}));
  datasets.push({label:'우리 아이',data:[{x:age,y:value}],type:'scatter',backgroundColor:pointColor,borderColor:pointColor,pointRadius:5,pointHoverRadius:6});
  return new Chart(ctx,{type:'line',data:{labels:ageLabels,datasets},options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:6,padding:6,font:{size:8}}}},
    scales:{x:{type:'linear',min:2,max:18,grid:{display:false},ticks:{font:{size:8}}},y:{grid:{color:'#f1f5f9'},ticks:{font:{size:8}}}}}});
}

