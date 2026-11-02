const assert=require('node:assert/strict');const {calculate:c,reverse:r}=require('../docs/calc.js');
assert.deepEqual(c(30000),{gross:30000,tax:3000,health:633,net:26367,rate:10});
for(const [g,t,h] of [[19999,0,0],[20000,0,422],[20009,0,422],[20010,2001,422]]){assert.equal(c(g).tax,t);assert.equal(c(g).health,h);}
assert.equal(c(90500,{type:'50'}).tax,0);assert.equal(c(90501,{type:'50'}).tax,4525);
assert.equal(c(29499,{type:'50'}).health,0);assert.equal(c(29500,{type:'50'}).health,622);
assert.equal(c(44250,{type:'50',resident:'nonresident'}).rate,6);assert.equal(c(44251,{type:'50',resident:'nonresident'}).rate,18);
assert.equal(c(40000,{type:'50',resident:'nonresident',monthTotal:50000}).rate,18);
assert.equal(c(5000,{type:'9B',resident:'nonresident'}).tax,0);assert.equal(c(5001,{type:'9B',resident:'nonresident'}).tax,1000);
assert.equal(c(30000,{health:'exempt'}).health,0);assert.equal(c(20000,{health:'vulnerable'}).health,0);assert.equal(c(10000001).health,211000);
assert.equal(c(20009,{type:'91'}).tax,0);assert.equal(c(20010,{type:'91'}).tax,2001);
assert.equal(c(1000,{type:'91',resident:'nonresident'}).tax,200);assert.equal(c(30000,{type:'91'}).health,0);
for(const type of ['9A90','9A92'])assert.deepEqual(c(30000,{type}),c(30000,{type:'9A'}));
assert.deepEqual(c(5001,{type:'9B98',resident:'nonresident'}),c(5001,{type:'9B',resident:'nonresident'}));
for(const resident of ['resident','nonresident'])assert.deepEqual(c(30000,{type:'scholarship',resident}),{gross:30000,tax:0,health:0,net:30000,rate:0});
let checks=0;
for(const type of ['9A','9B','50','9A90','9A92','9B98','91','scholarship'])for(const resident of ['resident','nonresident'])for(const health of ['normal','exempt','vulnerable']){
 const o={type,resident,health};const oracle=new Int32Array(120001);let maxNet=0;
 for(let g=1;g<=160000;g++){const n=c(g,o).net;for(let t=maxNet+1;t<=Math.min(n,120000);t++)oracle[t]=g;maxNet=Math.max(maxNet,n);}
 for(let target=1;target<=120000;target+=41){assert.equal(r(target,o).gross,oracle[target],JSON.stringify({target,o}));checks++;}
 for(const boundary of [5000,20000,20010,29500,44250,90501])for(let target=boundary-25;target<=boundary+25;target++){assert.equal(r(target,o).gross,oracle[target]);checks++;}
}
assert.throws(()=>c(-1));assert.throws(()=>r(0));assert.throws(()=>c(1.5));
for(const target of [9999999,10000000,10000001,50000000]){const a=r(target);assert.ok(a.net>=target);for(let g=a.gross-5;g<a.gross;g++)assert.ok(c(g).net<target);}
console.log('Passed threshold checks and '+checks+' reverse-calculation comparisons against exhaustive gross-pay search.');
