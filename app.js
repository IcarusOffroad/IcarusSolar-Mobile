'use strict';
const $=id=>document.getElementById(id), rad=Math.PI/180, syn=29.530588853;
const store=()=>{try{return JSON.parse(localStorage.getItem('icarusSolar')||'{}')}catch{return {}}};
let settings=store(), lat=Number.isFinite(settings.lat)?settings.lat:40.4713, lon=Number.isFinite(settings.lon)?settings.lon:-105.0709, showMarks=settings.marks!==false;
let selected=new Date();selected.setHours(12,0,0,0);
const addDays=(d,n)=>{let x=new Date(d);x.setDate(x.getDate()+n);return x};
const dayNumber=d=>(d-new Date(d.getFullYear(),0,1))/86400000;
function solarPosition(d){let y=d.getFullYear(),days=(new Date(y+1,0,1)-new Date(y,0,1))/86400000,g=2*Math.PI/days*(dayNumber(d)+.5);return {eq:229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g)),dec:(.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g))/rad}}
function solarEvent(d,alt){let {eq,dec}=solarPosition(d),phi=lat*rad,delta=dec*rad,cosH=(Math.sin(alt*rad)-Math.sin(phi)*Math.sin(delta))/(Math.cos(phi)*Math.cos(delta));let offset=-new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTimezoneOffset(),noon=720-4*lon-eq+offset;let base=new Date(d.getFullYear(),d.getMonth(),d.getDate());const at=mins=>new Date(base.getTime()+mins*60000);if(cosH>1||cosH< -1)return {rise:null,set:null,noon:at(noon),daylight:null};let half=4*Math.acos(Math.max(-1,Math.min(1,cosH)))/rad;return {rise:at(noon-half),set:at(noon+half),noon:at(noon),daylight:half*2}}
const time=d=>d?d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'—';
const diff=n=>`${n>=0?'+':'−'}${Math.floor(Math.abs(n))}m ${String(Math.round((Math.abs(n)%1)*60)).padStart(2,'0')}s`;
function moonPhase(d){let epoch=Date.UTC(2000,0,6,18,14),t=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),12);return (((t-epoch)/86400000/syn)%1+1)%1}
function moonName(p){return p<.025||p>=.975?'New moon':p<.225?'Waxing crescent':p<.275?'First quarter':p<.475?'Waxing gibbous':p<.525?'Full moon':p<.725?'Waning gibbous':p<.775?'Last quarter':'Waning crescent'}
function moonSvg(p){let r=15,c=17,k=Math.cos(2*Math.PI*p),wax=p<.5,pts=[];for(let i=0;i<=48;i++){let y=-r+2*r*i/48,e=Math.sqrt(Math.max(0,r*r-y*y));pts.push(`${c+(wax?e:-e)},${c+y}`)}for(let i=48;i>=0;i--){let y=-r+2*r*i/48,e=Math.sqrt(Math.max(0,r*r-y*y));pts.push(`${c+(wax?k*e:-k*e)},${c+y}`)}return `<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="#11151a" stroke="#858b92"/><path d="M${pts.join(' L')}Z" fill="#e4e7ea"/></svg>`}
// Low-precision lunar ephemeris: ecliptic longitude/latitude, equatorial position,
// then local sidereal time and horizon crossings. All calculations are offline.
// Rise/set are estimates; terrain, refraction and lunar parallax affect exact times.
function lunarAltitudeDegrees(instant,latitude,longitude){
  const jd=instant.getTime()/86400000+2440587.5, days=jd-2451545;
  const L=(218.316+13.176396*days)*rad, M=(134.963+13.064993*days)*rad;
  const F=(93.272+13.229350*days)*rad, lambda=L+6.289*rad*Math.sin(M);
  const beta=5.128*rad*Math.sin(F), eps=23.4397*rad;
  const ra=Math.atan2(Math.sin(lambda)*Math.cos(eps)-Math.tan(beta)*Math.sin(eps),Math.cos(lambda));
  const dec=Math.asin(Math.sin(beta)*Math.cos(eps)+Math.cos(beta)*Math.sin(eps)*Math.sin(lambda));
  const gmst=(280.46061837+360.98564736629*days)*rad;
  const hourAngle=gmst+longitude*rad-ra, phi=latitude*rad;
  return Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(hourAngle))/rad;
}
function lunarEvents(date){
  const start=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const end=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1);
  // Approximate geocentric altitude of Moon's upper limb at apparent horizon.
  // Parallax (~0.95°) minus refraction (~0.57°) and semidiameter (~0.27°).
  const crossingAltitude=0.11, step=5*60000;
  const altitude=ms=>lunarAltitudeDegrees(new Date(ms),lat,lon)-crossingAltitude;
  let rise=null,set=null,prevTime=start.getTime(),prev=altitude(prevTime);
  for(let t=Math.min(prevTime+step,end.getTime());t<=end.getTime();t=Math.min(t+step,end.getTime())){
    const cur=altitude(t);
    if((prev<0&&cur>=0)||(prev>0&&cur<=0)){
      let lo=prevTime,hi=t;
      for(let i=0;i<20;i++){const mid=(lo+hi)/2;
        if((altitude(mid)>=0)===(prev>=0))lo=mid;else hi=mid;
      }
      const event=new Date((lo+hi)/2);
      if(prev<0&&cur>=0&&rise===null)rise=event;
      if(prev>0&&cur<=0&&set===null)set=event;
    }
    if(t===end.getTime())break;
    prevTime=t;prev=cur;
  }
  return {rise,set};
}
function illuminationPercent(date){const p=moonPhase(date);return Math.round((1-Math.cos(2*Math.PI*p))*50)}
function moonWithPercent(date){return moonSvg(moonPhase(date))+`<small class="moonPercent">${illuminationPercent(date)}%</small>`}
function period(d,a,b){let x=solarEvent(d,a),y=solarEvent(d,b);return `${time(x.rise)} – ${time(y.rise)}\n${time(y.set)} – ${time(x.set)}`}
function save(){localStorage.setItem('icarusSolar',JSON.stringify({lat,lon,marks:showMarks}));}
const map=(eq,dec)=>[220+eq/22*145,196-dec/26*145];
const fmtDay=d=>d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
function draw(){const svg=$('graphics'),year=selected.getFullYear();let lines=[],months=[],marks=[],callouts=[];for(let d=new Date(year,0,1,12),i=0;d.getFullYear()===year;d=addDays(d,1),i++){let p=solarPosition(d),[x,y]=map(p.eq,p.dec);lines.push(`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`);if(d.getDate()===1){months.push(`<circle cx="${x}" cy="${y}" r="2.7" fill="#b5d7e2"/><text x="${x+(d.getMonth()<3||d.getMonth()>8?-30:9)}" y="${y+13}" fill="#c8cbd1" font-size="10">${d.toLocaleString('en-US',{month:'short'}).toUpperCase()}</text>`)}if(showMarks){let ph=moonPhase(d),prev=moonPhase(addDays(d,-1)),kind=ph<.018||ph>.982?'NEW':Math.abs(ph-.5)<.018?'FULL':null;if(kind&&!(kind==='NEW'?(prev<.018||prev>.982):Math.abs(prev-.5)<.018)){marks.push(`<circle cx="${x}" cy="${y}" r="4.4" fill="${kind==='FULL'?'#24272d':'#6b717b'}" stroke="#d8dde3" stroke-width="1.5"/>`);if(Math.abs((d-selected)/86400000)<45)callouts.push({x,y,text:`${kind} ${d.toLocaleString('en-US',{month:'short',day:'numeric'}).toUpperCase()}`})}}}
let base=`<path d="${lines.join(' ')}" fill="none" stroke="#4db9d6" stroke-width="2.5"/>`;
for(let [m,day,label] of [[2,20,'MAR EQUINOX'],[5,21,'JUN SOL'],[8,22,'SEP EQUINOX'],[11,21,'DEC SOL']]){let p=solarPosition(new Date(year,m,day,12)),[x,y]=map(p.eq,p.dec);base+=`<circle cx="${x}" cy="${y}" r="4" fill="#eebd66"/><text x="${m===2?x-94:x+7}" y="${y-8}" fill="#d9c38b" font-size="9">${label}</text>`}
callouts.sort((a,b)=>a.y-b.y);let last=-999;for(let c of callouts){let y=Math.max(c.y,last+16);y=Math.min(y,372);last=y;let right=c.x>=210,tx=right?355:8,ex=right?350:84;base+=`<path d="M${c.x},${c.y} L${ex},${y}" stroke="#777d85" stroke-dasharray="2 2" fill="none"/><text x="${tx}" y="${y+3}" font-size="9" fill="#cbd0d6" text-anchor="${right?'start':'start'}">${c.text}</text>`}
let p=solarPosition(selected),[cx,cy]=map(p.eq,p.dec);svg.innerHTML=`<path d="M220 20V365 M70 196H370" stroke="#525960" stroke-dasharray="3 5"/>${base}${months.join('')}${marks.join('')}<circle cx="${cx}" cy="${cy}" r="8" fill="#f8c85b" stroke="#fff1b7" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="2.4" fill="#31353b"/>`;}
function update(){let today=new Date(),t=solarEvent(selected,-.833),now=solarEvent(today,-.833),y=solarEvent(addDays(selected,-1),-.833),n=solarEvent(addDays(selected,1),-.833),p=moonPhase(selected);$('todayHeader').textContent=today.toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();$('rise').textContent=time(t.rise);$('set').textContent=time(t.set);$('selected').textContent=fmtDay(selected);$('daylight').textContent=t.daylight==null?'Polar day/night':`${Math.floor(t.daylight/60)}h ${String(Math.floor(t.daylight%60)).padStart(2,'0')}m`;$('noon').textContent=time(t.noon);$('yesterday').textContent='Yesterday '+(t.daylight!=null&&y.daylight!=null?diff(t.daylight-y.daylight):'—');$('tomorrow').textContent='Tomorrow '+(t.daylight!=null&&n.daylight!=null?diff(n.daylight-t.daylight):'—');$('moonPrev').innerHTML=moonWithPercent(addDays(selected,-1));$('moonNow').innerHTML=moonWithPercent(selected);$('moonNext').innerHTML=moonWithPercent(addDays(selected,1));let lunar=lunarEvents(selected);$('moonrise').textContent=time(lunar.rise);$('moonset').textContent=time(lunar.set);$('phase').textContent=moonName(p);$('illum').textContent=`${Math.round((1-Math.cos(2*Math.PI*p))*50)}% illuminated`;$('golden').textContent=period(selected,-4,6);$('blue').textContent=period(selected,-6,-4);$('coords').textContent=`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;$('lat').value=lat.toFixed(6);$('lon').value=lon.toFixed(6);$('moonMarks').checked=showMarks;draw()}
function apply(){let a=$('lat').value.trim(),b=$('lon').value.trim(),combo=a.includes(',')?a:b.includes(',')?b:null;if(combo){[a,b]=combo.split(',').map(s=>s.trim())}let la=Number(a),lo=Number(b);if(!a||!b||!Number.isFinite(la)||!Number.isFinite(lo)||Math.abs(la)>90||Math.abs(lo)>180){$('status').textContent='Invalid latitude or longitude.';return}lat=la;lon=lo;save();update();$('status').textContent='Location saved for offline use.'}
function gps(){if(!navigator.geolocation){$('status').textContent='Geolocation unavailable in this browser.';return}$('status').textContent='Requesting location…';navigator.geolocation.getCurrentPosition(p=>{lat=p.coords.latitude;lon=p.coords.longitude;save();update();$('status').textContent=`GPS fix saved (±${Math.round(p.coords.accuracy)} m).`},e=>{$('status').textContent=`GPS unavailable: ${e.message}. You can enter coordinates manually.`},{enableHighAccuracy:true,timeout:25000,maximumAge:60000})}
$('prev').onclick=()=>{selected=addDays(selected,-1);update()};$('next').onclick=()=>{selected=addDays(selected,1);update()};$('reset').onclick=()=>{selected=new Date();selected.setHours(12,0,0,0);update()};$('apply').onclick=apply;$('gps').onclick=gps;$('locBtn').onclick=gps;$('moonMarks').onchange=e=>{showMarks=e.target.checked;save();draw()};document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key)){selected=addDays(selected,['ArrowRight','ArrowUp'].includes(e.key)?1:-1);update();e.preventDefault()}});let sx=null;$('plot').addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});$('plot').addEventListener('touchend',e=>{if(sx==null)return;let dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>35){selected=addDays(selected,dx<0?1:-1);update()}sx=null});update();if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
