'use strict';
const $=id=>document.getElementById(id),form=$('form'),money=n=>new Intl.NumberFormat('zh-TW').format(n),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const payerInfo=Object.freeze({name:'財團法人開放文化基金會',english:'Open Culture Foundation',email:'pay@ocf.tw'});
const types={'50':'非固定薪資','9A90':'執行業務報酬（其他）','91':'機會中獎獎金','9B98':'執行業務報酬（稿費／講演等）','9A92':'執行業務報酬（程式設計師）','scholarship':'獎助學金','manual':''};
const identityLabels={local:'本國籍',foreign_over183:'外國籍（在台滿183天）',foreign_under183:'外國籍（在台未滿183天）'};
const typeHelp={'manual':'請自行輸入申報類別、所得稅與補充保費金額；實領金額依填寫的扣款自動計算。','50':'本工具適用兼職／非每月給付薪資；一般月薪與在本單位投保員工獎金須另行計算。','9A90':'9A 業別代號 90：其他執行業務者。請依實際提供的專業勞務確認分類。','91':'競技、競賽及機會中獎獎金；不扣補充保費。本工具不適用統一發票與公益彩券等政府獎券的特殊扣繳規則。','9B98':'稿費、版稅、講演等 9B 所得。18 萬元免稅額屬年度結算規則，不是本次扣繳門檻；授課與講演請依實際內容區分。','9A92':'9A 業別代號 92：程式設計師，依執行業務所得計算；與 92 其他所得不同。','scholarship':'本選項限符合所得稅法第 4 條第 1 項第 8 款的免稅獎助學金，不扣所得稅及補充保費。若屬提供勞務的報酬，請改選薪資或執行業務類別。'};
let signature='',attachments=[],result=null,canvasUsed=false;
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function value(id){return $(id).value.trim();}
function pendingResult(gross){return {gross,tax:null,health:null,net:null,rate:null,pending:true};}
function options(){return {type:form.querySelector('input[name=type]:checked').value,identity:value('resident'),resident:value('resident')==='foreign_under183'?'nonresident':'resident',health:value('health'),monthTotal:Number(value('monthTotal'))||0};}
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error-note',error);}
function buildDocument(r){
 const o=options(),date=value('date'),roc=date?`${Number(date.slice(0,4))-1911} 年 ${Number(date.slice(5,7))} 月 ${Number(date.slice(8))} 日`:'＿＿＿年＿＿月＿＿日';
 const numberCell=n=>n===null?'＿＿＿＿＿＿':money(n);
 const cell=id=>esc(value(id)||'＿＿＿＿＿＿');
 const header=`<header class="doc-header ocf-header"><img class="doc-logo" src="assets/ocf-logo.png" alt="Open Culture Foundation Logo"><h2><span>開放文化基金會</span>領據／勞務報酬單</h2><div class="doc-identity"><strong>${esc(payerInfo.name)}</strong><span>${esc(payerInfo.english)}</span><span>E-mail：${esc(payerInfo.email)}</span></div></header>`;

 return `<article class="document">${header}<table><tbody><tr><th>所得人姓名</th><td>${cell('payee')}</td><th>生日</th><td>${cell('birthday')}<small class="doc-field-hint">非本國籍須填寫</small></td></tr><tr><th>身分證／居留證／護照號碼</th><td colspan="3">${cell('personId')}</td></tr><tr><th>戶籍地址</th><td colspan="3">${cell('payeeAddress')}<small class="doc-field-hint">需含鄰里，境外居住者請填寫英文現居地址</small></td></tr><tr><th>聯絡電話</th><td>${cell('phone')}</td><th>稅務身分</th><td>${identityLabels[o.identity]}</td></tr><tr><th>申報類別</th><td colspan="3">${o.type==='manual'?cell('customType'):(o.type==='scholarship'?'':esc(o.type)+' ')+types[o.type]}</td></tr><tr><th>勞務內容</th><td colspan="3">${cell('description')}</td></tr><tr><th>給付總額</th><td colspan="3" class="doc-money">新臺幣 ${money(r.gross)} 元</td></tr><tr><th>扣繳所得稅</th><td>${numberCell(r.tax)} 元${r.rate===null?'':`（${r.rate}%）`}</td><th>補充保費</th><td>${numberCell(r.health)} 元</td></tr><tr><th>實領金額</th><td colspan="3" class="doc-money">新臺幣 ${numberCell(r.net)} 元</td></tr><tr><th>給付方式</th><td colspan="3">${cell('payment')}</td></tr><tr><th>銀行名稱／代碼</th><td colspan="3">${cell('bank')}</td></tr><tr><th>分行名稱／代碼</th><td colspan="3">${cell('branch')}</td></tr><tr><th>帳號</th><td colspan="3">${cell('account')}</td></tr><tr><th>戶名</th><td colspan="3">${cell('accountName')}</td></tr>${['50','9A90','9A92','9B98'].includes(o.type)&&o.health==='exempt'?`<tr><th>健保免扣原因</th><td colspan="3">${cell('exemptReason')}</td></tr>`:''}${value('notes')?`<tr><th>備註</th><td colspan="3">${esc(value('notes')).replace(/\n/g,'<br>')}</td></tr>`:''}</tbody></table><div class="doc-sign"><p class="doc-sign-declaration">本人已審閱並確認${esc(payerInfo.name)}給付之報酬及上述勞務、扣款資訊，實領金額共計<strong>新臺幣 ${numberCell(r.net)} 元整</strong>。簽署即表示本人同意上述內容；實際付款及入帳情形依給付單位紀錄為準。</p><div class="doc-sign-content"><span>所得人簽章：</span>${signature?`<img src="${signature}" alt="所得人簽名">`:''}</div><div class="doc-sign-date">日期：民國 ${esc(roc)}</div></div><p class="doc-note">本單為勞務報酬紀錄，所得分類及扣免繳申報請依實際情況辦理。115 年度規則。</p>${LaborRules.render('document')}</article>${attachments.length?`<section class="attachment-page"><h3>勞務報酬單附件</h3><p>${cell('payee')}／${esc(date)}</p>${attachments.map(a=>`<img src="${a.data}" alt="證明附件">`).join('')}</section>`:''}`;
}
function update(){
 const o=options(),usesHealth=['50','9A90','9A92','9B98'].includes(o.type);$('healthRow').hidden=!usesHealth;$('health').disabled=!usesHealth;$('exemptRow').hidden=!usesHealth||o.health!=='exempt';$('exemptReason').required=usesHealth&&o.health==='exempt';$('monthRow').hidden=!(o.type==='50'&&o.resident==='nonresident');
 $('birthday').required=o.identity!=='local';$('birthdayRequired').hidden=o.identity==='local';
 $('typeHelp').textContent=typeHelp[o.type];
 const isManual=o.type==='manual';$('manualFields').hidden=!isManual;
 for(const id of ['customType','manualTax','manualHealth']){$(id).disabled=!isManual;$(id).required=isManual;}
 $('healthRate').textContent=isManual?'手動':'2.11%';
 if(o.type==='manual'&&$('reverse').checked){$('reverse').checked=false;$('amount').value='';}
 $('reverse').disabled=o.type==='manual';
 $('amountLabel').innerHTML=($('reverse').checked?'希望實領金額':'給付總額')+' <span class="required">*</span>';
 $('amountHelp').textContent=o.type==='manual'?'輸入給付總額，實領金額將扣除上方自行填寫的所得稅與補充保費。':$('reverse').checked?'反推可達目標的最低給付總額，已考慮扣款門檻及整數進位。':'輸入扣款前的報酬總額，金額以新臺幣整數計算。';
 let error='';try{
  const raw=value('amount');if(!raw){result=null;}else{const n=Number(raw);if(!Number.isSafeInteger(n)||n<=0||n>LaborCalc.MAX)throw Error('金額需為 1 至 100,000,000 的整數。');if(o.type==='manual'&&(!value('manualTax')||!value('manualHealth')))throw Error('請填寫所得稅與補充保費金額，不扣款請填 0。');result=o.type==='manual'?LaborCalc.manual(n,Number(value('manualTax')),Number(value('manualHealth'))):$('reverse').checked?LaborCalc.reverse(n,o):LaborCalc.calculate(n,o);}
  if(o.type==='50'&&o.resident==='nonresident'&&value('monthTotal')&&(!Number.isSafeInteger(o.monthTotal)||o.monthTotal<0||o.monthTotal>LaborCalc.MAX))throw Error('全月薪資總額需為有效整數。');
  if(result&&o.type==='50'&&o.resident==='nonresident'&&o.monthTotal&&o.monthTotal<result.gross)throw Error('全月薪資總額不可小於本次給付總額。');
  if(value('date')&&!value('date').startsWith('2026-'))throw Error('目前版本僅支援 115 年度（2026）給付。');
 }catch(e){error=e.message;result=null;}
 const r=result||(o.type==='manual'?pendingResult(0):{gross:0,tax:0,health:0,net:0,rate:0});$('net').textContent=r.net===null?'待確認':money(r.net);$('gross').textContent='NT$ '+money(r.gross);$('tax').textContent=r.tax===null?'待確認':'− NT$ '+money(r.tax);$('healthAmount').textContent=r.health===null?'待確認':'− NT$ '+money(r.health);$('taxRate').textContent=o.type==='manual'?'手動':r.rate===null?'':r.rate+'%';
 let note=error||(o.type==='manual'?(result?'依自行輸入的扣款金額計算，單據將列出自訂申報類別與金額。':'請填寫給付總額與自行輸入的扣款金額。'):!result?'填入金額，即可查看計算結果。':`本次${r.tax?'按 '+r.rate+'% 扣繳所得稅':'免扣繳所得稅'}；${r.health?'補充保費按 2.11% 計算':'未扣補充保費'}。`);
 if(result&&$('reverse').checked&&r.net!==Number(value('amount')))note+=` 整數反算後實領比目標多 ${r.net-Number(value('amount'))} 元。`;
 if(result&&o.type==='50'&&o.resident==='nonresident'&&!o.monthTotal)note+=' 全月薪資暫按本次給付計算。';
 $('calculationNote').textContent=note;$('print').disabled=!result;$('miniPreview').innerHTML=buildDocument(r);
 if($('previewDialog').open)$('fullDocument').innerHTML=buildDocument(r);
}
form.addEventListener('input',()=>{status('');update();});form.addEventListener('change',update);
function clearImages(){signature='';attachments=[];$('signature').value='';$('attachment').value='';$('signatureThumb').hidden=true;$('signatureThumb').removeAttribute('src');$('attachmentNames').textContent='';clearCanvas();update();}
function clearCanvas(){ctx.clearRect(0,0,$('canvas').width,$('canvas').height);canvasUsed=false;}
$('clearImages').onclick=clearImages;
$('reset').onclick=()=>{if(!confirm('清空目前表單與圖片？'))return;form.reset();$('date').value=today();clearImages();status('已清空表單。');update();};
$('example').onclick=()=>{if((value('payee')||value('amount'))&&!confirm('以虛構範例取代目前資料？'))return;form.reset();clearImages();form.querySelector('input[name=type][value="9A90"]').checked=true;const data={payee:'範例所得人',personId:'DEMO-ID',phone:'0000000000',payeeAddress:'範例市示範路 2 號',date:today(),description:'網站設計費（虛構範例）',amount:'30000',bank:'範例銀行／000',branch:'範例分行／0000',account:'000000000000',accountName:'範例所得人',notes:'此為示範資料，請替換為實際資料後開立。'};Object.entries(data).forEach(([k,v])=>$(k).value=v);status('已帶入虛構範例。');update();};
$('fullPreview').onclick=()=>{$('fullDocument').innerHTML=buildDocument(result||{gross:0,tax:0,health:0,net:0,rate:0});$('previewDialog').showModal();};$('closePreview').onclick=()=>$('previewDialog').close();
$('print').onclick=()=>{
 update();if(!result)return;for(const el of form.querySelectorAll('input:not([type=file]),select,textarea')){if(!el.checkValidity()){el.classList.add('invalid');el.scrollIntoView({behavior:'smooth',block:'center'});el.focus();el.reportValidity();status('請先填寫必填欄位並確認格式。');return;}el.classList.remove('invalid');}
 if(value('personId')==='DEMO-ID'){status('請先將範例替換為實際所得人資料。');return;}
 $('printDocument').innerHTML=buildDocument(result);document.title=`勞務報酬單-${value('payee')}-${value('date')}`;
 const imgs=[...$('printDocument').querySelectorAll('img')];Promise.all(imgs.map(i=>i.decode().catch(()=>{}))).then(()=>window.print());
};window.addEventListener('afterprint',()=>{document.title='勞務報酬單｜OCF Tools';});
function readImage(file){return new Promise((resolve,reject)=>{if(!['image/png','image/jpeg','image/webp'].includes(file.type))return reject(Error('請選擇 PNG、JPG 或 WebP 圖片。'));if(file.size>5*1024*1024)return reject(Error('每張圖片需小於 5 MB。'));const reader=new FileReader();reader.onerror=()=>reject(Error('圖片讀取失敗。'));reader.onload=()=>{const img=new Image();img.onload=()=>resolve({name:file.name,data:reader.result});img.onerror=()=>reject(Error('圖片無法解碼，請重新選擇。'));img.src=reader.result;};reader.readAsDataURL(file);});}
$('signature').onchange=async()=>{const f=$('signature').files[0];if(!f)return;try{const a=await readImage(f);signature=a.data;$('signatureThumb').src=signature;$('signatureThumb').hidden=false;status('簽名圖片已加入。');update();}catch(e){status(e.message);$('signature').value='';}};
$('attachment').onchange=async()=>{const files=[...$('attachment').files];if(files.length>2){status('附件最多 2 張，請重新選擇。');$('attachment').value='';return;}try{const next=await Promise.all(files.map(readImage));attachments=next;$('attachmentNames').textContent=next.map(a=>a.name).join('、');status('附件已加入，會列印在第二頁。');update();}catch(e){status(e.message);$('attachment').value='';}};
const canvas=$('canvas'),ctx=canvas.getContext('2d');let drawing=false;ctx.lineWidth=3;ctx.lineCap='round';ctx.strokeStyle='#222';function pos(e){const b=canvas.getBoundingClientRect();return [(e.clientX-b.left)*canvas.width/b.width,(e.clientY-b.top)*canvas.height/b.height];}
canvas.onpointerdown=e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const p=pos(e);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(p[0]+.1,p[1]+.1);ctx.stroke();canvasUsed=true;};canvas.onpointermove=e=>{if(!drawing)return;ctx.lineTo(...pos(e));ctx.stroke();};canvas.onpointerup=()=>drawing=false;canvas.onpointercancel=()=>drawing=false;
$('drawToggle').onclick=()=>{$('drawArea').hidden=!$('drawArea').hidden;};$('clearCanvas').onclick=clearCanvas;$('useCanvas').onclick=()=>{if(!canvasUsed){status('請先在簽名區簽名。');return;}signature=canvas.toDataURL('image/png');$('signatureThumb').src=signature;$('signatureThumb').hidden=false;$('drawArea').hidden=true;status('手寫簽名已套用。');update();};
$('deductionRules').innerHTML=LaborRules.render();
$('birthday').max=today();
$('date').value=today();update();
