const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('docs/index.html','utf8'),js=fs.readFileSync('docs/app.js','utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]),elements=Object.fromEntries(ids.map(id=>[id,{value:''}]));
assert.equal(ids.length,new Set(ids).size);
for(const match of js.matchAll(/(?:\$|value|cell)\('([^']+)'\)/g))assert.ok(elements[match[1]],'Missing field '+match[1]);
let selected='9A90';elements.form.querySelector=()=>({value:selected});
Object.assign(elements.resident,{value:'local'});elements.date.value='2026-10-07';elements.health.value='normal';
for(const [id,value] of Object.entries({bank:'銀行測試／808',branch:'分行測試／0123',account:'001234567890',accountName:'測試戶名<&>',payment:'銀行匯款'}))elements[id].value=value;
const context=vm.createContext({document:{getElementById:id=>elements[id]},Intl,LaborRules:require('../docs/rules.js')});vm.runInContext(js.slice(0,js.indexOf('function update()')),context);
const identityLabels=['本國籍','外國籍（在台滿183天）','外國籍（在台未滿183天）'];
for(const [i,identity] of ['local','foreign_over183','foreign_under183'].entries()){
 elements.resident.value=identity;
 const doc=vm.runInContext('buildDocument({gross:30000,tax:3000,health:633,net:26367,rate:10})',context);
 assert.ok(doc.includes(identityLabels[i]));assert.ok(doc.includes('115 年度扣款規則'));assert.ok(doc.includes('每次給付金額'));assert.ok(doc.includes('無健保投保資格：免扣'));for(const label of ['銀行名稱／代碼','分行名稱／代碼','帳號','戶名'])assert.ok(doc.includes(label));
 for(const text of ['銀行測試／808','分行測試／0123','001234567890','測試戶名&lt;&amp;&gt;'])assert.ok(doc.includes(text));
 assert.equal(vm.runInContext('options().resident',context),i===2?'nonresident':'resident');
}
for(const id of ['bank','branch','account','accountName'])elements[id].value='';
for(const type of ['50','9A90','91','9B98','9A92','scholarship']){
 selected=type;const doc=vm.runInContext('buildDocument({gross:0,tax:0,health:0,net:0,rate:0})',context);
 assert.ok(doc.includes(type==='scholarship'?'獎助學金':type));
 for(const label of ['銀行名稱／代碼','分行名稱／代碼','帳號','戶名'])assert.ok(doc.includes(label));
}
selected='manual';elements.customType.value='自訂類別<&>';
const manualResult=require('../docs/calc.js').manual(30000,1200,500);
context.manualResult=manualResult;
const manualDoc=vm.runInContext('buildDocument(manualResult)',context);
assert.ok(manualDoc.includes('<th>申報類別</th><td colspan="3">自訂類別&lt;&amp;&gt;</td>'));
assert.ok(manualDoc.includes('<th>扣繳所得稅</th><td>1,200 元</td>'));
assert.ok(manualDoc.includes('<th>補充保費</th><td>500 元</td>'));
assert.ok(manualDoc.includes('<th>實領金額</th><td colspan="3" class="doc-money">新臺幣 28,300 元</td>'));
assert.ok(!manualDoc.includes('單據編號')&&!html.includes('receiptNo')&&!js.includes('receiptNo'));
assert.ok(html.includes('value="manual"')&&!html.includes('value="blank"'));
const {manual}=require('../docs/calc.js');
assert.equal(manual(30000,0,0).net,30000);
assert.equal(manual(30000,30000,0).net,0);
assert.throws(()=>manual(30000,30000,1));
assert.throws(()=>manual(30000,-1,0));
assert.throws(()=>manual(30000,1.5,0));
assert.throws(()=>manual(30000,NaN,0));
console.log('Custom report label is escaped; manual deductions and net pay print correctly; invalid deductions are rejected.');
console.log('Three identity mappings, all six report types, four bank fields (filled and blank), and escaped document output verified.');
