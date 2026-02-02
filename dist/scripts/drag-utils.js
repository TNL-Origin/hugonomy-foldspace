export function makeDraggable(el) {
  let drag=false, sx=0, sy=0, st=0, sr=0;
  const move=e=>{
    if(!drag)return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    el.style.top=`${Math.max(8,st+dy)}px`;
    el.style.right=`${Math.max(8,sr-dx)}px`;
  };
  const up=()=>{drag=false;window.removeEventListener('mousemove',move,true);window.removeEventListener('mouseup',up,true);};
  el.addEventListener('mousedown',e=>{
    drag=true;
    sx=e.clientX; sy=e.clientY;
    st=parseFloat(getComputedStyle(el).top)||16;
    sr=parseFloat(getComputedStyle(el).right)||16;
    window.addEventListener('mousemove',move,true);
    window.addEventListener('mouseup',up,true);
  });
}
