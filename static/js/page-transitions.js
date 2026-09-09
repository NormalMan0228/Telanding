export function navigateTo(url){
 const overlay=document.getElementById("page-jam");
 if(!overlay?.animate||matchMedia("(prefers-reduced-motion: reduce)").matches){location.assign(url);return;}
 if(overlay.dataset.busy)return;
 overlay.dataset.busy="true";overlay.hidden=false;
 const animation=overlay.animate([{opacity:0,transform:"translateX(0)"},{opacity:.85,transform:"translateX(-2%)",offset:.25},{opacity:.65,transform:"translateX(1%)",offset:.5},{opacity:1,transform:"translateX(0)"}],{duration:380,easing:"steps(5,end)",fill:"forwards"});
 animation.finished.catch(()=>{}).then(()=>location.assign(url));
}
document.addEventListener("click",event=>{
 const link=event.target.closest?.("a[href]");
 if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute("download")||link.getAttribute("aria-disabled")==="true")return;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search)return;
 event.preventDefault();navigateTo(url.href);
});
window.addEventListener("pageshow",()=>{
 const overlay=document.getElementById("page-jam");if(!overlay)return;
 overlay.getAnimations?.().forEach(animation=>animation.cancel());overlay.hidden=true;delete overlay.dataset.busy;
});
