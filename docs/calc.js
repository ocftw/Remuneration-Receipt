(function(root){
'use strict';
const MAX=100000000;
function calculate(gross,o={}){
 if(!Number.isSafeInteger(gross)||gross<0||gross>MAX)throw new Error('請輸入 0 至 100,000,000 的整數金額');
 const rawType=o.type||'9A';
 const type=rawType.startsWith('9A')?'9A':rawType.startsWith('9B')?'9B':rawType;
 if(!['9A','9B','50','91','scholarship'].includes(type))throw new Error('不支援此申報類別');
 const foreign=o.resident==='nonresident';let rate=0;
 if(type==='9A'||type==='9B')rate=foreign?(type==='9B'&&gross<=5000?0:20):(Math.floor(gross/10)>2000?10:0);
 if(type==='91')rate=foreign?20:(Math.floor(gross/10)>2000?10:0);
 if(type==='50')rate=foreign?(Math.max(gross,o.monthTotal||0)<=44250?6:18):(gross>=90501?5:0);
 const tax=Math.floor(gross*rate/100);
 let base=type==='50'?29500:20000;
 if(o.health==='vulnerable')base=29500;
 const health=['9A','9B','50'].includes(type)&&o.health!=='exempt'&&gross>=base?Math.round(Math.min(gross,10000000)*211/10000):0;
 return {gross,tax,health,net:gross-tax-health,rate};
}
function manual(gross,tax,health){
 if(!Number.isSafeInteger(gross)||gross<0||gross>MAX)throw new Error('給付總額需為有效整數金額');
 for(const [label,amount] of [['所得稅',tax],['補充保費',health]]){
  if(!Number.isSafeInteger(amount)||amount<0||amount>MAX)throw new Error(label+'需為 0 以上的整數金額');
 }
 if(tax+health>gross)throw new Error('所得稅與補充保費合計不可超過給付總額');
 return {gross,tax,health,net:gross-tax-health,rate:null,manual:true};
}
function reverse(target,o={}){
 if(!Number.isSafeInteger(target)||target<=0||target>MAX)throw new Error('請輸入有效的整數實領金額');
 // Search each monotonic interval separately: thresholds can reduce net pay.
 const points=[0,5001,20000,20010,29500,44251,90501,10000001,MAX+1];let best=null;
 for(let i=0;i<points.length-1;i++){
  let low=Math.max(target,points[i]),high=points[i+1]-1;
  if(low>high||calculate(high,o).net<target)continue;
  while(low<high){const m=Math.floor((low+high)/2);if(calculate(m,o).net>=target)high=m;else low=m+1;}
  for(let g=Math.max(target,points[i],low-8);g<=Math.min(points[i+1]-1,low+8);g++){const c=calculate(g,o);if(c.net>=target&&(!best||c.gross<best.gross))best=c;}
 }
 if(!best)throw new Error('反算後給付總額超出工具上限');return best;
}
const api={calculate,reverse,manual,MAX};if(typeof module!=='undefined')module.exports=api;root.LaborCalc=api;
})(typeof window==='undefined'?globalThis:window);
