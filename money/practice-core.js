/* Trading practice only. No quote API, broker connection, order execution or notifications.
   Append-only events retain original plans, corrections and evidence. Money: cents;
   ETF price: integer 0.001 CNY ticks; amount rounds once after multiplication. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TradingPractice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='money-route.practice.v1',VERSION='1.1.0';
const HOLIDAYS=[['2026-01-01','2026-01-03'],['2026-02-15','2026-02-23'],['2026-04-04','2026-04-06'],['2026-05-01','2026-05-05'],['2026-06-19','2026-06-21'],['2026-09-25','2026-09-27'],['2026-10-01','2026-10-07']];
const CALENDAR_SOURCE='https://www.sse.com.cn/disclosure/announcement/general/c/c_20251222_10802507.shtml';
const TOPICS=['价格与涨跌幅：找到收盘价和前收盘价，自己算一次涨跌幅','成交量与比较：对照前一完整交易日和沪深300，分清事实与推测','委托与成交：先写计划；条件不齐时继续观察或练习撤单','T+1与可卖数量：总持仓不等于可卖数量','浮亏、费用与净损益：分别算含费和不含费结果','事实和推测：为原假设各找一条支持与反对证据','退出与时间：按实际成交日计算第5个持有交易日','单笔复盘：对照计划、执行、费用与情绪','换例子再算：用没见过的虚构价格独立算损益，不必开仓','阶段回顾：检查证据，选择下一阶段，不自动实盘'];
const SKILLS={rules:'独立解释限价、撤单、委托/成交、T+1与可卖数量',math:'独立计算新案例的含费损益，并解释止损不是保证成交价',discipline:'先计划后操作，识别偏差并完成纠正练习',risk:'能接受损失，理解1000元预算/50元暂停，不以回本为任务',account:'本人合法证券账户、ETF权限、如实风险测评已核实',schedule:'已安排能执行的持仓检查时间'};
const clone=o=>JSON.parse(JSON.stringify(o));
function fail(s){throw Error(s);}
function text(v,name,max=3000,optional=false){if(typeof v!=='string'||v.length>max||(!optional&&!v.trim()))fail(name+'需要真实文字记录');return v.trim();}
function integer(v,lo,hi,name){if(!Number.isSafeInteger(v)||v<lo||v>hi)fail(name+'超出范围');return v;}
function one(v,arr,name){if(!arr.includes(v))fail(name+'无效');return v;}
function date(s){if(typeof s!=='string'||!/^20\d\d-\d\d-\d\d$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
function stamp(s){return typeof s==='string'&&/^20\d\d-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{3})?)?(?:Z|\+08:00|\+07:00)$/.test(s)&&!isNaN(new Date(s));}
function marketDate(s){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));}
function tradingDay(s){if(!date(s)||s.slice(0,4)!=='2026')return null;const w=new Date(s+'T12:00:00Z').getUTCDay();return w!==0&&w!==6&&!HOLIDAYS.some(([a,b])=>s>=a&&s<=b);}
function addDay(s,n){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function tradingDays(a,b){if(!date(a)||!date(b)||a>b)return null;let n=0;for(let s=a;s<=b;s=addDay(s,1)){const t=tradingDay(s);if(t===null)return null;if(t)n++;}return n;}
function nextTrading(s){for(let i=1;i<370;i++){const d=addDay(s,i),t=tradingDay(d);if(t===null)return null;if(t)return d;}return null;}
function nthTrading(s,n){if(tradingDay(s)!==true)return null;let d=s;for(let i=1;i<n;i++){d=nextTrading(d);if(!d)return null;}return d;}
function fixed(s,scale){s=String(s).trim();const dp=scale===1000?3:2;if(!new RegExp('^\\d+(?:\\.\\d{1,'+dp+'})?$').test(s))return null;const parts=s.split('.'),v=Number(parts[0])*scale+Number(((parts[1]||'')+'0'.repeat(dp)).slice(0,dp));return Number.isSafeInteger(v)&&v<=100000000? v:null;}
function amount(price,qty){return Math.round(price*qty/10);}
function initial(){return {app:'money-route-practice',format:1,currency:'CNY',moneyUnit:'cents',priceUnit:'milliCny',events:[]};}
function base(){return {mode:'simulation',setup:null,settings:{timezone:'Asia/Ho_Chi_Minh',buyFee:500,sellFee:500,feeStatus:'hypothetical',feeSource:'尚未核实：流程演练占位',verifiedDate:null,reason:'初始演练设置'},settingsHistory:[],observations:[],plans:[],orders:[],fills:[],reviews:[],evidence:[],questions:[],decisions:[],funding:null,paused:{simulation:false,live:false},pauseReasons:{simulation:'',live:''},taskStates:{},audit:[]};}
function latestObservations(s){return s.observations.filter(o=>!s.observations.some(x=>x.supersedes===o.id)).sort((a,b)=>a.date.localeCompare(b.date));}
function observationCount(s,until='9999-99-99'){return new Set(latestObservations(s).filter(o=>o.date<=until&&tradingDay(o.date)===true).map(o=>o.date)).size;}
function planBy(s,id){const p=s.plans.find(p=>p.id===id);if(!p)fail('找不到关联计划');return p;}
function orderBy(s,id){const o=s.orders.find(o=>o.id===id);if(!o)fail('找不到关联委托');return o;}
function snapshot(p){return p.versions[p.versions.length-1];}
function fees(s,f){const o=orderBy(s,f.orderId),p=planBy(s,o.planId),v=p.versions[o.version-1];if(f.fee!==null)return f.fee;const total=o.side==='buy'?v.buyFee:v.sellFee;return total===null?null:Math.round(total*f.qty/o.qty);}
function trade(s,p,on){let qty=0,bought=0,sold=0,cost=0,revenue=0,priceTotal=0,unknown=false,estimated=false,first=null,manual=false;
 const fills=s.fills.filter(f=>orderBy(s,f.orderId).planId===p.id).sort((a,b)=>new Date(a.time)-new Date(b.time)||a.id.localeCompare(b.id));
 for(const f of fills){const o=orderBy(s,f.orderId),fee=fees(s,f);if(fee===null)unknown=true;if(f.feeStatus!=='confirmed')estimated=true;if(o.origin==='manual')manual=true;
  if(o.side==='buy'){qty+=f.qty;bought+=f.qty;priceTotal+=f.price*f.qty;cost+=amount(f.price,f.qty)+(fee||0);if(!first)first=marketDate(f.time);}
  else {const saleDay=marketDate(f.time),sameDay=fills.filter(b=>orderBy(s,b.orderId).side==='buy'&&marketDate(b.time)>=saleDay&&new Date(b.time)<=new Date(f.time)).reduce((n,b)=>n+b.qty,0);if(tradingDay(saleDay)!==true||f.qty>qty-sameDay)fail('实际成交日期违反T+1或交易日历待核实，请核对');qty-=f.qty;sold+=f.qty;revenue+=amount(f.price,f.qty)-(fee||0);if(qty<0)fail('成交记录出现卖出超过持仓');}
 }
 const avg=bought?priceTotal/bought:null,day=on||marketDate(new Date().toISOString());
 const locked=fills.filter(f=>orderBy(s,f.orderId).side==='buy'&&marketDate(f.time)>=day).reduce((a,f)=>a+f.qty,0);
 const remainingCost=bought?cost-Math.round(cost*sold/bought):0;
 const lastCorrection=s.audit.filter(a=>a.type==='fill_correction'&&a.planId===p.id).slice(-1)[0];
 const review=s.reviews.filter(r=>r.planId===p.id).slice(-1)[0];
 return {qty,bought,sold,cost:unknown?null:cost,revenue:unknown?null:revenue,avg,first,sellable:tradingDay(day)===true?Math.max(0,qty-locked):tradingDay(day)===false?0:null,remainingCost:unknown?null:remainingCost,net:bought&&qty===0&&!unknown?revenue-cost:null,estimated,manual,closed:bought>0&&qty===0,review,reviewStale:!!(lastCorrection&&review&&lastCorrection.sequence>review.sequence),downRaw:avg===null?null:avg*.97,upRaw:avg===null?null:avg*1.04,down:avg===null?null:Math.floor(avg*.97),up:avg===null?null:Math.ceil(avg*1.04),holdingDays:first?tradingDays(first,day):0,exitDate:first?nthTrading(first,5):null};
}
function orderState(s,o){const filled=s.fills.filter(f=>f.orderId===o.id).reduce((a,f)=>a+f.qty,0);return {filled,remaining:o.qty-filled,status:filled===o.qty?'filled':o.terminal||(filled?'partial':'submitted')};}
function account(s,mode,on){const ps=s.plans.filter(p=>p.mode===mode),active=ps.map(p=>({p,t:trade(s,p,on)}));const initial=mode==='simulation'?100000:(s.funding?100000:0);let cash=initial,unknown=false,estimated=false,freeze=0,hold=0,manual=false;
 for(const {p,t} of active){if(t.cost===null||t.revenue===null)unknown=true;cash-=(t.cost||0);cash+=(t.revenue||0);hold+=t.qty;estimated=estimated||t.estimated;manual=manual||t.manual;}
 for(const o of s.orders.filter(o=>planBy(s,o.planId).mode===mode&&o.side==='buy')){const z=orderState(s,o);if(['submitted','partial'].includes(z.status)){const v=planBy(s,o.planId).versions[o.version-1];if(v.buyFee===null)unknown=true;freeze+=amount(o.price,z.remaining)+Math.round((v.buyFee||0)*z.remaining/o.qty);}}
 const quote=latestObservations(s).filter(o=>!on||o.date<=on).slice(-1)[0]||null;let value=hold===0?0:(quote&&quote.price!==null?amount(quote.price,hold):null);
 const marketValueKnown=value!==null&&!unknown,eq=marketValueKnown?cash+value:null;
 const position=active.find(x=>x.t.qty>0),sellEstimate=position?snapshot(position.p).sellFee:0;
 const liquidation=eq===null||sellEstimate===null?null:eq-sellEstimate;
 return {initial,cash:unknown?null:cash,available:unknown?null:cash-freeze,frozen:freeze,qty:hold,equity:eq,liquidation,net:active.some(x=>x.t.bought)?(eq===null?null:eq-initial):null,estimate:estimated||!!position,unknown,manual,quote,position,pauseHit:liquidation!==null&&initial-liquidation>=5000,closed:active.filter(x=>x.t.closed).length,unreviewed:active.find(x=>x.t.closed&&(!x.t.review||x.t.reviewStale))};
}
function proof(s,key){return s.evidence.filter(e=>e.skill===key).slice(-1)[0];}
function ready(s){const a=account(s,'simulation');return observationCount(s)>=10&&a.closed>=1&&!a.unreviewed&&Object.keys(SKILLS).every(k=>{const e=proof(s,k);return e&&e.level==='independent';})&&s.settings.feeStatus==='verified';}
function blocks(s,p,day){const v=snapshot(p),a=account(s,p.mode,day),r=[];
 if(!s.setup)r.push('先完成准备证据');if(observationCount(s,day)<2)r.push('先记录两个实际交易日');
 if(tradingDay(day)!==true)r.push('当日休市或交易日历待核实');
 if(s.paused[p.mode]||a.pauseHit)r.push('已暂停新买入');if(a.qty>0)r.push('已有持仓，不补仓');
 if(s.orders.some(o=>planBy(s,o.planId).mode===p.mode&&['submitted','partial'].includes(orderState(s,o).status)))r.push('先处理现有委托');
 if(a.unreviewed)r.push('先完成上一笔复盘');if(a.closed>=2)r.push('首阶段最多两个回合，先阶段总结');
 if(p.mode==='simulation'&&s.setup&&s.setup.support!=='supported'&&v.origin!=='manual')r.push('平台支持未核实；只能继续观察或明确手工模拟');
 if(v.buyFee===null||v.sellFee===null)r.push('费用未知，不能判定预算');if(a.available===null||amount(v.price,100)+(v.buyFee||0)>a.available)r.push('100份加买费超出可用现金，不能增加预算');
 if(p.mode==='live'&&(!s.funding||!ready(s)))r.push('实盘准备/资金确认尚未齐全');return r;
}
function apply(s,e,seq){const d=e.data;const record=Object.assign({},clone(d),{id:e.id,at:e.at,sequence:seq});
 if(!d||typeof d!=='object'||Array.isArray(d))fail('事件数据无效');
 if(e.type==='setup'){one(d.support,['unverified','supported','unsupported'],'平台支持');text(d.platform,'平台',100);text(d.evidence,'准备证据');text(d.capital,'虚拟本金检查',300);one(d.delay,['unknown','delayed','realtime'],'行情延迟');if(d.simulationConfirmed!==true)fail('先确认模拟标识');s.setup=record;}
 else if(e.type==='settings'){one(d.timezone,['Asia/Ho_Chi_Minh','Asia/Shanghai'],'时区');one(d.feeStatus,['unknown','hypothetical','verified'],'费用状态');for(const k of ['buyFee','sellFee'])if(d[k]!==null)integer(d[k],0,100000,'费用');if(d.feeStatus!=='unknown'&&(d.buyFee===null||d.sellFee===null))fail('费用不能为空');text(d.reason,'设置变更原因');text(d.feeSource,'费用依据');if(d.feeStatus==='verified'&&(!date(d.verifiedDate)||d.verifiedDate>marketDate(e.at)))fail('需要真实已发生的核实日期');s.settings=record;s.settingsHistory.push(record);}
 else if(e.type==='observation'){if(!date(d.date)||tradingDay(d.date)!==true)fail('观察必须对应已核实的实际交易日');if(d.date>marketDate(e.at))fail('不能补写未来观察');text(d.source,'行情来源',300);if(!stamp(d.quoteTime)||marketDate(d.quoteTime)!==d.date)fail('行情时间必须对应观察日并注明时区');if(new Date(d.quoteTime)>new Date(e.at))fail('行情时间不能来自未来');one(d.delay,['unknown','delayed','realtime'],'延迟状态');for(const k of ['fact','guess','counter','next','emotion','index','volume','unit','action'])text(d[k],k,3000);if(d.price!==null)integer(d.price,1,100000000,'ETF价格');if(d.previous!==null)integer(d.previous,1,100000000,'前收盘价');if(d.supersedes){const old=s.observations.find(o=>o.id===d.supersedes);if(!old||old.date!==d.date||s.observations.some(o=>o.supersedes===d.supersedes))fail('报价纠错关联无效');text(d.reason,'纠错原因');}else if(latestObservations(s).some(o=>o.date===d.date))fail('该日期已有记录，请用纠错并保留原记录');s.observations.push(record);}
 else if(e.type==='plan'){if(!date(d.date)||d.date>marketDate(e.at)||!stamp(d.quoteTime)||new Date(d.quoteTime)>new Date(e.at))fail('计划日期或行情时间无效/来自未来');integer(d.price,1,100000000,'限价');one(d.origin,['platform','manual'],'练习来源');if(s.mode==='live'&&d.origin==='manual')fail('手工假设只能用于模拟，不能标成实盘');for(const k of ['fact','guess','reason','source','checks'])text(d[k],k,3000);if(marketDate(d.quoteTime)!==d.date)fail('需要同日行情时间及北京时间时区');one(d.delay,['unknown','delayed','realtime'],'行情延迟');const v=Object.assign(record,{buyFee:s.settings.buyFee,sellFee:s.settings.sellFee,feeStatus:s.settings.feeStatus,feeSource:s.settings.feeSource,budget:100000,qty:100,downPercent:3,upPercent:4,maxDays:5,pauseLoss:5000});
  if(d.planId){const p=planBy(s,d.planId);if(s.orders.some(o=>o.planId===p.id))fail('已有委托的计划快照不能改；纠正实际记录或在下一笔新建计划');text(d.changeReason,'版本变更原因');p.versions.push(v);}else s.plans.push({id:e.id,mode:s.mode,versions:[v]});}
 else if(e.type==='order'){const p=planBy(s,d.planId),v=snapshot(p);one(d.side,['buy','sell'],'方向');if(!date(d.date))fail('委托日期无效');if(d.date>marketDate(e.at))fail('不能登记未来委托');integer(d.price,1,100000000,'委托价格');integer(d.qty,1,100,'份额');one(d.origin,['platform','manual'],'成交来源');text(d.source,'委托来源',500);text(d.reference,'外部委托标识（非账号）',200);
  if(p.mode==='live'&&d.origin==='manual')fail('手工模拟不能登记为真实委托');if(d.origin!==v.origin)fail('委托来源须与计划一致');if(s.orders.some(o=>o.origin===d.origin&&o.reference===d.reference&&planBy(s,o.planId).mode===p.mode))fail('委托标识已登记，不能重复');
  if(d.side==='buy'){if(d.qty!==100)fail('第一阶段买入计划只用100份');if(d.date!==v.date)fail('买入委托日期与计划行情日期不同，请重新写当天计划');if(s.orders.some(o=>o.planId===p.id))fail('本计划已有委托；撤单后重新建计划');const rs=blocks(s,p,d.date);if(rs.length)fail(rs.join('；'));if(d.price>v.price)fail('委托价不能高于计划最高买价');}
  else {const t=trade(s,p,d.date);if(t.sellable===null)fail('日历待核实，暂不能判定可卖数量');const reserved=s.orders.filter(o=>o.planId===p.id&&o.side==='sell'&&['submitted','partial'].includes(orderState(s,o).status)).reduce((a,o)=>a+orderState(s,o).remaining,0);if(d.qty>t.sellable-reserved)fail('超过可卖数量或已被卖出委托占用；T+1/休市不推进');}
  s.orders.push(Object.assign(record,{version:p.versions.length,terminal:null}));}
 else if(e.type==='order_status'){const o=orderBy(s,d.orderId);one(d.status,['cancelled','failed'],'状态');text(d.reason,'撤单或失败原因');if(orderState(s,o).filled===o.qty)fail('已经全部成交，不能撤销成交');o.terminal=d.status;o.updates=(o.updates||[]).concat(record);}
 else if(e.type==='fill'||e.type==='fill_correction'){const o=orderBy(s,d.orderId),p=planBy(s,o.planId);integer(d.price,1,100000000,'成交价格');integer(d.qty,1,100,'成交份额');if(!stamp(d.time)||marketDate(d.time)<o.date||new Date(d.time)>new Date(e.at))fail('成交时间无效、早于委托或来自未来');text(d.source,'成交依据');text(d.reference,'成交标识',200);one(d.feeStatus,['unknown','estimated','confirmed'],'费用状态');if(d.fee!==null)integer(d.fee,0,100000,'本条成交分摊费用');if(d.feeStatus==='confirmed'&&d.fee===null)fail('核实费用不能留空');if(d.fee===null&&d.feeStatus!=='unknown')fail('留空费用必须标为待核实');if(d.confirmed!==true)fail('需要本人核对登记');
  const old=e.type==='fill_correction'?s.fills.find(f=>f.id===d.fillId):null;if(e.type==='fill_correction'){if(!old||old.orderId!==o.id)fail('纠错成交关联无效');text(d.reason,'成交纠错原因');}
  if(s.fills.some(f=>f.id!==(old&&old.id)&&f.reference===d.reference&&planBy(s,orderBy(s,f.orderId).planId).mode===p.mode))fail('相同成交标识不能重复登记');
  if(!old&&o.terminal&&new Date(d.time)>new Date(o.updates[o.updates.length-1].at))fail('不能登记撤单之后的新成交；补记此前成交须写实际时间');
  const replacement=Object.assign(record,{id:old?old.id:e.id});if(old)s.fills[s.fills.indexOf(old)]=replacement;else s.fills.push(replacement);
  if(s.fills.filter(f=>f.orderId===o.id).reduce((a,f)=>a+f.qty,0)>o.qty)fail('累计成交不能超过委托数量');
  s.audit.push({id:e.id,type:e.type,planId:p.id,sequence:seq,reason:d.reason||'',original:old?clone(old):null});
  trade(s,p,marketDate(d.time));const a=account(s,p.mode,marketDate(d.time));if(a.cash!==null&&a.cash<0)fail('成交支出超出训练账本现金，请核对实际费用/数量；本模块不追加本金');}
 else if(e.type==='review'){const p=planBy(s,d.planId),t=trade(s,p);if(!t.closed)fail('持仓未归零，不能完成整笔复盘');for(const k of ['known','execution','attribution','emotion','improvement','quality'])text(d[k],k);s.reviews.push(record);}
 else if(e.type==='evidence'){if(!SKILLS[d.skill])fail('能力项目无效');one(d.level,['explained','tried','independent'],'掌握方式');text(d.content,'证据内容');text(d.source,'证据来源');s.evidence.push(record);}
 else if(e.type==='question'){text(d.question,'待学问题',1000);text(d.answer,'回答',3000,true);s.questions.push(record);}
 else if(e.type==='task'){text(d.taskId,'任务ID',80);one(d.status,['not_started','in_progress','completed','skipped','paused'],'任务状态');text(d.evidence,'状态依据',3000,d.status==='not_started');s.taskStates[d.taskId]=record;}
 else if(e.type==='pause'){one(d.mode,['simulation','live'],'模式');text(d.reason,'暂停原因');s.paused[d.mode]=true;s.pauseReasons[d.mode]=d.reason;}
 else if(e.type==='decision'){one(d.choice,['continue_simulation','pause','long_term_only','maintain_live'],'阶段选择');text(d.reason,'选择原因');if(d.choice==='maintain_live'&&s.mode!=='live')fail('尚未选择实盘，不能跳过准备');if(d.choice==='continue_simulation'&&s.mode==='live'&&(account(s,'live').qty||s.orders.some(o=>planBy(s,o.planId).mode==='live'&&['submitted','partial'].includes(orderState(s,o).status))))fail('先处理实盘委托和持仓，再切回模拟');if(d.choice==='pause'||d.choice==='long_term_only'){s.paused[s.mode]=true;s.pauseReasons[s.mode]=d.reason;}if(d.choice==='continue_simulation')s.mode='simulation';s.decisions.push(record);}
 else if(e.type==='live'){if(d.confirmed!==true||!ready(s))fail('能力证据/费用核实不完整，不能切实盘记录');if(account(s,'simulation').qty||s.orders.some(o=>['submitted','partial'].includes(orderState(s,o).status)))fail('先结束现有委托和持仓');text(d.reason,'本人选择依据');s.mode='live';s.decisions.push(record);}
 else if(e.type==='funding'){if(s.mode!=='live'||s.funding)fail('只登记一次已确认的实盘内部划转，禁止追加/重置');if(d.amount!==100000||d.confirmed!==true)fail('需本人确认1000元内部划转');text(d.source,'归属现金账户名称（不要账号）',200);text(d.reference,'内部转账关联ID',200);s.funding=record;}
 else fail('不支持的记录类型');
 for(const mode of ['simulation','live']){const a=account(s,mode,marketDate(e.at));if(a.pauseHit){s.paused[mode]=true;s.pauseReasons[mode]='保守清算估计触及50元暂停参考；非保证损失上限';}}
 return s;
}
function replay(p){if(!p||p.app!=='money-route-practice'||p.format!==1||p.currency!=='CNY'||p.moneyUnit!=='cents'||p.priceUnit!=='milliCny'||!Array.isArray(p.events)||p.events.length>1500)fail('交易练习备份格式无效');const s=base(),seen=new Set();p.events.forEach((e,i)=>{if(!e||typeof e.id!=='string'||!/^p[A-Za-z0-9_-]{1,80}$/.test(e.id)||seen.has(e.id)||!stamp(e.at))fail('记录标识或时间无效/重复');seen.add(e.id);apply(s,e,i);});return s;}
function dispatch(p,type,data,at=new Date().toISOString(),id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)){const next=clone(p);next.events.push({id,at,type,data:clone(data)});replay(next);return next;}
function exitCheck(s,p,on){const t=trade(s,p,on),q=latestObservations(s).filter(o=>o.date<=on).slice(-1)[0];if(!t.qty)return '没有持仓';if(t.sellable===0)return '当前休市或T+1不可卖；不把无法退出算违纪';if(t.holdingDays!==null&&t.holdingDays>=5)return '已到/超过第5个持有交易日，安排退出并登记实际结果；未成交继续处理';if(q&&q.price!==null&&q.date>=t.first&&(q.price<=t.downRaw||q.price>=t.upRaw))return '已记录报价触及退出参考，先核实当前报价与可卖数量，再处理退出；历史报价不是成交价';return '按约定时间检查报价和可卖数量，不采用未知的即时行情';}
function nextTask(s,on){const a=account(s,s.mode,on);if(a.unreviewed)return {id:'review_'+a.unreviewed.p.id,page:'review',text:'先完成上一笔复盘；盈利也不增加交易次数',minutes:10};if(s.paused[s.mode]||a.pauseHit)return {id:'paused',page:a.qty?'trades':'review',text:a.qty?'暂停新买入，按计划处理已有持仓并补记录':'已暂停：复盘，再决定是否继续模拟',minutes:10};if(a.position)return {id:'holding_'+a.position.p.id,page:'trades',text:exitCheck(s,a.position.p,on)+'；北京10:00 / 14:40（越南09:00 / 13:40）',minutes:10};if(s.orders.some(o=>planBy(s,o.planId).mode===s.mode&&['submitted','partial'].includes(orderState(s,o).status)))return {id:'order_check',page:'trades',text:'核对委托与实际成交；未成交不算持仓',minutes:5};if(!s.setup)return {id:'setup',page:'settings',text:'打开模拟工具，确认“模拟”标识，搜索510300并记录支持情况',minutes:10};const n=observationCount(s);if(n<10)return {id:'D'+(n+1),page:'observe',text:TOPICS[n],minutes:10};return {id:'competency',page:'route',text:'核对能力证据，生成AI摘要，选择下一阶段；不为凑次数交易',minutes:20};}
function stage(s){if(s.mode==='live')return 'S4 小额实盘记录（本人选择）';if(!s.setup)return 'S0 准备中';const n=observationCount(s);return n<2?'S1 两天观察':n<10?'S2 流程演练（允许空仓）':'S3 能力检查 / S5 阶段总结';}
function handover(p,on){const s=replay(p),a=account(s,s.mode,on),n=nextTask(s,on);let lines=['# 交易练习 · AI 接手','请继续一小步教学，不重做整套计划。盈利不是通关标准。','当前模式：'+(s.mode==='simulation'?'模拟记录':'实盘记录')+'；'+stage(s),'初始预算：1000元；不追加、不重置亏损；同时最多一笔；首阶段最多两回合。','产品：510300 沪深300ETF华泰柏瑞；平台支持：'+(s.setup?s.setup.support:'未核实'),'费用：'+JSON.stringify(s.settings),'提醒：未启用；无行情监控、券商连接或下单能力。','实际观察：'+observationCount(s)+'个交易日；订单'+s.orders.length+'；成交记录'+s.fills.length+'。','资金：'+JSON.stringify(a,(k,v)=>['p','position','unreviewed'].includes(k)?undefined:v),'暂停：'+s.paused[s.mode]+'；'+s.pauseReasons[s.mode],'报价日期/时间/来源：'+(a.quote?`${a.quote.date} / ${a.quote.quoteTime} / ${a.quote.source} / ${a.quote.delay}`:'待核实'),'模拟不进入真实资产；实盘仅本人确认内部划转，原现金不能再重复计入。','3% / 4% / 5个交易日、50元为未验证的流程参数，不保证成交或损失上限。'];
 for(const o of latestObservations(s).slice(-10))lines.push(`观察 ${o.date}：事实 ${o.fact}；推测 ${o.guess}；反证 ${o.counter}；下一步 ${o.next}；价格 ${o.price===null?'未知':(o.price/1000).toFixed(3)}；来源 ${o.source} ${o.quoteTime}（${o.delay}）`);
 for(const plan of s.plans){lines.push('计划 '+plan.id+' '+plan.mode+'；全部版本：'+JSON.stringify(plan.versions));lines.push('持仓/退出口径：'+JSON.stringify(trade(s,plan,on)));}
 lines.push('委托（不等于成交）：'+JSON.stringify(s.orders),'实际登记成交（含手工未经撮合/估算费用）：'+JSON.stringify(s.fills),'复盘：'+JSON.stringify(s.reviews),'技能证据（读过不等于独立）：'+JSON.stringify(s.evidence),'任务状态与证据：'+JSON.stringify(s.taskStates),'未理解的问题：'+JSON.stringify(s.questions),'阶段选择：'+JSON.stringify(s.decisions),'审计纠错：'+JSON.stringify(s.audit),'下一步只做：'+n.text,'请分清事实、推测和未知。先示范，再让我用自己的话解释；每次只问一个核心问题。不要索取账号密码、替我下单或因盈利提高本金。手工模拟不能证明真实下单能力。');return lines.join('\n\n');}
return {KEY,VERSION,CALENDAR_SOURCE,TOPICS,SKILLS,initial,replay,dispatch,date,stamp,marketDate,tradingDay,tradingDays,nextTrading,nthTrading,fixed,amount,latestObservations,observationCount,planBy,orderBy,snapshot,trade,orderState,account,blocks,ready,exitCheck,nextTask,stage,handover};
});
