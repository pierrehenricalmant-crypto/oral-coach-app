import{a as h,b as m,d as y,g as b}from"./api-GJ1cdwsG.js";const f=sessionStorage.getItem("oralCoach.level")||"",s=document.getElementById("level-filter"),c=document.getElementById("empty-state"),d=document.getElementById("dashboard-table"),r=document.getElementById("dashboard-body"),p={grammar:"Grammaire",vocabulary:"Vocabulaire",prosody:"Prosodie",pronunciation:"Prononciation"},o={};async function v(t){if(!(t in o))try{const{units:n}=await b(t);o[t]=n.length}catch{o[t]=null}return o[t]}const $=4;function w(t){return t!=null&&t.length?t.slice(0,$).map(n=>{const e=p[n.category]||n.category,a=n.subcategory?`${e} — ${n.subcategory}`:e;return`<span class="error-badge" title="${a}">${a} (${n.count})</span>`}).join(" "):'<span class="hint">—</span>'}async function l(){const t=s.value,{students:n}=await y(t||void 0);if(n.length===0){d.hidden=!0,c.hidden=!1;return}c.hidden=!0,d.hidden=!1,r.innerHTML="";for(const e of n){const a=await v(e.level),u=a?`${e.unitsTested}/${a}`:`${e.unitsTested}`,g=a?Math.round(e.unitsTested/a*100):0,i=document.createElement("tr");i.innerHTML=`
      <td>${e.firstName}${e.lastInitial?" "+e.lastInitial+".":""}</td>
      <td>${e.level}</td>
      <td>
        <div class="progress-bar"><div class="progress-bar__fill" style="width: ${g}%"></div></div>
        <span class="hint">${u}</span>
      </td>
      <td>${e.unitsTested}</td>
      <td>${w(e.topErrors)}</td>
    `,r.appendChild(i)}}s.value=f;s.addEventListener("change",l);h().then(({code:t})=>(document.getElementById("context-line").textContent=t,l())).catch(()=>{window.location.href="/oral-coach-app/"});document.getElementById("btn-logout").addEventListener("click",async()=>{try{await m()}finally{sessionStorage.removeItem("oralCoach.level"),window.location.href="/oral-coach-app/"}});
