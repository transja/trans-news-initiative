import{a9 as E,aa as m,K as V,e as k,ab as j,i as $,ac as q,ad as B,ae as N,af as C,ag as U,ah as G,ai as S,q as y,n as I,k as K,x as p,aj as x,ak as z,al as F,am as J,an as Q,ao as X,ap as Z,v as rr,p as er,a8 as tr,j as L,a as ar,G as M,g as nr}from"./BqKjY28P.js";import{b as ir,r as sr}from"./B0fnLvsP.js";import{m as ur,b as or,g as fr,a as cr}from"./CwtQo-Fh.js";const lr=["touchstart","touchmove"];function dr(r){return lr.includes(r)}function _r(r){var e=V,a=k;E(null),m(null);try{return r()}finally{E(e),m(a)}}const H=new Set,O=new Set;function hr(r,e,a,n={}){function i(t){if(n.capture||g.call(e,t),!t.cancelBubble)return _r(()=>a==null?void 0:a.call(this,t))}return r.startsWith("pointer")||r.startsWith("touch")||r==="wheel"?B(()=>{e.addEventListener(r,i,n)}):e.addEventListener(r,i,n),i}function yr(r,e,a,n,i){var t={capture:n,passive:i},o=hr(r,e,a,t);(e===document.body||e===window||e===document)&&q(()=>{e.removeEventListener(r,o,t)})}function wr(r){for(var e=0;e<r.length;e++)H.add(r[e]);for(var a of O)a(r)}function g(r){var A;var e=this,a=e.ownerDocument,n=r.type,i=((A=r.composedPath)==null?void 0:A.call(r))||[],t=i[0]||r.target,o=0,_=r.__root;if(_){var l=i.indexOf(_);if(l!==-1&&(e===document||e===window)){r.__root=e;return}var h=i.indexOf(e);if(h===-1)return;l<=h&&(o=l)}if(t=i[o]||r.target,t!==e){j(r,"currentTarget",{configurable:!0,get(){return t||a}});var T=V,f=k;E(null),m(null);try{for(var s,u=[];t!==null;){var c=t.assignedSlot||t.parentNode||t.host||null;try{var d=t["__"+n];if(d!==void 0&&(!t.disabled||r.target===t))if($(d)){var[W,...Y]=d;W.apply(t,[r,...Y])}else d.call(t,r)}catch(b){s?u.push(b):s=b}if(r.cancelBubble||c===e||c===null)break;t=c}if(s){for(let b of u)queueMicrotask(()=>{throw b});throw s}}finally{r.__root=e,delete r.currentTarget,E(T),m(f)}}}function Er(r,e){var a=e==null?"":typeof e=="object"?e+"":e;a!==(r.__t??(r.__t=r.nodeValue))&&(r.__t=a,r.nodeValue=a+"")}function vr(r,e){return P(r,e)}function mr(r,e){N(),e.intro=e.intro??!1;const a=e.target,n=L,i=p;try{for(var t=C(a);t&&(t.nodeType!==8||t.data!==U);)t=G(t);if(!t)throw S;y(!0),I(t),K();const o=P(r,{...e,anchor:t});if(p===null||p.nodeType!==8||p.data!==x)throw z(),S;return y(!1),o}catch(o){if(o===S)return e.recover===!1&&F(),N(),J(a),y(!1),vr(r,e);throw o}finally{y(n),I(i),sr()}}const v=new Map;function P(r,{target:e,anchor:a,props:n={},events:i,context:t,intro:o=!0}){N();var _=new Set,l=f=>{for(var s=0;s<f.length;s++){var u=f[s];if(!_.has(u)){_.add(u);var c=dr(u);e.addEventListener(u,g,{passive:c});var d=v.get(u);d===void 0?(document.addEventListener(u,g,{passive:c}),v.set(u,1)):v.set(u,d+1)}}};l(Q(H)),O.add(l);var h=void 0,T=X(()=>{var f=a??e.appendChild(Z());return rr(()=>{if(t){er({});var s=tr;s.c=t}i&&(n.$$events=i),L&&ir(f,null),h=r(f,n)||{},L&&(k.nodes_end=p),t&&ar()}),()=>{var c;for(var s of _){e.removeEventListener(s,g);var u=v.get(s);--u===0?(document.removeEventListener(s,g),v.delete(s)):v.set(s,u)}O.delete(l),f!==a&&((c=f.parentNode)==null||c.removeChild(f))}});return R.set(h,T),h}let R=new WeakMap;function Tr(r,e){const a=R.get(r);return a?(R.delete(r),a(e)):Promise.resolve()}let w=!1,D=Symbol();function Sr(r,e,a){const n=a[e]??(a[e]={store:null,source:ur(void 0),unsubscribe:M});if(n.store!==r&&!(D in a))if(n.unsubscribe(),n.store=r??null,r==null)n.source.v=void 0,n.unsubscribe=M;else{var i=!0;n.unsubscribe=or(r,t=>{i?n.source.v=t:cr(n.source,t)}),i=!1}return r&&D in a?fr(r):nr(n.source)}function Nr(){const r={};function e(){q(()=>{for(var a in r)r[a].unsubscribe();j(r,D,{enumerable:!1,value:!0})})}return[r,e]}function Lr(r){var e=w;try{return w=!1,[r(),w]}finally{w=e}}export{Er as a,Sr as b,Lr as c,wr as d,yr as e,mr as h,vr as m,Nr as s,Tr as u};
