/* ===== محرك اللعبة: Runtime (يستخدم في المحرر وفي اللعبة المُصدَّرة) ===== */
var BASE = { model:[1,1,1], cube:[1,1,1], sphere:[1,1,1], cylinder:[1,1,1], cone:[1,1,1], plane:[1,0.1,1], player:[0.8,1.6,0.8], coin:[0.8,0.8,0.2], enemy:[1,1,1], goal:[1,2,1], light:[0.3,0.3,0.3], torus:[1.2,1.2,0.4], text:[2,1,0.05], particles:[1,1,1], water:[1,0.1,1] };
var TYPE_AR = { cube:'مكعب', sphere:'كرة', cylinder:'أسطوانة', cone:'مخروط', plane:'أرضية', player:'لاعب', coin:'عملة', enemy:'عدو', goal:'هدف', light:'ضوء', torus:'حلقة', text:'لافتة نص', particles:'جسيمات', water:'ماء' };

function makeTex(THREE, kind, color){
  var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
  g.fillStyle = color || '#fff'; g.fillRect(0,0,128,128);
  if(kind === 'checker'){ g.fillStyle = 'rgba(0,0,0,0.22)'; for(var i=0;i<4;i++)for(var j=0;j<4;j++) if((i+j)%2===0) g.fillRect(i*32,j*32,32,32); }
  else if(kind === 'grid'){ g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.strokeRect(1,1,126,126); }
  else if(kind === 'bricks'){ g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 3; for(var r=0;r<4;r++){ g.strokeRect(0,r*32,128,32); var off = r%2? 0:32; g.beginPath(); g.moveTo(off+32,r*32); g.lineTo(off+32,r*32+32); g.moveTo(off+96,r*32); g.lineTo(off+96,r*32+32); g.stroke(); } }
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeSky(THREE, kind, color){
  var c = document.createElement('canvas'); c.width = 8; c.height = 256; var g = c.getContext('2d'), gr = g.createLinearGradient(0,0,0,256);
  var stops = { day:['#3b8de0','#9fd4ff','#e6f4ff'], sunset:['#2b1055','#d4506b','#ffb347'], night:['#02030f','#0b1030','#1c2a5a'], dawn:['#5a6fd6','#f4a6c0','#ffe0b0'], space:['#000005','#0a0a22','#1a1040'] }[kind];
  stops.forEach(function(s,i){ gr.addColorStop(i/(stops.length-1), s); }); g.fillStyle = gr; g.fillRect(0,0,8,256);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { tex:t, fog: stops[stops.length-1] };
}
function makeStars(THREE, n){
  var pos = new Float32Array(n*3); for(var i=0;i<n;i++){ var a = Math.random()*Math.PI*2, b = Math.random()*1.2+0.1, r = 300; pos[i*3] = Math.cos(a)*Math.cos(b)*r; pos[i*3+1] = Math.sin(b)*r; pos[i*3+2] = Math.sin(a)*Math.cos(b)*r; }
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  return new THREE.Points(g, new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false}));
}
function makeTextTex(THREE, text, color){
  var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d');
  g.fillStyle = 'rgba(10,12,30,0.72)'; g.beginPath(); if(g.roundRect) g.roundRect(6,6,500,244,28); else g.rect(6,6,500,244); g.fill(); g.strokeStyle = color; g.lineWidth = 5; g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
  var lines = String(text||'').split('\n'), fs = lines.length > 2 ? 44 : 64; g.font = 'bold ' + fs + 'px Tahoma, Arial, sans-serif';
  var maxW = 0; lines.forEach(function(l){ maxW = Math.max(maxW, g.measureText(l).width); }); if(maxW > 460){ fs = Math.floor(fs*460/maxW); g.font = 'bold ' + fs + 'px Tahoma, Arial, sans-serif'; }
  lines.forEach(function(l,i){ g.fillText(l, 256, 128 + (i - (lines.length-1)/2) * (fs*1.2)); });
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeWaterTex(THREE){
  var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'); g.fillStyle = '#2aa3e8'; g.fillRect(0,0,128,128); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 3;
  for(var y=16;y<128;y+=32){ g.beginPath(); for(var x=0;x<=128;x+=8){ g.lineTo(x, y + Math.sin((x/128)*Math.PI*2)*6); } g.stroke(); }
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
/* جسيمات */
function makeParticles(THREE, o){
  var n = o.kind === 'snow' ? 260 : o.kind === 'smoke' ? 60 : 140, kind = o.kind || 'fire';
  var pos = new Float32Array(n*3), col = new Float32Array(n*3), st = [];
  for(var i=0;i<n;i++) st.push({age: Math.random()*2, life: 0.8 + Math.random()*1.2, x:0,y:0,z:0, vx:0, vy:0, vz:0});
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos,3)); g.setAttribute('color', new THREE.BufferAttribute(col,3));
  var add = kind === 'fire' || kind === 'sparkle';
  var m = new THREE.PointsMaterial({ size: kind==='smoke'?0.55: kind==='snow'?0.14:0.22, vertexColors:true, transparent:true, opacity: kind==='smoke'?0.5:1, depthWrite:false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
  var p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.ps = { n:n, kind:kind, st:st, base:new THREE.Color(o.color||'#ffffff') };
  respawnAll(p.userData.ps); return p;
}
function respawn(ps, s, first){
  s.age = first ? Math.random()*s.life : 0; s.x = Math.random()-0.5; s.z = Math.random()-0.5;
  if(ps.kind === 'fire'){ s.life = 0.7 + Math.random()*0.8; s.y = Math.random()*0.15; s.vx = (Math.random()-0.5)*0.15; s.vz = (Math.random()-0.5)*0.15; s.vy = 0.6 + Math.random()*0.6; s.x *= 0.5; s.z *= 0.5; }
  else if(ps.kind === 'snow'){ s.life = 2.5 + Math.random()*2; s.y = 1; s.vx = (Math.random()-0.5)*0.1; s.vz = (Math.random()-0.5)*0.1; s.vy = -0.28; }
  else if(ps.kind === 'smoke'){ s.life = 2.2 + Math.random()*1.5; s.y = 0; s.vx = 0.04+Math.random()*0.06; s.vz = (Math.random()-0.5)*0.05; s.vy = 0.3 + Math.random()*0.2; s.x *= 0.3; s.z *= 0.3; }
  else { s.life = 1 + Math.random()*1.5; s.y = Math.random(); s.vx = s.vy = s.vz = 0; }
}
function respawnAll(ps){ ps.st.forEach(function(s){ respawn(ps, s, true); }); }
function stepParticles(p, dt){
  var ps = p.userData.ps; if(!ps) return; var pos = p.geometry.attributes.position.array, col = p.geometry.attributes.color.array, c = ps.base;
  for(var i=0;i<ps.n;i++){
    var s = ps.st[i]; s.age += dt; if(s.age >= s.life) respawn(ps, s, false);
    s.x += s.vx*dt; s.y += s.vy*dt; s.z += s.vz*dt; var k = s.age/s.life, r, g, b;
    if(ps.kind === 'fire'){ r = 1; g = Math.max(0, 0.9 - k*0.8); b = Math.max(0, 0.3 - k); var f = 1 - k; r *= f; g *= f; b *= f; if(c){ r *= 0.5 + c.r*0.5; g *= 0.4 + c.g*0.6; } }
    else if(ps.kind === 'snow'){ r = g = b = 1; s.x += Math.sin(s.age*2 + i)*0.002; }
    else if(ps.kind === 'smoke'){ r = g = b = 0.55*(1-k*0.6); }
    else { var tw = Math.abs(Math.sin(k*Math.PI)); r = c.r*tw; g = c.g*tw; b = c.b*tw; }
    pos[i*3] = s.x; pos[i*3+1] = s.y; pos[i*3+2] = s.z; col[i*3] = r; col[i*3+1] = g; col[i*3+2] = b;
  }
  p.geometry.attributes.position.needsUpdate = true; p.geometry.attributes.color.needsUpdate = true;
}

function makeGeometry(THREE, type){
  switch(type){
    case 'sphere': case 'enemy': return new THREE.SphereGeometry(0.5, 32, 20);
    case 'cylinder': return new THREE.CylinderGeometry(0.5,0.5,1,32);
    case 'cone': return new THREE.ConeGeometry(0.5,1,32);
    case 'player': return new THREE.CapsuleGeometry(0.4,0.8,6,16);
    case 'coin': return new THREE.CylinderGeometry(0.4,0.4,0.12,28);
    case 'goal': return new THREE.ConeGeometry(0.5,2,4);
    case 'torus': return new THREE.TorusGeometry(0.45,0.15,16,32);
    case 'plane': case 'water': return new THREE.BoxGeometry(1,0.1,1);
    case 'light': return new THREE.SphereGeometry(0.15,12,8);
    default: return new THREE.BoxGeometry(1,1,1);
  }
}

function buildMesh(THREE, o, opts){
  opts = opts || {};
  var group = new THREE.Group();
  if(o.type === 'light'){
    var L = new THREE.PointLight(new THREE.Color(o.color), o.intensity != null ? o.intensity : 40, 30, 2);
    L.castShadow = false; group.add(L);
    if(opts.editor){ var hm = new THREE.Mesh(makeGeometry(THREE,'light'), new THREE.MeshBasicMaterial({color:o.color})); group.add(hm); group.userData.pick = hm; }
  } else if(o.type === 'particles'){
    var pp = makeParticles(THREE, o); group.add(pp); group.userData.psys = pp;
    if(opts.editor){ var pm = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color:o.color, wireframe:true, transparent:true, opacity:0.35})); pm.position.y = 0.5; group.add(pm); group.userData.pick = pm; }
  } else if(o.type === 'text'){
    var tm = new THREE.Mesh(new THREE.PlaneGeometry(2,1), new THREE.MeshBasicMaterial({ map: makeTextTex(THREE, o.text || 'مرحباً', o.color || '#ffffff'), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    group.add(tm); group.userData.pick = tm;
  } else {
    var mat = new THREE.MeshStandardMaterial({ color: o.color, metalness: o.metal || 0, roughness: o.rough != null ? o.rough : 0.6 });
    if(o.emissive){ mat.emissive = new THREE.Color(o.color); mat.emissiveIntensity = 0.6; }
    if(o.tex === 'custom' && o.texData){ var im = new Image(); im.onload = function(){ var tx = new THREE.Texture(im); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; var sc2 = o.scale || [1,1,1]; tx.repeat.set(Math.max(1,Math.round(sc2[0]/2)), Math.max(1,Math.round(sc2[2]/2))); mat.map = tx; mat.color = new THREE.Color('#ffffff'); mat.needsUpdate = true; }; im.src = o.texData; }
    else if(o.tex && o.tex !== 'none'){ mat.map = makeTex(THREE, o.tex, '#ffffff'); var s = o.scale || [1,1,1]; mat.map.repeat.set(Math.max(1,Math.round(s[0])), Math.max(1,Math.round(s[o.type==='plane'?2:2]))); mat.needsUpdate = true; }
    if(o.type === 'water'){ mat.map = makeWaterTex(THREE); mat.map.repeat.set(Math.max(1,Math.round((o.scale||[1,1,1])[0]/2)), Math.max(1,Math.round((o.scale||[1,1,1])[2]/2))); mat.transparent = true; mat.opacity = 0.72; mat.roughness = 0.15; mat.metalness = 0.2; mat.color = new THREE.Color('#ffffff'); }
    if(o.opacity != null && o.opacity < 1 && o.type !== 'water'){ mat.transparent = true; mat.opacity = o.opacity; }
    var geo; if(o.type === 'model' && o.model){ geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(o.model, 3)); geo.computeVertexNormals(); } else geo = makeGeometry(THREE, o.type);
    if(o.type === 'model') mat.side = THREE.DoubleSide;
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    if(o.type === 'coin') m.rotation.x = Math.PI/2;
    if(o.type === 'torus') m.rotation.x = 0;
    group.add(m); group.userData.pick = m;
    if(o.type === 'enemy'){
      var eyeM = new THREE.MeshBasicMaterial({color:0xffffff}), pupM = new THREE.MeshBasicMaterial({color:0x111111});
      [-0.17,0.17].forEach(function(x){ var e = new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8), eyeM); e.position.set(x,0.12,-0.4); group.add(e); var p = new THREE.Mesh(new THREE.SphereGeometry(0.06,8,6), pupM); p.position.set(x,0.12,-0.5); group.add(p); });
    }
    if(o.type === 'player'){
      var eM = new THREE.MeshBasicMaterial({color:0xffffff}), pM = new THREE.MeshBasicMaterial({color:0x111111});
      [-0.15,0.15].forEach(function(x){ var e = new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8), eM); e.position.set(x,0.45,-0.33); group.add(e); var p = new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6), pM); p.position.set(x,0.45,-0.42); group.add(p); });
    }
  }
  return group;
}

