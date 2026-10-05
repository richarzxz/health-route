(function(){
'use strict';
const C=TradingPractice,G=TradingGuide,$=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderHome(){try{const raw=localStorage.getItem(C.KEY),s=C.replay(raw?JSON.parse(raw):C.initial()),on=C.marketDate(new Date().toISOString()),g=G.get(C,s,on),mode=s.mode==='live'?'实盘记录':'模拟练习';
 $('#home-now').innerHTML=`<p class="eyebrow">现在只做一件事 · ${mode}</p><h2>${esc(g.title)}</h2><p class="why">${esc(g.why)}</p>${g.wait?`<p class="hint">${esc(g.wait)}</p>`:''}<ol>${g.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><a class="btn" href="practice.html#${g.page}">${esc(g.button)} →</a><p class="hint">约 ${g.task.minutes} 分钟 · ${s.mode==='live'?'只登记本人已经发生的操作':'1000元虚拟预算，不计真实资产'}</p><details><summary>为什么这样做</summary><p class="why">${esc(g.explain)}</p></details>`;
 $('#home-stage').textContent=C.stage(s).replace(/S\d /g,'')+' · '+(s.mode==='live'?'本人主动选择的实盘记录':'默认模拟，不自动转实盘');$('#home-progress-count').textContent=g.n+' / 10 个实际观察日';const current=s.mode==='live'?3:!s.setup?0:g.n<2?1:g.n<10?2:3;$('#home-route').innerHTML=['准备工具','两天观察','流程演练',s.mode==='live'?'实盘记录':'阶段检查'].map((x,i)=>`<span class="${i===current?'current':i<current?'past':''}">${x}</span>`).join('');
 }catch(e){$('#home-now').innerHTML='<p class="eyebrow">先恢复记录</p><h2>练习数据暂时读不出来</h2><p class="hint">原记录仍保留。请到设置导出原始数据，再联系维护。</p><a class="btn" href="practice.html#settings">打开恢复入口</a>';$('#home-stage').textContent='数据读取异常，未覆盖原记录。';}}
function openBudget(){const box=$('#budget-space');box.open=true;box.scrollIntoView({behavior:'smooth',block:'start'});}
$('#open-budget').addEventListener('click',openBudget);if(location.hash==='#budget-space')openBudget();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderHome();});window.addEventListener('storage',e=>{if(e.key===C.KEY)renderHome();});renderHome();
})();
