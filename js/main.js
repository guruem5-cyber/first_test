"use strict";
const chapters = ["about", "gallery", "knitting", "reading", "learning"];
const state = new Map();
const $ = id => document.getElementById(id);
function node(tag, text = "", cls = "") { const e = document.createElement(tag); e.textContent = text; e.className = cls; return e; }
function photoImage(photo) { const img = node("img"); img.src = photo.url; img.alt = photo.title; return img; }
function render(key) {
 const s = state.get(key), pages = Math.max(1, Math.ceil(s.photos.length / 3));
 s.page = Math.min(Math.max(s.page, 0), pages - 1); s.grid.replaceChildren();
 const visible = s.photos.slice(s.page * 3, s.page * 3 + 3);
 for (const photo of visible) {
  const card = node("button", "", "card"), thumb = node("div", "", "thumb"), copy = node("div", "", "copy");
  card.type = "button"; thumb.append(photoImage(photo)); copy.append(node("small", photo.date), node("h3", photo.title)); card.append(thumb, copy);
  card.addEventListener("click", () => { const d = $("detail-content"), h = node("h2", photo.title), t = node("div", "", "thumb"); h.id = "detail-title"; t.append(photoImage(photo)); d.replaceChildren(t, h, node("p", photo.date)); $("detail").showModal(); }); s.grid.append(card);
 }
 if (!visible.length) for (let i=0;i<3;i++) { const card=node("div","","card"), copy=node("div","","copy"); copy.append(node("small","사진 추가 예정"),node("h3","등록된 사진 없음")); card.append(node("div","◇","thumb"),copy); s.grid.append(card); }
 s.number.textContent = `${s.page+1} / ${pages}`; s.prev.disabled = s.page===0; s.next.disabled = s.page===pages-1; s.status.textContent = `images/${key}/ · ${s.photos.length}개 이미지`;
}
for (const key of chapters) {
 const root = document.querySelector(`[data-chapter="${key}"]`), grid=node("div","","grid"), paging=node("div","","paging"), prev=node("button","이전"), next=node("button","다음"), number=node("span"), status=node("p","","gallery-status");
 status.setAttribute("role","status"); number.setAttribute("aria-live","polite"); paging.append(prev,number,next); root.replaceChildren(status,grid,paging); state.set(key,{photos:[],page:0,grid,prev,next,number,status});
 prev.onclick=()=>{state.get(key).page--;render(key)}; next.onclick=()=>{state.get(key).page++;render(key)}; render(key);
}
const picker = $("image-folder"), message = $("folder-message");
picker.addEventListener("change", () => {
 const groups = new Map(chapters.map(k=>[k,[]])); let recognized=0;
 for (const file of picker.files) {
  const parts = file.webkitRelativePath.split("/");
  const index = parts.findIndex((part,i)=>part.toLowerCase()==="images" && i<parts.length-2);
  const key = index>=0 ? parts[index+1].toLowerCase() : parts[0].toLowerCase();
  if (!groups.has(key)) continue;
  recognized++;
  if (!/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)) continue;
  groups.get(key).push(file);
 }
 if (!recognized && picker.files.length) { message.textContent="images 폴더 또는 그 상위 portfolio 폴더를 선택해 주세요. 기존 화면은 유지됩니다."; picker.value=""; return; }
 let total=0;
 for (const [key,files] of groups) {
  const s=state.get(key); for(const photo of s.photos) if(photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);
  s.photos=files.sort((a,b)=>a.webkitRelativePath.localeCompare(b.webkitRelativePath,"ko",{numeric:true})).map(file=>({url:URL.createObjectURL(file),title:file.name.replace(/\.[^.]+$/,""),date:new Date(file.lastModified).toLocaleDateString("ko-KR")})); s.page=0; total+=s.photos.length; render(key);
 }
 message.textContent=`총 ${total}개 이미지 연결 완료. 파일 추가·삭제 후 같은 폴더를 다시 선택하세요.`; picker.value="";
});
$("choose-folder").addEventListener("click",()=>picker.click());
$("clear-gallery").addEventListener("click",()=>{for(const [key,s] of state){for(const photo of s.photos)if(photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);s.photos=[];s.page=0;render(key)}message.textContent="화면의 연결만 초기화했습니다. 실제 파일은 삭제되지 않습니다."});

// Bundled demo images; selecting a folder replaces these entries.
for (const key of chapters) { const s=state.get(key); s.photos=Array.from({length:4},(_,i)=>({url:`images/${key}/${key}-0${i+1}.png`,title:`${key} sample ${i+1}`,date:"테스트 이미지"})); render(key); }