var GRADES = { none:'', warm:'sepia(0.25) saturate(1.2) hue-rotate(-8deg)', cold:'saturate(0.9) hue-rotate(15deg) brightness(1.03)', noir:'grayscale(1) contrast(1.25)', vivid:'saturate(1.6) contrast(1.1)', retro:'sepia(0.5) contrast(1.15) saturate(1.3)' };
var DEFAULT_SETTINGS = { grade:'none', vig:false, cycle:false, intro:false, skyKind:'solid', music:false, sky:'#87c3ff', fog:true, gravity:24, sun:1.1, ambient:0.55, camera:'follow', camDist:9, camHeight:5, title:'لعبتي' };

function GameCore(THREE, container, data, opts){
  opts = opts || {};
  var S = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
  var canvas = document.createElement('canvas'); canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';
  container.appendChild(canvas);
  var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, preserveDrawingBuffer:true});
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  var scene = new THREE.Scene(); scene.background = new THREE.Color(S.sky); var fogCol = S.sky;
  if(S.skyKind && S.skyKind !== 'solid'){ var sk = makeSky(THREE, S.skyKind); scene.background = sk.tex; fogCol = sk.fog; if(S.skyKind === 'night' || S.skyKind === 'space'){ var stars = makeStars(THREE, 500); scene.add(stars); } }
  if(S.fog) scene.fog = new THREE.Fog(fogCol, 40, 140);
  var cam = new THREE.PerspectiveCamera(60, 1, 0.1, 400); cam.position.set(0,6,12);
  var hemi = new THREE.HemisphereLight(0xffffff, 0x445566, S.ambient); scene.add(hemi); var bg0 = scene.background && scene.background.isColor ? scene.background.clone() : null, fog0 = scene.fog ? scene.fog.color.clone() : null;
  var sun = new THREE.DirectionalLight(0xffffff, S.sun); sun.position.set(30,50,20); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048); var sc = sun.shadow.camera; sc.left = sc.bottom = -45; sc.right = sc.top = 45; sc.near = 1; sc.far = 140; sun.shadow.bias = -0.0005;
  scene.add(sun);

  /* واجهة اللعب */
  var ui = document.createElement('div'); ui.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#fff;user-select:none';
  if(getComputedStyle(container).position === 'static') container.style.position = 'relative'; container.appendChild(ui);
  var hudScore = document.createElement('div'); hudScore.style.cssText = 'position:absolute;top:10px;right:14px;font-size:22px;font-weight:700;text-shadow:0 2px 6px #000a;background:#0006;padding:4px 12px;border-radius:12px';
  canvas.style.filter = GRADES[S.grade] || '';
  if(S.vig){ var vg = document.createElement('div'); vg.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,#000a 100%)'; ui.appendChild(vg); }
  var flashEl = document.createElement('div'); flashEl.style.cssText = 'position:absolute;inset:0;background:radial-gradient(transparent 40%,#ff0000aa);opacity:0'; ui.appendChild(flashEl);
  var hudText = document.createElement('div'); hudText.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);font-size:18px;text-shadow:0 2px 6px #000a;background:#0005;padding:4px 12px;border-radius:12px;display:none';
  var msg = document.createElement('div'); msg.style.cssText = 'position:absolute;top:30%;left:50%;transform:translateX(-50%);font-size:30px;font-weight:800;text-shadow:0 3px 10px #000;text-align:center;display:none;max-width:90%';
  var overlay = document.createElement('div'); overlay.style.cssText = 'position:absolute;inset:0;background:#000b;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;pointer-events:auto;font-size:34px;font-weight:800;text-align:center';
  var ob = document.createElement('button'); ob.textContent = 'إعادة اللعب ↻'; ob.style.cssText = 'font:700 20px Tahoma;padding:10px 26px;border:0;border-radius:14px;background:#ffd23f;color:#222;cursor:pointer';
  var otxt = document.createElement('div'); overlay.appendChild(otxt); overlay.appendChild(ob);
  if(window.innerWidth < 600){ hudText.style.top = '52px'; hudText.style.left = '112px'; hudText.style.right = '10px'; hudText.style.transform = 'none'; hudText.style.fontSize = '14px'; hudText.style.textAlign = 'center'; }
  var hudInv = document.createElement('div'); hudInv.style.cssText = 'position:absolute;bottom:90px;left:12px;font-size:18px;text-shadow:0 2px 6px #000a;background:#0006;padding:4px 10px;border-radius:10px;display:none;direction:rtl'; ui.appendChild(hudInv);
  ui.appendChild(hudScore); ui.appendChild(hudText); ui.appendChild(msg); ui.appendChild(overlay);
  var paused = false, playT = 0, mmOn = true;
  var mm = document.createElement('canvas'); mm.width = 140; mm.height = 140; mm.style.cssText = 'position:absolute;top:52px;left:10px;width:96px;height:96px;border-radius:50%;background:#0008;border:2px solid #fff6;pointer-events:none';
  var pb = document.createElement('button'); pb.textContent = '⏸'; pb.style.cssText = 'position:absolute;top:10px;left:10px;font:700 18px Tahoma;padding:4px 10px;border:0;border-radius:12px;background:#0006;color:#fff;cursor:pointer;pointer-events:auto';
  var mb = document.createElement('button'); mb.textContent = '🗺'; mb.style.cssText = 'position:absolute;top:10px;left:56px;font:700 18px Tahoma;padding:4px 10px;border:0;border-radius:12px;background:#0006;color:#fff;cursor:pointer;pointer-events:auto';
  var muted = false; var sb = document.createElement('button'); sb.textContent = '🔊'; sb.style.cssText = 'position:absolute;top:10px;left:102px;font:700 18px Tahoma;padding:4px 10px;border:0;border-radius:12px;background:#0006;color:#fff;cursor:pointer;pointer-events:auto';
  sb.onclick = function(){ muted = !muted; sb.textContent = muted ? '🔇' : '🔊'; };
  var pov = document.createElement('div'); pov.style.cssText = 'position:absolute;inset:0;background:#000a;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;pointer-events:auto;font-size:32px;font-weight:800';
  pov.innerHTML = '<div>⏸ إيقاف مؤقت</div>';
  var pr = document.createElement('button'), pq = document.createElement('button');
  [pr, pq].forEach(function(b){ b.style.cssText = 'font:700 18px Tahoma;padding:9px 24px;border:0;border-radius:14px;background:#ffd23f;color:#222;cursor:pointer'; pov.appendChild(b); });
  pr.textContent = 'متابعة ▶'; pq.textContent = 'إعادة المستوى ↻';
  if(opts.levelNames && opts.levelNames.length > 1){ var lw = document.createElement('div'); lw.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:80%;font-size:14px'; opts.levelNames.forEach(function(nm, k){ var lb = document.createElement('button'); lb.textContent = (k === opts.curLevel ? '● ' : '') + nm; lb.style.cssText = 'font:700 14px Tahoma;padding:6px 14px;border:0;border-radius:12px;background:' + (k === opts.curLevel ? '#ffd23f' : '#6c8cff') + ';color:#111;cursor:pointer'; lb.onclick = function(){ setPause(false); opts.goLevel(k); }; lw.appendChild(lb); }); pov.appendChild(lw); }
  ui.appendChild(mm); ui.appendChild(pb); ui.appendChild(mb); ui.appendChild(sb); ui.appendChild(pov);
  function setPause(v){ if(ended) return; paused = v; pov.style.display = v ? 'flex' : 'none'; pb.textContent = v ? '▶' : '⏸'; }
  pb.onclick = function(){ setPause(!paused); }; pr.onclick = function(){ setPause(false); }; pq.onclick = function(){ setPause(false); game.restart(); };
  mb.onclick = function(){ mmOn = !mmOn; mm.style.display = mmOn ? 'block' : 'none'; };
  var mmc = mm.getContext('2d');
  function drawMini(){
    if(!mmOn || !camFollow) return; var W = 140, c = mmc, p = camFollow.pos, R = 22;
    c.clearRect(0,0,W,W); c.save(); c.beginPath(); c.arc(70,70,70,0,6.3); c.clip();
    objs.forEach(function(o){ if(o.dead || o.type === 'light' || o.type === 'particles' || o.type === 'text') return;
      var x = 70 + (o.pos.x - p.x) / R * 70, y = 70 + (o.pos.z - p.z) / R * 70; if(x < -10 || y < -10 || x > 150 || y > 150) return;
      var big = o.type === 'plane' || o.type === 'water' || o.type === 'cube' && o.body === 'static';
      c.fillStyle = o.type === 'enemy' ? '#ff4d4d' : o.type === 'coin' ? '#ffd23f' : o.type === 'goal' ? '#5cff9d' : o.type === 'player' ? '#fff' : o.type === 'water' ? '#3a7bd5' : '#8aa0ff';
      if(big){ var w = Math.max(2, o.scale.x / R * 70), h = Math.max(2, o.scale.z / R * 70); c.globalAlpha = o.type === 'plane' ? 0.25 : 0.7; c.fillRect(x - w/2, y - h/2, w, h); c.globalAlpha = 1; }
      else { c.beginPath(); c.arc(x, y, o.type === 'player' ? 4 : 3, 0, 6.3); c.fill(); } });
    c.fillStyle = '#fff'; c.beginPath(); c.arc(70,70,5,0,6.3); c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.stroke(); c.restore();
  }
  var skipIntro = false; try{ skipIntro = !!window.__noIntro || sessionStorage.getItem('engine.noIntro') === '1'; sessionStorage.removeItem('engine.noIntro'); }catch(x){} window.__noIntro = false; if((opts.curLevel || 0) > 0) skipIntro = true;
  if(S.intro && !skipIntro){ var iv = document.createElement('div'); iv.style.cssText = 'position:absolute;inset:0;background:linear-gradient(#0b1030ee,#1b2a6bee);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;pointer-events:auto;text-align:center;padding:20px;z-index:5';
    var touchy = !!opts.touch; iv.innerHTML = '<div style="font-size:40px;font-weight:900;color:#ffd23f;text-shadow:0 4px 14px #000">' + (S.title || 'لعبتي') + '</div><div style="font-size:16px;opacity:.9;line-height:1.9">' + (touchy ? '🕹 العصا للحركة • قفز للقفز • فعل للتفاعل' : '⌨ WASD أو الأسهم للحركة • المسافة للقفز • E للتفاعل • P للإيقاف') + '<br>اجمع النجوم ووصّل للهدف 🏁</div>';
    var sb = document.createElement('button'); sb.textContent = 'ابدأ اللعب ▶'; sb.style.cssText = 'font:800 22px Tahoma;padding:12px 34px;border:0;border-radius:16px;background:#ffd23f;color:#222;cursor:pointer;margin-top:10px'; iv.appendChild(sb); ui.appendChild(iv); paused = true;
    sb.onclick = function(){ iv.remove(); paused = false; }; }
  var kpause = function(e){ if(iv && iv.parentNode) return; if(e.code === 'KeyP' || e.code === 'Escape') setPause(!paused); }; window.addEventListener('keydown', kpause);

  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || opts.touch;
  var joy = {x:0,y:0}, joyBase, joyKnob, jumpBtn, actBtn, jumpHeld = false, actHeld = false;
  if(isTouch){
    joyBase = document.createElement('div'); joyBase.style.cssText = 'position:absolute;left:22px;bottom:26px;width:120px;height:120px;border-radius:50%;background:#fff3;border:2px solid #fff6;pointer-events:auto;touch-action:none';
    joyKnob = document.createElement('div'); joyKnob.style.cssText = 'position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:#fffa'; joyBase.appendChild(joyKnob);
    jumpBtn = document.createElement('div'); jumpBtn.textContent = 'قفز'; jumpBtn.style.cssText = 'position:absolute;right:22px;bottom:34px;width:84px;height:84px;border-radius:50%;background:#ffd23fcc;color:#222;font:700 18px Tahoma;display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none';
    actBtn = document.createElement('div'); actBtn.textContent = 'فعل'; actBtn.style.cssText = 'position:absolute;right:120px;bottom:26px;width:62px;height:62px;border-radius:50%;background:#ff6b6bcc;color:#fff;font:700 16px Tahoma;display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none';
    ui.appendChild(joyBase); ui.appendChild(jumpBtn); ui.appendChild(actBtn);
    var jid = null;
    function joyMove(e){ var r = joyBase.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2, dx = (e.clientX - cx)/50, dy = (e.clientY - cy)/50, l = Math.hypot(dx,dy); if(l > 1){ dx/=l; dy/=l; } joy.x = dx; joy.y = -dy; joyKnob.style.left = (35+dx*35)+'px'; joyKnob.style.top = (35+dy*35)+'px'; }
    joyBase.addEventListener('pointerdown', function(e){ jid = e.pointerId; joyBase.setPointerCapture(jid); joyMove(e); });
    joyBase.addEventListener('pointermove', function(e){ if(e.pointerId === jid) joyMove(e); });
    function joyEnd(e){ if(e.pointerId === jid){ jid = null; joy.x = joy.y = 0; joyKnob.style.left = joyKnob.style.top = '35px'; } }
    joyBase.addEventListener('pointerup', joyEnd); joyBase.addEventListener('pointercancel', joyEnd);
    jumpBtn.addEventListener('pointerdown', function(){ jumpHeld = true; }); jumpBtn.addEventListener('pointerup', function(){ jumpHeld = false; }); jumpBtn.addEventListener('pointercancel', function(){ jumpHeld = false; });
    actBtn.addEventListener('pointerdown', function(){ actHeld = true; }); actBtn.addEventListener('pointerup', function(){ actHeld = false; }); actBtn.addEventListener('pointercancel', function(){ actHeld = false; });
  }
  var keys = {};
  function kd(e){ keys[e.code] = true; if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) >= 0 && running) e.preventDefault(); }
  function ku(e){ keys[e.code] = false; }
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  var input = {
    get x(){ var v = (keys.KeyD||keys.ArrowRight?1:0) - (keys.KeyA||keys.ArrowLeft?1:0) + joy.x; return Math.max(-1, Math.min(1, v)); },
    get y(){ var v = (keys.KeyW||keys.ArrowUp?1:0) - (keys.KeyS||keys.ArrowDown?1:0) + joy.y; return Math.max(-1, Math.min(1, v)); },
    get jump(){ return !!(keys.Space || jumpHeld); },
    get action(){ return !!(keys.KeyE || keys.KeyF || keys.Enter || actHeld); },
    get sprint(){ return !!(keys.ShiftLeft || keys.ShiftRight); },
    key: function(c){ return !!keys[c]; }
  };

  /* تدوير الكاميرا بالسحب (منظور أول) */
  (function(){ var lid = null, lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', function(e){ if(S.camera !== 'first') return; lid = e.pointerId; lx = e.clientX; ly = e.clientY; try{ canvas.setPointerCapture(lid); }catch(x){} });
    canvas.addEventListener('pointermove', function(e){ if(e.pointerId !== lid) return; yaw -= (e.clientX - lx)*0.006; pitch = Math.max(-1.25, Math.min(1.25, pitch - (e.clientY - ly)*0.005)); lx = e.clientX; ly = e.clientY; });
    function up(e){ if(e.pointerId === lid) lid = null; } canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  })();
  /* صوت */
  var actx = null;
  function beep(freq, dur, type, vol){ if(muted) return; try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); var o = actx.createOscillator(), g = actx.createGain(); o.type = type || 'sine'; o.frequency.value = freq || 440; g.gain.value = vol || 0.12; o.connect(g); g.connect(actx.destination); var t = actx.currentTime; g.gain.setValueAtTime(vol||0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur||0.15)); o.start(t); o.stop(t + (dur||0.15)); }catch(e){} }

  /* موسيقى خلفية بسيطة مولّدة */
  var musicT = null, mStep = 0, mOn = false;
  function startMusic(){
    if(mOn || !S.music) return; mOn = true; var scale = [0,3,5,7,10,12,15,17], root = 220, pat = [0,2,4,2,5,4,2,1,0,2,4,7,5,4,2,3];
    musicT = setInterval(function(){ if(ended) return; var n = pat[mStep % pat.length]; beep(root * Math.pow(2, scale[n]/12), 0.28, 'triangle', 0.05); if(mStep % 4 === 0) beep(root/2 * Math.pow(2, scale[pat[(mStep+3)%pat.length]]/12), 0.4, 'sine', 0.06); mStep++; }, 240);
  }
  if(S.music){ window.addEventListener('pointerdown', startMusic, {once:true}); window.addEventListener('keydown', startMusic, {once:true}); }
  /* الكائنات */
  var objs = [], byName = {}, killed = [], particles = [], logs = opts.onLog || function(){}, running = false, ended = false, time = 0, score = opts.startScore || 0, shake = 0, nextId = 1;
  var yaw = 0, pitch = 0, camFollow = null, health = 3, maxHealth = 3, healthUsed = false, flash = 0;

  function mkObj(o){
    var ob = { id: nextId++, name: o.name || o.type, type: o.type, tag: o.tag || '', body: o.body || 'none', color: o.color, data: {}, dead: false, grounded: false, hooks: {}, _touch: {}, _cfg: o };
    ob.pos = new THREE.Vector3(o.pos[0], o.pos[1], o.pos[2]);
    ob.rot = new THREE.Euler(THREE.MathUtils.degToRad(o.rot[0]), THREE.MathUtils.degToRad(o.rot[1]), THREE.MathUtils.degToRad(o.rot[2]), 'YXZ');
    ob.scale = new THREE.Vector3(o.scale[0], o.scale[1], o.scale[2]);
    ob.vel = new THREE.Vector3();
    ob.anim = (o.anim && o.anim.keys && o.anim.keys.length > 1) ? o.anim : null;
    ob.bounce = o.bounce || 0; ob.startPos = ob.pos.clone(); ob.checkpoint = null; ob.prev = ob.pos.clone(); ob.delta = new THREE.Vector3();
    ob.mesh = buildMesh(THREE, o);
    scene.add(ob.mesh);
    ob.size = function(){ var b = BASE[ob.type] || [1,1,1]; return [b[0]*ob.scale.x, b[1]*ob.scale.y, b[2]*ob.scale.z]; };
    Object.defineProperty(ob, 'visible', { get: function(){ return ob.mesh.visible; }, set: function(v){ ob.mesh.visible = v; } });
    Object.defineProperty(ob, 'solid', { get: function(){ return ob.body === 'static' || ob.body === 'kinematic' || ob.body === 'dynamic'; } });
    ob.setColor = function(c){ ob.color = c; ob.mesh.traverse(function(m){ if(m.material && m.material.color && m !== null && ob.mesh.userData.pick === m) m.material.color.set(c); }); };
    ob.applyTransform = function(){ ob.mesh.position.copy(ob.pos); ob.mesh.rotation.copy(ob.rot); ob.mesh.scale.copy(ob.scale); };
    ob.applyTransform();
    if(o.script){
      try{
        var fn = new Function('self','game','input','THREE','Math', o.script + '\n;return {start:typeof start==="function"?start:null,update:typeof update==="function"?update:null,onTouch:typeof onTouch==="function"?onTouch:null};');
        ob.hooks = fn(ob, game, input, THREE, Math) || {};
      }catch(err){ logs('error', ob.name + ': ' + err.message); }
    }
    objs.push(ob); byName[ob.name] = byName[ob.name] || ob;
    return ob;
  }
  function call(ob, h, a){ if(!ob.hooks[h]) return; try{ ob.hooks[h](a); }catch(err){ logs('error', ob.name + '.' + h + ': ' + err.message); ob.hooks[h] = null; } }

  var game = {
    get score(){ return score; }, set score(v){ score = v; updateHud(); },
    get time(){ return time; },
    input: input,
    get health(){ return health; }, set health(v){ health = v; healthUsed = true; updateHud(); },
    setMaxHealth: function(n){ maxHealth = n; health = n; healthUsed = true; updateHud(); },
    hurt: function(n){ if(ended) return; healthUsed = true; health -= (n==null?1:n); flash = 0.35; shake = Math.max(shake, 0.5); beep(160,0.2,'sawtooth'); updateHud(); if(health <= 0){ health = 0; updateHud(); game.lose('انتهت صحتك!'); } },
    heal: function(n){ health = Math.min(maxHealth, health + (n==null?1:n)); healthUsed = true; updateHud(); beep(700,0.1,'sine'); },
    addScore: function(n){ score += (n==null?1:n); updateHud(); },
    find: function(n){ return byName[n] && !byName[n].dead ? byName[n] : (objs.filter(function(o){ return o.name === n && !o.dead; })[0] || null); },
    findAll: function(tag){ return objs.filter(function(o){ return !o.dead && (o.tag === tag || o.type === tag || o.name === tag); }); },
    spawn: function(type, p){
      p = p || {}; var b = BASE[type] ? type : 'cube';
      var cfg = { type: b, name: p.name || b, tag: p.tag || '', color: p.color || '#ffffff', pos: p.pos || [0,0,0], rot: p.rot || [0,0,0], scale: p.scale || [1,1,1], body: p.body || 'none', script: p.script || '', emissive: p.emissive, tex: p.tex };
      var ob = mkObj(cfg); if(p.vel) ob.vel.set(p.vel[0],p.vel[1],p.vel[2]); call(ob,'start'); return ob;
    },
    inv: {}, give: function(n, c, ic){ c = (c == null ? 1 : c); game.inv[n] = (game.inv[n] || 0) + c; if(ic) game.inv['__i' + n] = ic; var t = Object.keys(game.inv).filter(function(k){ return k.indexOf('__i') !== 0 && game.inv[k] > 0; }).map(function(k){ return (game.inv['__i' + k] || '🎒') + ' ' + k + ' × ' + game.inv[k]; }).join('   '); hudInv.textContent = t; hudInv.style.display = t ? 'block' : 'none'; game.beep(660, 0.08, 'triangle'); },
    count: function(n){ return game.inv[n] || 0; },
    flags: {}, set: function(k,v){ game.flags[k] = (v === undefined ? true : v); }, get: function(k){ return game.flags[k]; },
    setCheckpoint: function(ob, p){ ob.checkpoint = (p || ob.pos).clone(); game.message('✓ نقطة حفظ', 1200); beep(760,0.12,'triangle'); },
    respawn: function(ob){ if(!ob || ended) return; ob.pos.copy(ob.checkpoint || ob.startPos); ob.vel.set(0,0,0); ob.fell = false; game.hurt(1); },
    destroy: function(ob){ if(ob && !ob.dead){ ob.dead = true; killed.push(ob); } },
    hud: function(t){ hudText.textContent = t; hudText.style.display = t ? 'block' : 'none'; },
    message: function(t, ms){ msg.textContent = t; msg.style.display = 'block'; clearTimeout(msg._t); msg._t = setTimeout(function(){ msg.style.display = 'none'; }, ms || 1800); },
    win: function(t){ finish('🏆 ' + (t || 'فزت!'), true); beep(880,0.4,'triangle'); },
    lose: function(t){ finish('💀 ' + (t || 'خسرت')); beep(120,0.5,'sawtooth'); },
    restart: function(){ try{ sessionStorage.setItem('engine.noIntro', '1'); }catch(x){} window.__noIntro = true; opts.onRestart ? opts.onRestart(wonFlag) : location.reload(); },
    beep: beep, rand: function(a,b){ return a + Math.random()*(b-a); },
    dist: function(a,b){ return a.pos.distanceTo(b.pos); },
    camera: { get yaw(){ return yaw; }, get pitch(){ return pitch; }, get first(){ return S.camera === 'first'; }, follow: function(ob, o){ camFollow = ob; if(o){ if(o.dist!=null) S.camDist = o.dist; if(o.height!=null) S.camHeight = o.height; } }, shake: function(a){ shake = a || 0.5; } },
    burst: function(pos, color, n){ burst(pos, color, n); },
    log: function(t){ logs('log', String(t)); }
  };
  function updateHud(){ hudScore.textContent = '⭐ ' + score + (healthUsed ? '   ' + new Array(Math.max(0,health)+1).join('❤️') + new Array(Math.max(0,maxHealth-health)+1).join('🖤') : ''); }
  var wonFlag = false;
  function finish(t, won){ if(ended) return; ended = true; wonFlag = !!won; var extra = '';
    if(won){ var sec = Math.round(playT), stars = 1 + (sec < 90 ? 1 : 0) + (!healthUsed || health >= maxHealth ? 1 : 0), key = 'engine.best.' + (opts.key || 'game'), best = null; try{ best = parseFloat(localStorage.getItem(key)); }catch(x){} var rec = (best == null || isNaN(best) || sec < best); if(rec){ try{ localStorage.setItem(key, String(sec)); }catch(x){} }
      extra = '\n' + new Array(stars+1).join('⭐') + new Array(4-stars).join('☆') + '\n⏱ ' + sec + ' ث' + (rec ? ' — رقم قياسي جديد! 🎉' : ' (الأفضل ' + best + ' ث)') + '\n⭐ النقاط: ' + score; }
    otxt.style.whiteSpace = 'pre-line'; otxt.textContent = t + extra; ob.textContent = (won && opts.hasNext) ? 'المستوى التالي ▶' : 'إعادة اللعب ↻'; overlay.style.display = 'flex'; }
  ob.onclick = function(){ if(wonFlag && opts.hasNext) opts.goNext(); else game.restart(); };

  function burst(pos, color, n){
    n = n || 14;
    for(var i=0;i<n;i++){
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.09,6,4), new THREE.MeshBasicMaterial({color: color || '#ffd23f', transparent:true}));
      m.position.copy(pos); scene.add(m);
      particles.push({m:m, v:new THREE.Vector3((Math.random()-0.5)*7, Math.random()*6, (Math.random()-0.5)*7), life:0.7+Math.random()*0.4, t:0});
    }
  }

  /* تحميل المشهد */
  data.objects.forEach(function(o){ mkObj(o); });
  updateHud();
  objs.slice().forEach(function(o){ call(o,'start'); });
  var player = objs.filter(function(o){ return o.type === 'player'; })[0];
  if(player && S.camera !== 'free') camFollow = player;

  /* الفيزياء */
  function box(ob){ var s = ob.size(), h = [s[0]/2, s[1]/2, s[2]/2]; return {min:[ob.pos.x-h[0], ob.pos.y-h[1], ob.pos.z-h[2]], max:[ob.pos.x+h[0], ob.pos.y+h[1], ob.pos.z+h[2]]}; }
  function overlap(a,b,e){ e = e||0; return a.min[0] < b.max[0]+e && a.max[0] > b.min[0]-e && a.min[1] < b.max[1]+e && a.max[1] > b.min[1]-e && a.min[2] < b.max[2]+e && a.max[2] > b.min[2]-e; }
  var AX = ['x','y','z'];
  function physics(dt){
    var solids = objs.filter(function(o){ return !o.dead && (o.body === 'static' || o.body === 'kinematic' || o.body === 'dynamic'); });
    objs.forEach(function(o){ o.delta.subVectors(o.pos, o.prev); });
    objs.forEach(function(d){
      if(d.dead || d.body !== 'dynamic') return;
      d.vel.y -= S.gravity * dt; if(d.vel.y < -60) d.vel.y = -60;
      /* حمل المنصات المتحركة */
      if(d.supporter && !d.supporter.dead) d.pos.add(d.supporter.delta);
      var wasGrounded = d.grounded; d.grounded = false; d.supporter = null;
      for(var a=0;a<3;a++){
        var k = AX[a]; d.pos[k] += d.vel[k]*dt;
        var bb = box(d);
        for(var i=0;i<solids.length;i++){
          var s = solids[i]; if(s === d) continue;
          var sb = box(s); if(!overlap(bb, sb)) continue;
          if(s.body === 'dynamic' && a !== 1 && d.type === 'player'){ s.vel[k] = d.vel[k]*0.9; }
          if(a !== 1 && d.type === 'player' && wasGrounded && s.body !== 'dynamic'){ var stFeet = d.pos.y - d.size()[1]/2, stTop = s.pos.y + s.size()[1]/2; if(stTop - stFeet > 0.02 && stTop - stFeet <= 1.0){ d.pos.y = stTop + d.size()[1]/2 + 0.001; d.grounded = true; d.supporter = s; bb = box(d); continue; } }
          var half = d.size()[a]/2, sh = s.size()[a]/2;
          var bn = d.bounce, hit = Math.abs(d.vel[k]);
          if(d.vel[k] > 0 || (d.vel[k] === 0 && d.pos[k] < s.pos[k])){ d.pos[k] = s.pos[k] - sh - half - 0.0005; if(d.vel[k] > 0) d.vel[k] = (bn && hit > 1.2) ? -d.vel[k]*bn : 0; }
          else { d.pos[k] = s.pos[k] + sh + half + 0.0005; if(d.vel[k] < 0){ if(bn && hit > 1.2) d.vel[k] = -d.vel[k]*bn; else { d.vel[k] = 0; if(a === 1){ d.grounded = true; d.supporter = s; } } } else if(a === 1){ d.grounded = true; d.supporter = s; } }
          bb = box(d);
        }
      }
      if(d.grounded && !d.hooks.update){ d.vel.x *= 0.9; d.vel.z *= 0.9; }
      if(d.pos.y < -60){ call(d,'onFall'); if(d.type === 'player' && !d.hooks.onFall) game.respawn(d); else if(d.type !== 'player') game.destroy(d); }
    });
    objs.forEach(function(o){ o.prev.copy(o.pos); });
  }
  function touches(){
    var live = objs.filter(function(o){ return !o.dead; });
    for(var i=0;i<live.length;i++){
      var a = live[i]; if(a.body === 'none' || (!a.hooks.onTouch)) continue;
      var ab = box(a);
      for(var j=0;j<live.length;j++){
        var b = live[j]; if(a === b || b.body === 'none' || b.dead) continue;
        var hit = overlap(ab, box(b), 0.06);
        var key = b.id;
        if(hit && !a._touch[key]){ a._touch[key] = true; call(a, 'onTouch', b); if(a.dead) break; }
        else if(!hit && a._touch[key]) a._touch[key] = false;
      }
    }
  }

  /* حلقة اللعب */
  var last = performance.now(), acc = 0, raf = 0, camPos = new THREE.Vector3(0,6,12), fpsT = 0, fpsN = 0;
  function resize(){ var w = container.clientWidth || 800, h = container.clientHeight || 450; renderer.setSize(w, h, false); cam.aspect = w/h; cam.updateProjectionMatrix(); }
  function animStep(o, t){
    var A = o.anim, ks = A.keys, dur = ks[ks.length-1].t; if(dur <= 0) return;
    var m = A.mode === 'once' ? Math.min(t, dur) : A.mode === 'pingpong' ? (function(){ var q = t % (2*dur); return q > dur ? 2*dur - q : q; })() : (t % dur);
    var i = 0; while(i < ks.length - 2 && m > ks[i+1].t) i++;
    var a = ks[i], b = ks[i+1], span = b.t - a.t, f = span > 0 ? Math.min(1, Math.max(0, (m - a.t) / span)) : 1; f = f * f * (3 - 2 * f);
    function L(x, y){ return x + (y - x) * f; }
    o.pos.set(L(a.pos[0], b.pos[0]), L(a.pos[1], b.pos[1]), L(a.pos[2], b.pos[2]));
    o.rot.set(THREE.MathUtils.degToRad(L(a.rot[0], b.rot[0])), THREE.MathUtils.degToRad(L(a.rot[1], b.rot[1])), THREE.MathUtils.degToRad(L(a.rot[2], b.rot[2])));
    o.scale.set(L(a.scale[0], b.scale[0]), L(a.scale[1], b.scale[1]), L(a.scale[2], b.scale[2]));
  }
  function frame(now){
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last)/1000); last = now;
    if(!ended && !paused){
      time += dt; playT += dt;
      objs.forEach(function(o){ if(!o.dead) call(o,'update',dt); });
      objs.forEach(function(o){ if(o.anim && !o.dead) animStep(o, time); });
      acc += dt; var step = 1/120, n = 0; while(acc >= step && n < 8){ physics(step); acc -= step; n++; }
      touches();
    }
    for(var i=killed.length-1;i>=0;i--){ var k = killed[i]; scene.remove(k.mesh); k.mesh.traverse(function(m){ if(m.geometry) m.geometry.dispose(); }); }
    if(killed.length){ objs = objs.filter(function(o){ return !o.dead; }); killed = []; }
    objs.forEach(function(o){ o.applyTransform(); });
    objs.forEach(function(o){ if(o.mesh.userData.psys) stepParticles(o.mesh.userData.psys, dt); if(o.type === 'water'){ var wm = o.mesh.userData.pick; if(wm && wm.material.map){ wm.material.map.offset.x += dt*0.05; wm.material.map.offset.y += dt*0.03; } } });
    for(var p = particles.length-1; p>=0; p--){ var q = particles[p]; q.t += dt; q.v.y -= 18*dt; q.m.position.addScaledVector(q.v, dt); q.m.material.opacity = Math.max(0, 1 - q.t/q.life); if(q.t >= q.life){ scene.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); particles.splice(p,1); } }
    /* الكاميرا */
    if(camFollow && !camFollow.dead && S.camera === 'first'){
      var tp = camFollow.pos; cam.position.set(tp.x, tp.y + 0.55, tp.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0); camFollow.mesh.visible = false;
      sun.position.set(tp.x + 30, 50, tp.z + 20); sun.target.position.copy(tp); sun.target.updateMatrixWorld();
    } else if(camFollow && !camFollow.dead){
      var target = camFollow.pos, want = new THREE.Vector3(target.x, target.y + S.camHeight, target.z + S.camDist);
      if(S.camera === 'top') want.set(target.x, target.y + S.camDist*1.4, target.z + 2);
      camPos.lerp(want, 1 - Math.pow(0.0015, dt));
      cam.position.copy(camPos);
      if(shake > 0){ cam.position.x += (Math.random()-0.5)*shake; cam.position.y += (Math.random()-0.5)*shake; shake = Math.max(0, shake - dt*2); }
      cam.lookAt(target.x, target.y + 0.5, target.z);
      sun.position.set(target.x + 30, 50, target.z + 20); sun.target.position.copy(target); sun.target.updateMatrixWorld();
    }
    if(flash > 0){ flash -= dt; flashEl.style.opacity = Math.max(0, flash/0.35); } else if(flashEl.style.opacity !== '0') flashEl.style.opacity = '0';
    if(S.cycle){ var ph = (time * 0.04) % 1, dayk = Math.max(0.12, Math.sin(ph * 6.2832) * 0.5 + 0.55); sun.intensity = S.sun * dayk; hemi.intensity = S.ambient * (0.35 + 0.65 * dayk); sun.color.setRGB(1, 0.75 + 0.25 * dayk, 0.55 + 0.45 * dayk);
      if(bg0){ scene.background.copy(bg0).multiplyScalar(0.25 + 0.75 * dayk); if(scene.fog && fog0) scene.fog.color.copy(fog0).multiplyScalar(0.25 + 0.75 * dayk); } }
    drawMini();
    renderer.render(scene, cam);
    fpsN++; fpsT += dt; if(fpsT >= 1){ if(opts.onFps) opts.onFps(Math.round(fpsN/fpsT)); fpsT = 0; fpsN = 0; }
  }
  running = true; resize(); raf = requestAnimationFrame(frame);
  var ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if(ro) ro.observe(container); window.addEventListener('resize', resize);

  return {
    game: game, objects: function(){ return objs; }, canvas: canvas, camera: cam, resize: resize,
    stop: function(){ running = false; if(musicT) clearInterval(musicT); cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keydown', kpause); window.removeEventListener('keyup', ku); window.removeEventListener('resize', resize); if(ro) ro.disconnect(); renderer.dispose(); if(canvas.parentNode) canvas.parentNode.removeChild(canvas); if(ui.parentNode) ui.parentNode.removeChild(ui); try{ actx && actx.close(); }catch(e){} },
    isEnded: function(){ return ended; }, getScore: function(){ return score; }
  };
}


/* غلاف المستويات المتعددة */
function GameRuntime(THREE, container, data, opts){
  opts = opts || {};
  if(!data.levels || !data.levels.length) return GameCore(THREE, container, data, opts);
  var idx = 0, cur = null, levelStart = [0];
  function load(i){
    if(cur){ cur.stop(); cur = null; }
    idx = i; if(levelStart[i] == null) levelStart[i] = 0;
    var o2 = Object.assign({}, opts, { levelNames: data.levels.map(function(l,k){ return l.name || ('مستوى ' + (k+1)); }), curLevel: i, goLevel: function(k){ levelStart[k] = 0; load(k); }, startScore: levelStart[i], hasNext: i < data.levels.length - 1,
      goNext: function(){ var s = cur.getScore(); levelStart[idx+1] = s; load(idx+1); },
      onRestart: function(won){ if(won && idx === data.levels.length - 1){ levelStart = [0]; load(0); } else load(idx); } });
    cur = GameCore(THREE, container, { settings: data.settings, objects: data.levels[i].objects }, o2);
    if(opts.onLevel) opts.onLevel(i);
  }
  load(0);
  return { get game(){ return cur.game; }, objects: function(){ return cur.objects(); }, stop: function(){ if(cur) cur.stop(); cur = null; }, isEnded: function(){ return cur.isEnded(); }, getScore: function(){ return cur.getScore(); }, resize: function(){ cur.resize(); }, level: function(){ return idx; } };
      }
