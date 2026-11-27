/* ===== المحرر ===== */
(function(){
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

var SCRIPTS = {
  'none': '',
  'player': "// تحكم اللاعب: الحركة بـ WASD / الأسهم / العصا، القفز بالمسافة\nvar speed = 7, jumpPower = 10.5;\nfunction start(){ game.camera.follow(self); }\nfunction update(dt){\n  var s = input.sprint ? speed * 1.5 : speed;\n  self.vel.x = input.x * s;\n  self.vel.z = -input.y * s;\n  if(input.jump && self.grounded){ self.vel.y = jumpPower; game.beep(520, 0.1, 'square'); }\n  if(input.x || input.y) self.rot.y = Math.atan2(-input.x, input.y);\n}\n",
  'coin': "// عملة تدور وتُجمع\nfunction update(dt){ self.rot.y += dt * 3; self.pos.y += Math.sin(game.time * 3 + self.id) * dt * 0.3; }\nfunction onTouch(o){\n  if(o.type === 'player'){ game.addScore(1); game.burst(self.pos, '#ffd23f'); game.beep(880 + game.score * 20, 0.1, 'triangle'); game.destroy(self); }\n}\n",
  'enemy': "// عدو يتحرك يمين ويسار؛ اقفز فوقه لتهزمه\nvar range = 3, speed = 1.6, startX;\nfunction start(){ startX = self.pos.x; }\nfunction update(dt){ self.pos.x = startX + Math.sin(game.time * speed) * range; self.rot.y = Math.cos(game.time * speed) > 0 ? -1.2 : 1.2; }\nfunction onTouch(o){\n  if(o.type !== 'player') return;\n  if(o.vel.y < 0 && o.pos.y > self.pos.y + 0.3){ o.vel.y = 9; game.addScore(5); game.burst(self.pos, '#ff5d5d', 20); game.beep(300, 0.15, 'square'); game.destroy(self); }\n  else { game.camera.shake(0.6); game.lose('لمسك العدو!'); }\n}\n",
  'goal': "// هدف الفوز\nfunction update(dt){ self.rot.y += dt * 2; }\nfunction onTouch(o){ if(o.type === 'player'){ game.win('وصلت للهدف! النقاط: ' + game.score); } }\n",
  'platform': "// منصة متحركة (حركية)\nvar axis = 'x', range = 4, speed = 1, base;\nfunction start(){ base = self.pos[axis]; }\nfunction update(dt){ self.pos[axis] = base + Math.sin(game.time * speed) * range; }\n",
  'waypoints': "// منصة تتحرك بين نقاط مسار (مؤقت الحركة الحركي)\nvar pts = [[0,0,0],[4,0,0],[4,2,-4],[0,2,-4]], speed = 2.5, i = 1, base;\nfunction start(){ base = [self.pos.x, self.pos.y, self.pos.z]; }\nfunction update(dt){\n  var t = pts[i], tx = base[0] + t[0], ty = base[1] + t[1], tz = base[2] + t[2];\n  var dx = tx - self.pos.x, dy = ty - self.pos.y, dz = tz - self.pos.z, d = Math.sqrt(dx*dx + dy*dy + dz*dz);\n  if(d < 0.1){ i = (i + 1) % pts.length; return; }\n  var s = Math.min(d, speed * dt) / d; self.pos.x += dx * s; self.pos.y += dy * s; self.pos.z += dz * s;\n}\n",
  'falling': "// منصة تسقط بعد الوقوف عليها بثانية ثم تعود\nvar t = -1, home, vy = 0;\nfunction start(){ home = self.pos.y; }\nfunction update(dt){\n  var p = game.findAll('player')[0];\n  if(t < 0 && p){ var dx = Math.abs(p.pos.x - self.pos.x), dz = Math.abs(p.pos.z - self.pos.z); if(dx < self.scale.x / 2 && dz < self.scale.z / 2 && p.pos.y > self.pos.y && p.pos.y < self.pos.y + 2.5){ t = 0; self.setColor('#ff9f1c'); } }\n  if(t >= 0){ t += dt;\n    if(t > 1){ vy -= 25 * dt; self.pos.y += vy * dt; }\n    if(t > 4){ t = -1; vy = 0; self.pos.y = home; self.setColor('#adb5bd'); }\n  }\n}\n",
  'pendulum': "// بندول خطر يتأرجح\nvar len = 4, speed = 2, cx, cy, cz;\nfunction start(){ cx = self.pos.x; cy = self.pos.y + len; cz = self.pos.z; }\nfunction update(dt){ var a = Math.sin(game.time * speed) * 1.0; self.pos.x = cx + Math.sin(a) * len; self.pos.y = cy - Math.cos(a) * len; }\nfunction onTouch(o){ if(o.type === 'player') game.respawn(o); }\n",
  'turret': "// برج يطلق على اللاعب إذا اقترب\nvar t = 0, range = 12;\nfunction update(dt){\n  var p = game.findAll('player')[0]; if(!p) return; t += dt;\n  var dx = p.pos.x - self.pos.x, dz = p.pos.z - self.pos.z, d = Math.hypot(dx, dz);\n  self.rot.y = Math.atan2(dx, dz);\n  if(d < range && t > 1.4){ t = 0; var b = game.spawn('sphere', { pos: [self.pos.x, self.pos.y + 1, self.pos.z], scale: [0.4,0.4,0.4], color: '#ff3b3b', body: 'trigger', emissive: true, script: \"var vx=\" + (dx/d*8) + \",vz=\" + (dz/d*8) + \",life=4;function update(dt){self.pos.x+=vx*dt;self.pos.z+=vz*dt;life-=dt;if(life<0)game.destroy(self);}function onTouch(o){if(o.type==='player'){game.respawn(o);game.destroy(self);}}\" }); game.beep(220, 0.1, 'square'); }\n}\n",
  'spinner': "// جسم يدور\nfunction update(dt){ self.rot.y += dt * 1.5; }\n",
  'killzone': "// منطقة خطر: تخسر قلباً وتعود لآخر نقطة حفظ\nfunction onTouch(o){ if(o.type === 'player') game.respawn(o); }\n",
  'checkpoint': "// نقطة حفظ: إذا سقطت تعود إليها\nvar on = false;\nfunction update(dt){ self.rot.y += dt * (on ? 4 : 1); }\nfunction onTouch(o){ if(o.type === 'player' && !on){ on = true; game.setCheckpoint(o, self.pos); self.setColor('#5cff9d'); } }\n",
  'bouncer': "// نطاط: يقذف اللاعب لفوق\nfunction onTouch(o){ if(o.vel){ o.vel.y = 18; game.beep(660, 0.12, 'sine'); } }\n",
  'fps': "// لاعب بمنظور الشخص الأول: اسحب الشاشة للنظر، الحركة بالعصا أو WASD، فعل = إطلاق\nvar speed = 6.5, jumpPower = 10, cd = 0;\nfunction start(){ game.camera.follow(self); game.setMaxHealth(5); }\nfunction update(dt){\n  var yaw = game.camera.yaw, s = input.sprint ? speed * 1.5 : speed; cd -= dt;\n  var fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);\n  self.vel.x = (fx * input.y + rx * input.x) * s;\n  self.vel.z = (fz * input.y + rz * input.x) * s;\n  if(input.jump && self.grounded){ self.vel.y = jumpPower; game.beep(520, 0.1, 'square'); }\n  if(input.action && cd <= 0){ cd = 0.3; game.beep(900, 0.06, 'square');\n    var cp = Math.cos(game.camera.pitch), dx = fx * cp, dy = Math.sin(game.camera.pitch), dz = fz * cp;\n    game.spawn('sphere', { pos: [self.pos.x + dx, self.pos.y + 0.5 + dy, self.pos.z + dz], scale: [0.25,0.25,0.25], color: '#ffe066', emissive: true, body: 'trigger',\n      script: \"var life=0; function update(dt){ self.pos.x += \" + (dx*22) + \"*dt; self.pos.y += \" + (dy*22) + \"*dt; self.pos.z += \" + (dz*22) + \"*dt; life+=dt; if(life>1.5) game.destroy(self); } function onTouch(o){ if(o.tag==='enemy'){ game.addScore(10); game.burst(o.pos,'#ff5d5d',18); game.beep(260,0.12,'square'); game.destroy(o); game.destroy(self); } else if(o.body==='static') game.destroy(self); }\" });\n  }\n}\n",
  'key': "// مفتاح: يفتح الأبواب التي لها نفس اللون (الاسم المخزن في flag)\nvar flag = 'key1';\nfunction update(dt){ self.rot.y += dt * 2.5; self.pos.y += Math.sin(game.time * 4) * dt * 0.4; }\nfunction onTouch(o){ if(o.type === 'player'){ game.set(flag); game.message('🔑 حصلت على المفتاح', 1600); game.burst(self.pos, self.color); game.beep(1000, 0.15, 'triangle'); game.destroy(self); } }\n",
  'door': "// باب: يفتح عند الحصول على المفتاح\nvar flag = 'key1', opening = false;\nfunction update(dt){\n  if(!opening && game.get(flag)){ opening = true; game.beep(300, 0.4, 'sawtooth'); }\n  if(opening){ self.pos.y += dt * 3; if(self.pos.y > 8) game.destroy(self); }\n}\n",
  'switch': "// زر ضغط: يرفع علماً (flag) عند الدوس عليه\nvar flag = 'key1', done = false;\nfunction onTouch(o){ if(o.type === 'player' && !done){ done = true; game.set(flag); self.scale.y = 0.1; self.setColor('#5cff9d'); game.message('تم تفعيل الزر', 1400); game.beep(600, 0.15, 'square'); } }\n",
  'timer': "// مؤقت تنازلي على الشاشة؛ تخسر عند انتهائه\nvar left = 60;\nfunction update(dt){ left -= dt; game.hud('⏱ ' + Math.ceil(left)); if(left <= 0) game.lose('انتهى الوقت!'); }\n",
  'chaser': "// عدو يطارد اللاعب ويؤذيه\nvar speed = 3.2, cd = 0;\nfunction update(dt){\n  var p = game.findAll('player')[0]; if(!p) return; cd -= dt;\n  var dx = p.pos.x - self.pos.x, dz = p.pos.z - self.pos.z, d = Math.hypot(dx, dz);\n  if(d < 14 && d > 0.1){ self.pos.x += dx / d * speed * dt; self.pos.z += dz / d * speed * dt; self.rot.y = Math.atan2(-dx, -dz); }\n}\nfunction onTouch(o){\n  if(o.type !== 'player') return;\n  if(o.vel.y < 0 && o.pos.y > self.pos.y + 0.4){ o.vel.y = 9; game.addScore(5); game.burst(self.pos, '#ff5d5d', 20); game.beep(300, 0.15, 'square'); game.destroy(self); }\n  else { game.hurt(1); o.vel.y = 7; o.vel.x = (o.pos.x - self.pos.x) * 6; }\n}\n",
  'gunner': "// لاعب يطلق النار بزر الفعل (E / F / Enter / زر فعل)\nvar speed = 7, jumpPower = 10.5, cd = 0, fx = 0, fz = -1;\nfunction start(){ game.camera.follow(self); game.setMaxHealth(5); }\nfunction update(dt){\n  var s = input.sprint ? speed * 1.5 : speed; cd -= dt;\n  self.vel.x = input.x * s; self.vel.z = -input.y * s;\n  if(input.x || input.y){ self.rot.y = Math.atan2(-input.x, input.y); var l = Math.hypot(input.x, input.y); fx = input.x / l; fz = -input.y / l; }\n  if(input.jump && self.grounded){ self.vel.y = jumpPower; game.beep(520, 0.1, 'square'); }\n  if(input.action && cd <= 0){ cd = 0.25; game.beep(900, 0.06, 'square');\n    game.spawn('sphere', { pos: [self.pos.x + fx, self.pos.y + 0.2, self.pos.z + fz], scale: [0.3,0.3,0.3], color: '#ffe066', emissive: true, body: 'trigger', vel: [0,0,0],\n      script: \"var life=0, dx=\" + fx + \", dz=\" + fz + \"; function update(dt){ self.pos.x += dx*18*dt; self.pos.z += dz*18*dt; life+=dt; if(life>1.2) game.destroy(self); } function onTouch(o){ if(o.tag==='enemy'){ game.addScore(10); game.burst(o.pos,'#ff5d5d',18); game.beep(260,0.12,'square'); game.destroy(o); game.destroy(self); } else if(o.body==='static') game.destroy(self); }\" });\n  }\n}\n",
  'health': "// علبة صحة\nfunction update(dt){ self.rot.y += dt * 2; self.pos.y += Math.sin(game.time * 4) * dt * 0.3; }\nfunction onTouch(o){ if(o.type === 'player'){ game.heal(1); game.burst(self.pos, '#ff6b9d'); game.destroy(self); } }\n",
  'shooter': "// يطلق كرات كل ثانيتين\nvar t = 0;\nfunction update(dt){\n  t += dt;\n  if(t > 2){ t = 0;\n    var b = game.spawn('sphere', { pos: [self.pos.x, self.pos.y, self.pos.z + 1], scale: [0.4,0.4,0.4], color: '#ff9f1c', body: 'trigger', script: \"var life=0; function update(dt){ self.pos.z += 9*dt; life+=dt; if(life>5) game.destroy(self); } function onTouch(o){ if(o.type==='player') game.lose('أصابتك كرة!'); }\" });\n  }\n}\n"
};
var SCRIPT_NAMES = { none:'بدون', waypoints:'مسار نقاط', falling:'منصة تسقط', pendulum:'بندول', turret:'برج مطلق', player:'لاعب', coin:'عملة', enemy:'عدو', goal:'هدف', platform:'منصة متحركة', spinner:'دوران', killzone:'منطقة خطر', bouncer:'نطاط', shooter:'مطلق كرات', chaser:'عدو مطارد', gunner:'لاعب مسلّح', health:'علبة صحة', checkpoint:'نقطة حفظ', fps:'منظور أول', key:'مفتاح', door:'باب', switch:'زر تفعيل', timer:'مؤقت' };

var DEFAULTS = {
  cube:    { color:'#6c8cff', body:'static', tex:'checker' },
  sphere:  { color:'#ff7ab8', body:'static' },
  cylinder:{ color:'#7ad9a0', body:'static' },
  cone:    { color:'#ffb45c', body:'static' },
  torus:   { color:'#c58bff', body:'none' },
  plane:   { color:'#5aa469', body:'static', tex:'grid', scale:[10,1,10] },
  player:  { color:'#ffcf33', body:'dynamic', script:'player', tag:'player', pos:[0,2,0] },
  coin:    { color:'#ffd23f', body:'trigger', script:'coin', emissive:true, tag:'coin' },
  enemy:   { color:'#ff4d4d', body:'trigger', script:'enemy', tag:'enemy' },
  goal:    { color:'#5cff9d', body:'trigger', script:'goal', emissive:true, tag:'goal' },
  light:   { color:'#fff2b0', body:'none', intensity:60 },
  text:    { color:'#ffffff', body:'none', scale:[3,1.5,1], text:'مرحباً بك!', pos:[0,2,0] },
  particles:{ color:'#ff7a1a', body:'none', kind:'fire', scale:[1,2,1] },
  water:   { color:'#ffffff', body:'trigger', scale:[10,1,10], script:'killzone', pos:[0,0.05,0] },
  checkpoint:{ type:'cone', color:'#ffd23f', body:'trigger', script:'checkpoint', emissive:true, scale:[0.8,2,0.8], tag:'checkpoint' }
};
var uid = 1;
function newObj(type, over){
  var d = DEFAULTS[type] || {}; if(d.type) type = d.type;
  var o = { id: uid++, type: type, name: (TYPE_AR[type] || type) + ' ' + (uid-1), tag: d.tag || '', color: d.color || '#cccccc', pos: d.pos ? d.pos.slice() : [0,0.5,0], rot:[0,0,0], scale: d.scale ? d.scale.slice() : [1,1,1], body: d.body || 'none', tex: d.tex || 'none', emissive: !!d.emissive, metal:0, rough:0.6, opacity:1, intensity: d.intensity, script: d.script ? SCRIPTS[d.script] : '' };
  if(d.text) o.text = d.text; if(d.kind) o.kind = d.kind;
  if(over) for(var k in over) o[k] = over[k];
  return o;
}

/* ===== مكتبة الأصول (مجموعات جاهزة) ===== */
function P(type, name, pos, scale, color, extra){ return Object.assign({ type:type, name:name, pos:pos, scale:scale, color:color }, extra||{}); }
var PREFABS = {
  tree:  ['🌳 شجرة', function(){ return [P('cylinder','جذع',[0,1,0],[0.5,2,0.5],'#8d5a2b',{body:'static'}), P('sphere','أوراق',[0,2.8,0],[2.2,2.2,2.2],'#3fa34d',{body:'static'}), P('sphere','أوراق',[0,3.8,0],[1.4,1.4,1.4],'#4cc25b',{body:'static'})]; }],
  house: ['🏠 بيت', function(){ return [P('cube','جدار',[0,1.25,0],[5,2.5,5],'#e9d8a6',{body:'static',tex:'bricks'}), P('cone','سقف',[0,3.4,0],[6.6,1.8,6.6],'#c0392b',{body:'static',rot:[0,45,0]}), P('cube','باب',[0,0.9,2.52],[1.2,1.8,0.1],'#6b4423',{body:'none'})]; }],
  tower: ['🗼 برج', function(){ var a=[]; for(var i=0;i<5;i++) a.push(P('cylinder','طابق',[0,0.75+i*1.5,0],[3-i*0.3,1.5,3-i*0.3],['#adb5bd','#ced4da'][i%2],{body:'static',tex:'bricks'})); a.push(P('cone','قمة',[0,8.5,0],[2,2,2],'#e63946',{body:'static'})); return a; }],
  stairs:['🪜 سلّم', function(){ var a=[]; for(var i=0;i<8;i++) a.push(P('cube','درجة',[0,0.25+i*0.5,-i*1],[3,0.5+i*0.5,1],'#9db4c0',{body:'static',tex:'grid'})); return a; }],
  bridge:['🌉 جسر', function(){ var a=[P('cube','لوح',[0,0.2,0],[3,0.4,14],'#a47148',{body:'static',tex:'bricks'})]; for(var i=0;i<4;i++){ a.push(P('cylinder','عمود',[1.4,0.9,-5+i*3.3],[0.2,1.4,0.2],'#6b4423',{body:'static'})); a.push(P('cylinder','عمود',[-1.4,0.9,-5+i*3.3],[0.2,1.4,0.2],'#6b4423',{body:'static'})); } return a; }],
  coins: ['🪙 صف عملات', function(){ var a=[]; for(var i=0;i<6;i++) a.push(P('coin','عملة',[0,1,-i*1.6],[1,1,1],'#ffd23f',{body:'trigger',tag:'coin',emissive:true,script:SCRIPTS.coin})); return a; }],
  crates:['📦 هرم صناديق', function(){ var a=[]; for(var y=0;y<3;y++) for(var x=0;x<3-y;x++) a.push(P('cube','صندوق',[x*1.05+y*0.52-1,0.5+y*1.02,0],[1,1,1],'#c68642',{body:'dynamic',tex:'bricks'})); return a; }],
  fence: ['🚧 سياج', function(){ var a=[]; for(var i=0;i<6;i++) a.push(P('cube','وتد',[i*1.2,0.6,0],[0.2,1.2,0.2],'#8d5a2b',{body:'static'})); a.push(P('cube','عارضة',[3,0.9,0],[6.2,0.15,0.1],'#a47148',{body:'static'})); return a; }],
  lava:  ['🔥 حمم', function(){ return [P('cube','حمم',[0,0.1,0],[6,0.2,6],'#ff4500',{body:'trigger',emissive:true,script:SCRIPTS.killzone})]; }],
  jump:  ['⬆ نطاط', function(){ return [P('cylinder','نطاط',[0,0.15,0],[1.6,0.3,1.6],'#00d2ff',{body:'trigger',emissive:true,script:SCRIPTS.bouncer})]; }],
  keydoor:['🔑 مفتاح وباب', function(){ return [P('cube','باب',[0,1.5,0],[3,3,0.6],'#8d5a2b',{body:'static',tex:'bricks',script:SCRIPTS.door}), P('cone','مفتاح',[0,1,5],[0.5,0.8,0.5],'#ffd23f',{body:'trigger',emissive:true,script:SCRIPTS.key,rot:[0,0,180]})]; }],
  button:['🔘 زر + بوابة', function(){ return [P('cube','بوابة',[0,1.5,0],[4,3,0.6],'#4cc9f0',{body:'static',emissive:true,script:SCRIPTS.door}), P('cylinder','زر',[0,0.1,6],[1.4,0.2,1.4],'#ff6b6b',{body:'trigger',emissive:true,script:SCRIPTS.switch})]; }],
  waypath:['🛤 منصة مسار', function(){ return [P('cube','منصة مسار',[0,0.3,0],[3,0.5,3],'#4cc9f0',{body:'kinematic',tex:'grid',script:SCRIPTS.waypoints})]; }],
  fallp: ['🍂 منصات تسقط', function(){ var a=[]; for(var i=0;i<4;i++) a.push(P('cube','منصة تسقط',[0,0.3+i*0.3,-i*4],[3,0.5,3],'#adb5bd',{body:'static',script:SCRIPTS.falling})); return a; }],
  pend:  ['🪓 بندول', function(){ return [P('cylinder','عمود',[0,6,0],[0.2,0.2,0.2],'#555555',{body:'none'}), P('sphere','بندول',[0,2,0],[1.4,1.4,1.4],'#e63946',{body:'trigger',emissive:true,script:SCRIPTS.pendulum})]; }],
  turret:['🎯 برج مطلق', function(){ return [P('cylinder','قاعدة',[0,0.6,0],[1.4,1.2,1.4],'#6c757d',{body:'static',script:SCRIPTS.turret}), P('sphere','رأس',[0,1.5,0],[1,1,1],'#e63946',{body:'none'})]; }],
  terrain:['⛰ تضاريس عشوائية', function(){ var a=[], N=9, s=Math.random()*10, i, j; for(i=0;i<N;i++) for(j=0;j<N;j++){ var h=Math.max(0.4, 0.6+2.2*(Math.sin(i*0.7+s)+Math.cos(j*0.6+s*1.3)+1)/2*(1-Math.abs(i-4)/6)); h=Math.round(h*2)/2; a.push(P('cube','تضاريس',[(i-4)*2,h/2,(j-4)*2],[2,h,2],h>2.2?'#adb5bd':h>1.4?'#4c9f50':h>0.8?'#6fbf73':'#e3c98e',{body:'static'})); } return a; }],
  tunnel:['🕳 نفق', function(){ return [P('cube','جدار',[-2,1.5,0],[0.6,3,10],'#8d99ae',{body:'static',tex:'bricks'}), P('cube','جدار',[2,1.5,0],[0.6,3,10],'#8d99ae',{body:'static',tex:'bricks'}), P('cube','سقف',[0,3.2,0],[4.6,0.5,10],'#8d99ae',{body:'static',tex:'bricks'})]; }],
  island:['🏝 جزيرة', function(){ return [P('cylinder','جزيرة',[0,0.4,0],[8,0.8,8],'#e3c98e',{body:'static'}), P('cylinder','عشب',[0,0.9,0],[6,0.3,6],'#4cc25b',{body:'static'}), P('cylinder','جذع',[0,2.3,0],[0.4,2.6,0.4],'#8d5a2b',{body:'static'}), P('sphere','سعف',[0,3.8,0],[2.4,0.8,2.4],'#2e9e4b',{body:'static'})]; }],
  medkit:['❤ علبة صحة', function(){ return [P('cube','صحة',[0,1,0],[0.6,0.6,0.6],'#ff4d6d',{body:'trigger',emissive:true,script:SCRIPTS.health})]; }]
};
function addPrefab(key){
  pushUndo(); var t = orbit.target, items = PREFABS[key][1](), last = null;
  items.forEach(function(it){ var o = newObj(it.type, { name: it.name, color: it.color, body: it.body || 'none', scale: it.scale.slice(), rot: it.rot ? it.rot.slice() : [0,0,0], tex: it.tex || 'none', emissive: !!it.emissive, tag: it.tag || '', script: it.script || '', pos:[Math.round(t.x)+it.pos[0], it.pos[1], Math.round(t.z)+it.pos[2]] }); state.objects.push(o); addMesh(o); last = o; });
  if(last) select(last.id); toast('أُضيفت المجموعة: ' + PREFABS[key][0]);
}

/* مولّد مراحل عشوائية */
function tmplRandom(){
  var o = [], z = 4, x = 0, rnd = function(a,b){ return a + Math.random()*(b-a); }, cols = ['#6c8cff','#ff7ab8','#7ad9a0','#ffb45c','#c58bff','#4cc9f0'];
  o.push(newObj('plane',{name:'البداية',pos:[0,-0.05,2],scale:[8,1,8],color:'#5aa469'}));
  o.push(newObj('player',{pos:[0,1.3,3]}));
  var y = 0.5, coins = 0;
  for(var i=0;i<16;i++){
    var dz = rnd(3.5,5.2), dx = rnd(-4,4); z -= dz; x = Math.max(-9, Math.min(9, x + dx)); y = Math.max(0.5, Math.min(7, y + rnd(-0.6,1.1)));
    var w = rnd(2.4,4), moving = Math.random() < 0.2;
    o.push(newObj('cube',{name:'منصة '+(i+1),pos:[x,y,z],scale:[w,1,rnd(2.4,3.6)],color:cols[i%cols.length],body:moving?'kinematic':'static',script:moving?SCRIPTS.platform:'',tex:moving?'none':'checker'}));
    if(Math.random() < 0.8){ o.push(newObj('coin',{name:'عملة '+(++coins),pos:[x,y+1.3,z]})); }
    if(i>2 && Math.random() < 0.3){ o.push(newObj('enemy',{name:'عدو '+i,pos:[x,y+1,z],scale:[0.9,0.9,0.9]})); }
    if(i>4 && Math.random() < 0.15) o.push(newObj('cube',{name:'نطاط',pos:[x+w/2+1.2,y+0.1,z],scale:[1.2,0.3,1.2],color:'#00d2ff',body:'trigger',emissive:true,tex:'none',script:SCRIPTS.bouncer}));
  }
  o.push(newObj('goal',{pos:[x,y+1.7,z-3]})); o.push(newObj('cube',{name:'نهاية',pos:[x,y,z-3],scale:[4,1,4],color:'#ffd23f',tex:'checker'}));
  o.push(newObj('cube',{name:'خطر',pos:[0,-8,-30],scale:[200,0.5,200],color:'#ff0000',body:'trigger',tex:'none',opacity:0,script:SCRIPTS.killzone}));
  return { settings:{ title:'مرحلة عشوائية', sky:['#87c3ff','#ffb88c','#9be7ff','#2b2d57'][Math.floor(Math.random()*4)], music:true, camDist:10, camHeight:6 }, objects:o };
}
function tmplShooter(){
  var o = [];
  o.push(newObj('plane',{name:'الأرض',pos:[0,-0.05,0],scale:[36,1,36],color:'#3b4a6b',tex:'grid'}));
  o.push(newObj('player',{pos:[0,1.2,0],script:SCRIPTS.gunner,name:'لاعب مسلّح'}));
  [[-18,0,1,3,36],[18,0,1,3,36],[0,-18,36,3,1],[0,18,36,3,1]].forEach(function(w,i){ o.push(newObj('cube',{name:'سور '+(i+1),pos:[w[0],1.5,w[1]],scale:[w[2]>w[4]?w[2]:w[2],w[3],w[4]],color:'#5c677d',tex:'bricks'})); });
  for(var i=0;i<8;i++){ var a = i/8*Math.PI*2; o.push(newObj('enemy',{name:'مطارد '+(i+1),pos:[Math.cos(a)*13,1,Math.sin(a)*13],scale:[1.1,1.1,1.1],script:SCRIPTS.chaser,color:'#ff4d6d'})); }
  for(var k=0;k<5;k++) o.push(newObj('cube',{name:'عائق '+(k+1),pos:[-8+k*4,1,-6],scale:[2,2,2],color:'#8d99ae',tex:'bricks'}));
  o.push(newObj('cube',{name:'صحة',pos:[0,1,8],scale:[0.6,0.6,0.6],color:'#ff4d6d',body:'trigger',emissive:true,script:SCRIPTS.health}));
  o.push(newObj('light',{pos:[0,7,0],intensity:100}));
  return { settings:{ title:'ساحة المطاردين', sky:'#1b1f3a', music:true, camDist:12, camHeight:11 }, objects:o };
}
function tmplPhysics(){
  var o = [], cols = ['#ff6b6b','#ffd93d','#6bcB77','#4d96ff','#c77dff'];
  o.push(newObj('plane',{name:'الأرضية',pos:[0,-0.05,0],scale:[24,1,24],color:'#e9ecef',tex:'checker'}));
  o.push(newObj('player',{pos:[0,1.2,9]}));
  [[-12,0,1,3,24],[12,0,1,3,24],[0,-12,24,3,1]].forEach(function(w,i){ o.push(newObj('cube',{name:'حائط '+(i+1),pos:[w[0],1.5,w[1]],scale:[w[2],w[3],w[4]],color:'#495057',tex:'bricks'})); });
  for(var i=0;i<12;i++){ o.push(newObj('sphere',{name:'كرة '+(i+1),pos:[-6+(i%6)*2.4,4+Math.floor(i/6)*2.5,-3-Math.floor(i/6)],scale:[1.1,1.1,1.1],color:cols[i%5],body:'dynamic',bounce:0.55+0.04*(i%5),metal:0.2,rough:0.3})); }
  for(var k=0;k<6;k++){ o.push(newObj('cube',{name:'صندوق '+(k+1),pos:[-5+k*2,0.5+(k%2)*1.05,3],scale:[1,1,1],color:'#c68642',body:'dynamic',tex:'bricks'})); }
  o.push(newObj('cube',{name:'منحدر',pos:[0,0.6,-8],scale:[6,0.4,5],rot:[0,0,0],color:'#00b4d8',body:'static',tex:'grid'}));
  return { settings:{ title:'ملعب الفيزياء', skyKind:'day', camDist:12, camHeight:8, gravity:20 }, objects:o };
}
function tmplFPS(){
  var o = [], cols = ['#e07a5f','#81b29a','#f2cc8f','#3d405b'];
  o.push(newObj('plane',{name:'الأرضية',pos:[0,-0.05,0],scale:[34,1,34],color:'#2d3142',tex:'grid'}));
  o.push(newObj('player',{pos:[0,1.2,14],script:SCRIPTS.fps,name:'لاعب (منظور أول)'}));
  [[-17,0,1,4,34],[17,0,1,4,34],[0,-17,34,4,1],[0,17,34,4,1]].forEach(function(w,i){ o.push(newObj('cube',{name:'سور '+(i+1),pos:[w[0],2,w[1]],scale:[w[2],w[3],w[4]],color:'#4f5d75',tex:'bricks'})); });
  [[-8,-4],[8,-4],[0,2],[-8,8],[8,8],[0,-10]].forEach(function(p,i){ o.push(newObj('cube',{name:'عمود '+(i+1),pos:[p[0],2,p[1]],scale:[2.5,4,2.5],color:cols[i%4],tex:'bricks'})); });
  for(var i=0;i<7;i++){ var a = i/7*Math.PI*2; o.push(newObj('enemy',{name:'عدو '+(i+1),pos:[Math.cos(a)*11,1,Math.sin(a)*11-2],scale:[1.2,1.2,1.2],script:SCRIPTS.chaser,color:'#ef476f'})); }
  o.push(newObj('cube',{name:'صحة',pos:[0,0.8,10],scale:[0.6,0.6,0.6],color:'#ff4d6d',body:'trigger',emissive:true,script:SCRIPTS.health}));
  o.push(newObj('text',{name:'تعليمات',pos:[0,2.6,16],scale:[3.4,1.7,1],text:'اسحب للنظر\nزر فعل = إطلاق',color:'#ffe066'}));
  o.push(newObj('light',{pos:[0,6,0],intensity:110}));
  return { settings:{ title:'ساحة المنظور الأول', skyKind:'night', camera:'first', music:true }, objects:o };
}
function tmplPuzzle(){
  var o = [];
  o.push(newObj('plane',{name:'الأرضية',pos:[0,-0.05,0],scale:[30,1,30],color:'#3a506b',tex:'grid'}));
  o.push(newObj('player',{pos:[0,1.2,12]}));
  [[-15,0,1,3,30],[15,0,1,3,30],[0,-15,30,3,1],[0,15,30,3,1]].forEach(function(w,i){ o.push(newObj('cube',{name:'سور '+(i+1),pos:[w[0],1.5,w[1]],scale:[w[2],w[3],w[4]],color:'#5bc0be',tex:'bricks'})); });
  o.push(newObj('cube',{name:'حاجز',pos:[-6,1.5,0],scale:[18,3,1],color:'#6fffe9',tex:'bricks'}));
  o.push(newObj('cube',{name:'حاجز',pos:[11,1.5,0],scale:[8,3,1],color:'#6fffe9',tex:'bricks'}));
  o.push(newObj('cube',{name:'باب',pos:[5,1.5,0],scale:[4,3,0.8],color:'#8d5a2b',tex:'bricks',script:SCRIPTS.door,body:'static'}));
  o.push(newObj('cone',{name:'مفتاح',pos:[-10,1,8],scale:[0.5,0.8,0.5],color:'#ffd23f',body:'trigger',emissive:true,script:SCRIPTS.key,rot:[0,0,180]}));
  o.push(newObj('text',{name:'تلميح',pos:[5,3.6,1.5],scale:[3,1.5,1],text:'ابحث عن المفتاح 🔑',color:'#ffe066'}));
  for(var i=0;i<5;i++) o.push(newObj('coin',{name:'نجمة '+(i+1),pos:[-8+i*4,1,-8]}));
  o.push(newObj('enemy',{name:'حارس',pos:[0,1,-6],scale:[1.2,1.2,1.2],script:SCRIPTS.chaser,color:'#ef476f'}));
  o.push(newObj('goal',{pos:[11,1.2,-10]}));
  o.push(newObj('cube',{name:'مؤقت',pos:[0,-5,0],scale:[0.1,0.1,0.1],body:'none',script:SCRIPTS.timer.replace('left = 60','left = 90'),color:'#000000',opacity:0}));
  o.push(newObj('light',{pos:[0,7,0],intensity:100}));
  return { settings:{ title:'غرفة اللغز', skyKind:'dawn', music:true, camDist:11, camHeight:9 }, objects:o };
}
function tmplShowcase(){
  var o = [];
  o.push(newObj('plane',{name:'الجزيرة',pos:[0,-0.05,0],scale:[12,1,12],color:'#6b8e4e',tex:'grid'}));
  o.push(newObj('water',{name:'ماء',pos:[0,-0.3,-14],scale:[40,1,16]}));
  o.push(newObj('player',{pos:[0,1.2,4]}));
  o.push(newObj('text',{name:'لافتة',pos:[0,2.6,1],scale:[3.4,1.7,1],text:'مرحباً بك!\nاجمع النجوم واعبر الماء',color:'#ffe066'}));
  o.push(newObj('particles',{name:'نار',pos:[-4,0.1,-2],scale:[1.2,2.2,1.2],kind:'fire',color:'#ff7a1a'}));
  o.push(newObj('cylinder',{name:'موقد',pos:[-4,0.25,-2],scale:[1.6,0.5,1.6],color:'#555a66',tex:'bricks'}));
  o.push(newObj('particles',{name:'بريق',pos:[4,1,-2],scale:[3,2,3],kind:'sparkle',color:'#7de3ff'}));
  o.push(newObj('particles',{name:'ثلج',pos:[0,6,-4],scale:[16,6,16],kind:'snow',color:'#ffffff'}));
  o.push(newObj('particles',{name:'دخان',pos:[-4,2,-2],scale:[0.8,3,0.8],kind:'smoke',color:'#888888'}));
  [[0,0.5,-9.5],[0,0.5,-13],[3,1.2,-16],[-3,2,-19],[0,2.8,-22]].forEach(function(p,i){ o.push(newObj('cube',{name:'حجر '+(i+1),pos:p,scale:[2.6,0.6,2.6],color:['#adb5bd','#ced4da'][i%2],tex:'bricks'})); });
  o.push(newObj('checkpoint',{pos:[0,1.2,-9.5],name:'نقطة حفظ'}));
  [[0,1.7,-13],[3,2.4,-16],[-3,3.2,-19]].forEach(function(p,i){ o.push(newObj('coin',{name:'نجمة '+(i+1),pos:p})); });
  o.push(newObj('goal',{pos:[0,4.2,-22]}));
  o.push(newObj('light',{pos:[0,5,-8],intensity:120,color:'#9fd6ff'}));
  return { settings:{ title:'عرض المزايا', skyKind:'night', sky:'#0b1030', music:true, camDist:10, camHeight:6 }, objects:o };
}
/* ===== القوالب ===== */
function tmplParkour(){
  var o = [], z = 0, y = 0.25, i;
  o.push(newObj('water',{name:'حمم',pos:[0,-3,-60],scale:[60,1,160],color:'#ff4500'}));
  o.push(newObj('cube',{name:'بداية',pos:[0,0,4],scale:[8,0.5,8],color:'#4cc9f0',tex:'grid'}));
  o.push(newObj('player',{pos:[0,1.5,4]}));
  var cols = ['#6c8cff','#ff7ab8','#7ad9a0','#ffb45c','#c58bff'];
  for(i=1;i<=14;i++){
    z -= 5.2; y += (i % 3 === 0 ? 0.9 : 0.3); var x = Math.sin(i * 1.3) * 3, kind = i % 5;
    if(kind === 2){ o.push(newObj('cube',{name:'منصة مسار',pos:[x,y,z],scale:[3.2,0.5,3.2],color:'#4cc9f0',tex:'grid',body:'kinematic',script:SCRIPTS.platform.replace("axis = 'x', range = 4","axis = 'x', range = 3"),emissive:true})); }
    else if(kind === 4){ o.push(newObj('cube',{name:'منصة تسقط',pos:[x,y,z],scale:[3.4,0.5,3.4],color:'#adb5bd',body:'static',script:SCRIPTS.falling})); }
    else { o.push(newObj('cube',{name:'منصة '+i,pos:[x,y,z],scale:[3.6,0.5,3.6],color:cols[i%5],tex:'checker',body:'static'})); }
    if(i % 4 === 0){ o.push(newObj('checkpoint',{name:'نقطة حفظ',pos:[x,y+1.1,z]})); }
    if(i % 2 === 1){ o.push(newObj('coin',{name:'نجمة '+i,pos:[x,y+1.4,z]})); }
  }
  o.push(newObj('cube',{name:'قمة',pos:[0,y+0.4,z-6],scale:[6,0.6,6],color:'#ffd23f',tex:'grid',body:'static'}));
  o.push(newObj('goal',{pos:[0,y+1.8,z-6]}));
  o.push(newObj('text',{name:'لافتة',pos:[0,3.2,0],scale:[5,1.6,1],text:'تسلّق للقمة!',color:'#ffe066'}));
  o.push(newObj('light',{pos:[0,25,-30],intensity:120}));
  return { settings:{ title:'برج الباركور', skyKind:'sunset', music:true, camDist:10, camHeight:7, cycle:true, grade:'warm', vig:true }, objects:o };
}
function tmplGauntlet(){
  var o = [], i;
  o.push(newObj('plane',{name:'الأرض',pos:[0,-0.05,-40],scale:[16,1,100],color:'#2b2d42',tex:'grid'}));
  o.push(newObj('player',{pos:[0,1.2,6]}));
  [-8,8].forEach(function(x){ o.push(newObj('cube',{name:'جدار',pos:[x,2,-40],scale:[0.6,4,100],color:'#8d99ae',tex:'bricks'})); });
  o.push(newObj('text',{name:'لافتة',pos:[0,3,2],scale:[6,1.6,1],text:'ممر العقبات: اعبر للنهاية!',color:'#ffe066'}));
  for(i=0;i<5;i++){
    var z = -8 - i*14;
    if(i % 3 === 0){ o.push(newObj('sphere',{name:'بندول',pos:[0,2,z],scale:[1.6,1.6,1.6],color:'#e63946',body:'trigger',emissive:true,script:SCRIPTS.pendulum.replace('len = 4','len = 5').replace('speed = 2','speed = 2.4')})); }
    else if(i % 3 === 1){ o.push(newObj('cube',{name:'عارضة دوارة',pos:[0,0.7,z],scale:[12,0.6,0.6],color:'#ff9f1c',body:'trigger',emissive:true,script:"function update(dt){ self.rot.y += dt * 1.6; }\nfunction onTouch(o){ if(o.type === 'player') game.respawn(o); }\n"})); }
    else { o.push(newObj('cylinder',{name:'برج',pos:[6,0.8,z],scale:[1.4,1.6,1.4],color:'#6c757d',body:'static',script:SCRIPTS.turret})); o.push(newObj('cylinder',{name:'برج',pos:[-6,0.8,z-4],scale:[1.4,1.6,1.4],color:'#6c757d',body:'static',script:SCRIPTS.turret})); }
    o.push(newObj('coin',{name:'نجمة',pos:[(i%2?3:-3),1,z-5]}));
    if(i === 2) o.push(newObj('checkpoint',{name:'نقطة حفظ',pos:[0,1.2,z-8]}));
  }
  o.push(newObj('goal',{pos:[0,1.2,-86]}));
  o.push(newObj('light',{pos:[0,15,-30],intensity:100}));
  return { settings:{ title:'ممر العقبات', skyKind:'night', music:true, camDist:10, camHeight:7, grade:'cold', vig:true }, objects:o };
}
function tmplEmpty(){ return { settings:{}, objects:[ newObj('plane',{name:'الأرض',pos:[0,-0.05,0],scale:[40,1,40]}), newObj('player',{pos:[0,1.2,0]}) ] }; }
function tmplPlatformer(){
  var o = [];
  o.push(newObj('plane',{name:'الأرض',pos:[0,-0.05,0],scale:[14,1,14],color:'#5aa469'}));
  o.push(newObj('player',{pos:[0,1.5,5]}));
  var plats = [[0,0.5,-1,3,1,3],[5,1.5,-4,3,1,3],[-5,2.5,-6,3,1,3],[0,3.5,-9,4,1,3],[6,4.5,-12,3,1,3]];
  plats.forEach(function(p,i){ o.push(newObj('cube',{name:'منصة '+(i+1),pos:[p[0],p[1],p[2]],scale:[p[3],p[4],p[5]],color:['#6c8cff','#ff7ab8','#7ad9a0','#ffb45c','#c58bff'][i]})); });
  o.push(newObj('cube',{name:'منصة متحركة',pos:[-3,1.2,2],scale:[3,0.5,3],color:'#ffa94d',body:'kinematic',tex:'none',script:SCRIPTS.platform}));
  [[0,1.4,-1],[5,2.4,-4],[-5,3.4,-6],[0,4.4,-9],[3,1.2,2],[-3,2.2,2]].forEach(function(p,i){ o.push(newObj('coin',{name:'عملة '+(i+1),pos:p})); });
  o.push(newObj('enemy',{name:'عدو 1',pos:[0,4.2,-9],scale:[0.9,0.9,0.9]}));
  o.push(newObj('goal',{pos:[6,6,-12]}));
  o.push(newObj('cube',{name:'خطر',pos:[0,-2,-6],scale:[80,0.5,80],color:'#ff0000',body:'trigger',tex:'none',opacity:0.0,script:SCRIPTS.killzone}));
  return { settings:{ title:'مغامرة المنصات' }, objects:o };
}
function tmplArena(){
  var o = [];
  o.push(newObj('plane',{name:'الأرض',pos:[0,-0.05,0],scale:[30,1,30],color:'#4b6bb0',tex:'grid'}));
  o.push(newObj('player',{pos:[0,1.2,0]}));
  [[-15,0],[15,0],[0,-15],[0,15]].forEach(function(p,i){ var h = i<2; o.push(newObj('cube',{name:'جدار '+(i+1),pos:[p[0],1.5,p[1]],scale:h?[1,3,30]:[30,3,1],color:'#8d99ae',tex:'bricks'})); });
  for(var i=0;i<14;i++){ var a = i/14*Math.PI*2, r = 6+ (i%3)*3; o.push(newObj('coin',{name:'عملة '+(i+1),pos:[Math.cos(a)*r,1,Math.sin(a)*r]})); }
  for(var j=0;j<3;j++){ o.push(newObj('enemy',{name:'عدو '+(j+1),pos:[-6+j*6,1,-6-j*3],scale:[1.1,1.1,1.1]})); }
  for(var k=0;k<5;k++){ o.push(newObj('cube',{name:'صندوق '+(k+1),pos:[-4+k*2,2+k*0.6,4],scale:[1,1,1],color:'#c68642',body:'dynamic',tex:'bricks'})); }
  o.push(newObj('goal',{pos:[0,1.2,-12]}));
  return { settings:{ title:'ساحة العملات', sky:'#2b2d57', camDist:11, camHeight:8 }, objects:o };
}
function tmplLabyrinth(){
  var o = [];
  o.push(newObj('plane',{name:'الأرض',pos:[0,-0.05,0],scale:[24,1,24],color:'#3d405b',tex:'grid'}));
  o.push(newObj('player',{pos:[-10,1.2,10]}));
  var walls = [[0,0,16,1],[ -6,-5,1,10],[4,-3,1,12],[-2,6,10,1],[8,4,8,1],[-9,-9,6,1]];
  walls.forEach(function(w,i){ o.push(newObj('cube',{name:'جدار '+(i+1),pos:[w[0],1.5,w[1]],scale:[w[2],3,w[3]],color:'#e07a5f',tex:'bricks'})); });
  [[-10,6],[ -3,-8],[2,2],[10,8],[6,-9],[-9,-2]].forEach(function(p,i){ o.push(newObj('coin',{name:'عملة '+(i+1),pos:[p[0],1,p[1]]})); });
  o.push(newObj('cube',{name:'نطاط',pos:[7,0.3,-3],scale:[2,0.6,2],color:'#00d2ff',body:'trigger',tex:'none',emissive:true,script:SCRIPTS.bouncer}));
  o.push(newObj('torus',{name:'حلقة',pos:[7,2.5,-3],color:'#c58bff',emissive:true,script:SCRIPTS.spinner}));
  o.push(newObj('goal',{pos:[10,1.2,-10]}));
  o.push(newObj('light',{pos:[0,6,0],intensity:120}));
  return { settings:{ title:'المتاهة', sky:'#14213d', camera:'top', camDist:9, camHeight:6 }, objects:o };
}
var TEMPLATES = { gauntlet:['🌀 ممر العقبات (بندول وعارضة وأبراج)',tmplGauntlet], parkour:['🧗 برج باركور (منصات متحركة وساقطة)',tmplParkour], puzzle:['🔑 غرفة لغز (مفتاح وباب ومؤقت)',tmplPuzzle], fps:['🎯 منظور أول: إطلاق نار',tmplFPS], physics:['⚽ ملعب فيزياء (كرات ترتد)',tmplPhysics], showcase:['✨ عرض المزايا (ماء ونار وثلج)',tmplShowcase], shooter:['🔫 مطاردة وإطلاق نار',tmplShooter], random:['🎲 مرحلة عشوائية جديدة',tmplRandom], platformer:['🏞 منصات',tmplPlatformer], arena:['🏟 ساحة عملات',tmplArena], maze:['🧱 متاهة',tmplLabyrinth], empty:['⬜ مشروع فارغ',tmplEmpty] };

/* ===== الحالة ===== */
var multi = [], state = null, selId = null, undoStack = [], redoStack = [], tool = 'move', snap = 0, mode = 'edit', run = null, dirty = false;
var meshes = {}, multiMode = false;
function relink(){ if(state.levels){ if(state.active == null || !state.levels[state.active]) state.active = 0; state.objects = state.levels[state.active].objects; } }
function syncLevels(){ if(state.levels) state.levels[state.active].objects = state.objects; }
function snapshot(){ syncLevels(); return JSON.stringify(state); }
function gameData(){ syncLevels(); var d = { settings: state.settings }; if(state.levels && state.levels.length > 1) d.levels = state.levels.map(function(l){ return { name:l.name, objects:l.objects }; }); else d.objects = state.objects; return JSON.parse(JSON.stringify(d)); }
function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length > 80) undoStack.shift(); redoStack = []; markDirty(); updateUndoBtns(); }
function restore(js){ state = JSON.parse(js); relink(); allUid(); if(!state.objects.some(function(o){ return o.id === selId; })) selId = null; rebuildAll(); renderAll(); renderLevels(); }
function undo(){ if(!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); updateUndoBtns(); markDirty(); }
function redo(){ if(!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); updateUndoBtns(); markDirty(); }
function updateUndoBtns(){ $('#bUndo').disabled = !undoStack.length; $('#bRedo').disabled = !redoStack.length; }
function markDirty(){ dirty = true; clearTimeout(markDirty.t); markDirty.t = setTimeout(autosave, 800); }
function autosave(){ try{ localStorage.setItem('engine.autosave', snapshot()); $('#saveState').textContent = 'تم الحفظ تلقائياً ✓'; }catch(e){ $('#saveState').textContent = 'تعذر الحفظ'; } }
function getObj(id){ for(var i=0;i<state.objects.length;i++) if(state.objects[i].id === id) return state.objects[i]; return null; }

/* ===== مشهد المحرر ===== */
var host = $('#viewport'), canvas = $('#edCanvas');
var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, preserveDrawingBuffer:true});
renderer.shadowMap.enabled = true; renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(55,1,0.1,500);
var sunL = new THREE.DirectionalLight(0xffffff, 1.1); sunL.position.set(30,50,20); sunL.castShadow = true; sunL.shadow.mapSize.set(2048,2048); var sc = sunL.shadow.camera; sc.left=sc.bottom=-50; sc.right=sc.top=50; sc.far=150; scene.add(sunL);
var hemi = new THREE.HemisphereLight(0xffffff,0x445566,0.55); scene.add(hemi);
var grid = new THREE.GridHelper(80, 80, 0x888899, 0x445066); grid.position.y = 0.001; grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid);
var content = new THREE.Group(); scene.add(content);
var sel = { box:null };
var orbit = { target:new THREE.Vector3(0,1,0), yaw:0.5, pitch:0.55, dist:20 };
function updateCam(){ var cp = Math.cos(orbit.pitch); cam.position.set(orbit.target.x + orbit.dist*cp*Math.sin(orbit.yaw), orbit.target.y + orbit.dist*Math.sin(orbit.pitch), orbit.target.z + orbit.dist*cp*Math.cos(orbit.yaw)); cam.lookAt(orbit.target); }
var starsObj = null;
var vigDiv = null; function vigEd(on){ if(!vigDiv){ vigDiv = document.createElement('div'); vigDiv.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,#000a 100%)'; renderer.domElement.parentNode.appendChild(vigDiv); } vigDiv.style.display = on ? 'block' : 'none'; }
function applySettings(){ var S = Object.assign({}, DEFAULT_SETTINGS, state.settings); renderer.domElement.style.filter = GRADES[S.grade] || ''; vigEd(S.vig); var fc = S.sky; scene.background = new THREE.Color(S.sky); if(starsObj){ scene.remove(starsObj); starsObj = null; } if(S.skyKind && S.skyKind !== 'solid'){ var sk = makeSky(THREE, S.skyKind); scene.background = sk.tex; fc = sk.fog; if(S.skyKind === 'night' || S.skyKind === 'space'){ starsObj = makeStars(THREE, 500); scene.add(starsObj); } } scene.fog = S.fog ? new THREE.Fog(fc, 60, 200) : null; sunL.intensity = S.sun; hemi.intensity = S.ambient; }

function addMesh(o){
  var g = buildMesh(THREE, o, {editor:true}); g.userData.id = o.id; meshes[o.id] = g; content.add(g); syncMesh(o);
  g.traverse(function(m){ m.userData.oid = o.id; });
}
function syncMesh(o){ var g = meshes[o.id]; if(!g) return; g.position.set(o.pos[0],o.pos[1],o.pos[2]); g.rotation.set(THREE.MathUtils.degToRad(o.rot[0]),THREE.MathUtils.degToRad(o.rot[1]),THREE.MathUtils.degToRad(o.rot[2]),'YXZ'); g.scale.set(o.scale[0],o.scale[1],o.scale[2]); }
function removeMesh(id){ var g = meshes[id]; if(!g) return; content.remove(g); g.traverse(function(m){ if(m.geometry) m.geometry.dispose(); if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } }); delete meshes[id]; }
function rebuildMesh(o){ removeMesh(o.id); addMesh(o); }
function rebuildAll(){ Object.keys(meshes).forEach(function(id){ removeMesh(+id); }); state.objects.forEach(addMesh); applySettings(); updateSelVis(); }

/* مُحدِّد + مقابض */
var gizmo = new THREE.Group(); gizmo.visible = false; scene.add(gizmo);
var AXC = [0xff4d4d, 0x4dff6a, 0x4d8dff], AXV = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)], handles = [];
(function(){
  for(var i=0;i<3;i++){
    var g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({color:AXC[i], depthTest:false, transparent:true, opacity:0.95});
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,1,8), mat); shaft.position.y = 0.5;
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.12,0.3,12), mat); tip.position.y = 1.15;
    var big = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,1.4,6), new THREE.MeshBasicMaterial({visible:false})); big.position.y = 0.7;
    g.add(shaft); g.add(tip); g.add(big);
    if(i===0) g.rotation.z = -Math.PI/2; if(i===2) g.rotation.x = Math.PI/2;
    g.traverse(function(m){ m.userData.axis = i; m.renderOrder = 999; });
    gizmo.add(g); handles.push(g);
  }
})();
function updateSelVis(){
  if(sel.box){ scene.remove(sel.box); sel.box = null; } if(sel.extra){ sel.extra.forEach(function(b){ scene.remove(b); }); } sel.extra = [];
  multi = multi.filter(function(id){ return !!getObj(id); }); if(selId && multi.indexOf(selId) < 0) multi.push(selId);
  var o = selId && getObj(selId), g = o && meshes[selId];
  gizmo.visible = !!g && mode === 'edit';
  if(g){ sel.box = new THREE.BoxHelper(g, 0xffff00); scene.add(sel.box); }
  multi.forEach(function(id){ if(id !== selId && meshes[id]){ var b = new THREE.BoxHelper(meshes[id], 0x66ccff); scene.add(b); sel.extra.push(b); } });
}
function updateGizmoPos(){
  var o = selId && getObj(selId); if(!o) return;
  gizmo.position.set(o.pos[0],o.pos[1],o.pos[2]);
  var d = cam.position.distanceTo(gizmo.position); gizmo.scale.setScalar(Math.max(0.5, d*0.11));
  if(sel.box) sel.box.update(); if(sel.extra) sel.extra.forEach(function(b){ b.update(); });
}
function resizeEd(){ var w = host.clientWidth, h = host.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); cam.aspect = w/h; cam.updateProjectionMatrix(); }
new ResizeObserver(resizeEd).observe(host);
var clk = new THREE.Clock();
function loop(){ requestAnimationFrame(loop); if(mode !== 'edit') return; var dtc = Math.min(0.05, clk.getDelta()); content.children.forEach(function(g){ if(g.userData.psys) stepParticles(g.userData.psys, dtc); }); updateCam(); updateGizmoPos(); renderer.render(scene, cam); }

/* ===== مؤشرات الإدخال على المنظور ===== */
var ptrs = {}, drag = null, pinch = null, ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
function setRay(e){ var r = canvas.getBoundingClientRect(); mouse.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(mouse, cam); }
function axisParam(o, d, r){ var w0 = new THREE.Vector3().subVectors(o.p0, r.origin), b = d.dot(r.direction), dd = d.dot(w0), e = r.direction.dot(w0), den = 1 - b*b; if(Math.abs(den) < 1e-4) return 0; return (b*e - dd)/den; }
canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });
canvas.addEventListener('pointerdown', function(e){
  canvas.setPointerCapture(e.pointerId); ptrs[e.pointerId] = {x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,btn:e.button};
  var n = Object.keys(ptrs).length;
  if(n === 1){
    setRay(e);
    if(gizmo.visible){
      var hit = ray.intersectObjects(handles, true).filter(function(h){ return h.object.userData.axis != null; })[0];
      if(hit){
        var o = getObj(selId), ax = hit.object.userData.axis;
        var d = AXV[ax].clone(), p0 = new THREE.Vector3(o.pos[0],o.pos[1],o.pos[2]);
        drag = { others: multi.filter(function(i){ return i !== selId; }).map(function(i){ var q = getObj(i); return {o:q, pos:q.pos.slice(), scale:q.scale.slice(), rot:q.rot.slice()}; }), axis:ax, o:o, d:d, p0:p0, t0:axisParam({p0:p0}, d, ray.ray), start:{pos:o.pos.slice(), rot:o.rot.slice(), scale:o.scale.slice()}, moved:false };
        ptrs[e.pointerId].gizmo = true; return;
      }
    }
    ptrs[e.pointerId].orbit = true;
  } else if(n === 2){
    var ks = Object.keys(ptrs); pinch = { d: Math.hypot(ptrs[ks[0]].x-ptrs[ks[1]].x, ptrs[ks[0]].y-ptrs[ks[1]].y), dist: orbit.dist }; drag = null;
  }
});
canvas.addEventListener('pointermove', function(e){
  var p = ptrs[e.pointerId]; if(!p) return; var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  var n = Object.keys(ptrs).length;
  if(drag && p.gizmo){
    setRay(e); var t = axisParam({p0:drag.p0}, drag.d, ray.ray) - drag.t0, o = drag.o, ax = drag.axis;
    if(tool === 'move'){ var v = drag.start.pos[ax] + t; if(snap) v = Math.round(v/snap)*snap; o.pos[ax] = +v.toFixed(3); }
    else if(tool === 'scale'){ var sv = Math.max(0.05, drag.start.scale[ax] + t); if(snap) sv = Math.max(snap, Math.round(sv/snap)*snap); o.scale[ax] = +sv.toFixed(3); }
    else { var rv = drag.start.rot[ax] + t*45; if(snap) rv = Math.round(rv/15)*15; o.rot[ax] = +rv.toFixed(1); }
    drag.moved = true; syncMesh(o);
    drag.others.forEach(function(q){ var dlt = o[tool === 'move' ? 'pos' : tool === 'scale' ? 'scale' : 'rot'][ax] - drag.start[tool === 'move' ? 'pos' : tool === 'scale' ? 'scale' : 'rot'][ax]; if(tool === 'scale') q.o.scale[ax] = Math.max(0.05, q.scale[ax] + dlt); else if(tool === 'move') q.o.pos[ax] = +(q.pos[ax] + dlt).toFixed(3); else q.o.rot[ax] = +(q.rot[ax] + dlt).toFixed(1); syncMesh(q.o); }); if(tool === 'scale' && o.tex !== 'none') rebuildMesh(o); fillInspectorValues(); return;
  }
  if(n >= 2 && pinch){
    var ks = Object.keys(ptrs), d = Math.hypot(ptrs[ks[0]].x-ptrs[ks[1]].x, ptrs[ks[0]].y-ptrs[ks[1]].y); orbit.dist = Math.max(2, Math.min(150, pinch.dist * pinch.d / Math.max(20,d)));
    panBy(dx/2, dy/2); return;
  }
  if(p.orbit){
    if(p.btn === 2 || p.btn === 1 || e.shiftKey) panBy(dx, dy);
    else { orbit.yaw -= dx*0.007; orbit.pitch = Math.max(-0.2, Math.min(1.5, orbit.pitch + dy*0.007)); }
  }
});
function panBy(dx, dy){ var k = orbit.dist*0.0016, right = new THREE.Vector3(), up = new THREE.Vector3(0,1,0); cam.getWorldDirection(right); right.cross(up).normalize(); orbit.target.addScaledVector(right, -dx*k); var fw = new THREE.Vector3(Math.sin(orbit.yaw),0,Math.cos(orbit.yaw)); orbit.target.addScaledVector(fw, -dy*k); }
function endPtr(e){
  var p = ptrs[e.pointerId]; if(!p) return;
  if(drag && p.gizmo){ if(drag.moved){ var cur = {pos:drag.o.pos.slice(),rot:drag.o.rot.slice(),scale:drag.o.scale.slice()}, curO = drag.others.map(function(q){ return {pos:q.o.pos.slice(),rot:q.o.rot.slice(),scale:q.o.scale.slice()}; }); var o = drag.o; o.pos = drag.start.pos; o.rot = drag.start.rot; o.scale = drag.start.scale; drag.others.forEach(function(q){ q.o.pos = q.pos; q.o.rot = q.rot; q.o.scale = q.scale; }); pushUndo(); o.pos = cur.pos; o.rot = cur.rot; o.scale = cur.scale; drag.others.forEach(function(q,i){ q.o.pos = curO[i].pos; q.o.rot = curO[i].rot; q.o.scale = curO[i].scale; }); markDirty(); renderInspector(); } drag = null; }
  else if(p.orbit && Math.hypot(e.clientX-p.sx, e.clientY-p.sy) < 6 && p.btn === 0 && !pinch){
    setRay(e); var picks = []; content.children.forEach(function(g){ if(g.userData.pick) picks.push(g.userData.pick); });
    var hit = ray.intersectObjects(picks, false)[0]; select(hit ? hit.object.userData.oid : null, hit && (e.shiftKey || e.ctrlKey || e.metaKey || multiMode));
  }
  delete ptrs[e.pointerId]; if(Object.keys(ptrs).length < 2) pinch = null;
}
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', function(e){ e.preventDefault(); orbit.dist = Math.max(2, Math.min(150, orbit.dist * (1 + e.deltaY*0.001))); }, {passive:false});

/* ===== واجهة المحرر ===== */
function select(id, add){ if(add && id){ var ix = multi.indexOf(id); if(ix >= 0){ multi.splice(ix,1); if(selId === id) selId = multi.length ? multi[multi.length-1] : null; } else { multi.push(id); selId = id; } } else { multi = id ? [id] : []; selId = id; } if(id && matchMedia('(max-width:820px)').matches) showSide('props'); updateSelVis(); renderHierarchy(); renderInspector(); }
function ICON(t){ return {cube:'🟦',sphere:'🔴',cylinder:'🛢',cone:'🔺',torus:'⭕',plane:'▭',player:'🧍',coin:'🪙',enemy:'👾',goal:'🏁',light:'💡',text:'🔤',particles:'✨',water:'🌊',checkpoint:'🚩'}[t] || '◼'; }
function renderHierarchy(){
  var ul = $('#hier'); ul.innerHTML = '';
  state.objects.forEach(function(o){
    var li = document.createElement('li'); li.className = (o.id === selId ? 'sel' : (multi.indexOf(o.id) >= 0 ? 'sel2' : '')); li.innerHTML = '<span class="ic">' + ICON(o.type) + '</span><span class="nm"></span>' + (o.script ? '<span class="hasS" title="سكربت">{ }</span>' : '');
    $('.nm', li).textContent = o.name; li.onclick = function(ev){ select(o.id, ev.shiftKey || ev.ctrlKey || ev.metaKey || multiMode); };
    ul.appendChild(li);
  });
  $('#objCount').textContent = state.objects.length;
}
function numRow(label, key, o, step){
  return '<div class="row3"><label>' + label + '</label>' + [0,1,2].map(function(i){ return '<input type="number" step="' + step + '" data-k="' + key + '" data-i="' + i + '" value="' + (+o[key][i]).toFixed(2).replace(/\.?0+$/,'') + '">'; }).join('') + '</div>';
}
function renderInspector(){
  var box = $('#inspector'), o = selId && getObj(selId);
  if(!o){ box.innerHTML = '<p class="hint">اختر كائناً من المشهد أو القائمة لتعديله.<br>اضغط عليه أو استخدم قائمة الكائنات.</p>'; return; }
  var h = '<div class="row"><label>الاسم</label><input id="iName" value=""></div><div class="row"><label>الوسم</label><input id="iTag" placeholder="مثلاً: عدو"></div>';
  h += numRow('الموضع','pos',o,0.25) + numRow('الدوران°','rot',o,15) + numRow('الحجم','scale',o,0.25);
  if(o.type !== 'light' && o.type !== 'text' && o.type !== 'particles'){
    h += '<div class="row"><label>اللون</label><input type="color" id="iColor" value="' + o.color + '"><label class="chk"><input type="checkbox" id="iEmis"' + (o.emissive?' checked':'') + '> متوهج</label></div>';
    h += '<div class="row"><label>الخامة</label><select id="iTex">' + [['none','سادة'],['checker','رقعة شطرنج'],['grid','شبكة'],['bricks','طوب'],['custom','صورتي']].map(function(t){ return '<option value="'+t[0]+'"'+(o.tex===t[0]?' selected':'')+'>'+t[1]+'</option>'; }).join('') + '</select></div>';
    h += '<div class="row"><label>صورة</label><label class="btn sm">رفع صورة كخامة<input type="file" id="iImg" accept="image/*" hidden></label></div>';
    h += '<div class="row"><label>معدنية</label><input type="range" id="iMetal" min="0" max="1" step="0.05" value="' + o.metal + '"><label>خشونة</label><input type="range" id="iRough" min="0" max="1" step="0.05" value="' + o.rough + '"></div>';
    h += '<div class="row"><label>شفافية</label><input type="range" id="iOp" min="0" max="1" step="0.05" value="' + o.opacity + '"></div>';
    h += '<div class="row"><label>ارتداد</label><input type="range" id="iBounce" min="0" max="0.95" step="0.05" value="' + (o.bounce||0) + '"><span class="hint" style="min-width:30px">' + (o.bounce||0) + '</span></div>' + '<div class="row"><label>الفيزياء</label><select id="iBody">' + [['none','بدون'],['static','ثابت (صلب)'],['dynamic','ديناميكي (جاذبية)'],['kinematic','حركي (منصة)'],['trigger','محفز (يمرّ منه)']].map(function(t){ return '<option value="'+t[0]+'"'+(o.body===t[0]?' selected':'')+'>'+t[1]+'</option>'; }).join('') + '</select></div>';
  } else {
    h += '<div class="row"><label>اللون</label><input type="color" id="iColor" value="' + o.color + '">' + (o.type === 'light' ? '<label>الشدة</label><input type="range" id="iInt" min="0" max="300" step="5" value="' + (o.intensity||60) + '">' : '') + '</div>';
  }
  if(o.type === 'text') h += '<div class="row"><label>النص</label><textarea id="iText" rows="2" style="flex:1"></textarea></div>';
  if(o.type === 'particles') h += '<div class="row"><label>النوع</label><select id="iKind">' + [['fire','نار'],['snow','ثلج'],['smoke','دخان'],['sparkle','بريق']].map(function(t){ return '<option value="'+t[0]+'"'+((o.kind||'fire')===t[0]?' selected':'')+'>'+t[1]+'</option>'; }).join('') + '</select></div>';
  var an = o.anim || { keys: [], mode: 'loop' };
  h += '<div class="hint" style="margin-top:8px">🎬 أنيميشن (مفاتيح الحركة): ' + an.keys.length + ' مفتاح</div><div class="row"><label>الوقت (ث)</label><input type="number" id="aT" value="' + (an.keys.length ? an.keys[an.keys.length-1].t + 2 : 0) + '" min="0" step="0.5" style="width:70px"><button class="btn sm" id="aAdd">＋ مفتاح بالوضع الحالي</button></div><div class="row"><label>النمط</label><select id="aMode"><option value="loop">تكرار</option><option value="pingpong">ذهاب وإياب</option><option value="once">مرة واحدة</option></select><button class="btn sm" id="aPrev">▶ معاينة</button><button class="btn sm" id="aClr">مسح</button></div>';
  h += '<div class="row"><label>سكربت</label><select id="iPreset"><option value="">— قالب جاهز —</option>' + Object.keys(SCRIPT_NAMES).map(function(k){ return '<option value="'+k+'">'+SCRIPT_NAMES[k]+'</option>'; }).join('') + '</select><button id="iEditS" class="btn sm">✎ تحرير</button></div>';
  box.innerHTML = h; $('#iName').value = o.name; $('#iTag').value = o.tag || '';
  $('#aMode').value = an.mode || 'loop';
  $('#aPrev').onclick = function(){ if(!o.anim || o.anim.keys.length < 2){ toast('أضف مفتاحين على الأقل'); return; } var base = { pos:o.pos.slice(), rot:o.rot.slice(), scale:o.scale.slice() }, A = o.anim, ks = A.keys, dur = ks[ks.length-1].t, t0 = performance.now(); function step(){ var t = (performance.now() - t0) / 1000; if(t > dur){ o.pos = base.pos; o.rot = base.rot; o.scale = base.scale; syncMesh(o); updateSelVis(); return; } var i = 0; while(i < ks.length - 2 && t > ks[i+1].t) i++; var a = ks[i], b = ks[i+1], f = Math.min(1, Math.max(0, (t - a.t) / ((b.t - a.t) || 1))); f = f*f*(3-2*f); [ 'pos', 'rot', 'scale' ].forEach(function(k){ o[k] = [0,1,2].map(function(j){ return a[k][j] + (b[k][j] - a[k][j]) * f; }); }); syncMesh(o); updateSelVis(); requestAnimationFrame(step); } step(); };
  $('#aAdd').onclick = function(){ pushUndo(); if(!o.anim) o.anim = { keys: [], mode: 'loop' }; var t = parseFloat($('#aT').value) || 0; var ks = o.anim.keys.filter(function(k){ return k.t !== t; }); ks.push({ t: t, pos: o.pos.slice(), rot: o.rot.slice(), scale: o.scale.slice() }); ks.sort(function(a, b){ return a.t - b.t; }); o.anim.keys = ks; renderInspector(); toast('أُضيف مفتاح عند ' + t + ' ث (حرّك الكائن ثم أضف مفتاحاً آخر)'); };
  $('#aMode').onchange = function(){ pushUndo(); if(!o.anim) o.anim = { keys: [], mode: 'loop' }; o.anim.mode = this.value; };
  $('#aClr').onclick = function(){ pushUndo(); delete o.anim; renderInspector(); };
  $('#iName').oninput = function(){ o.name = this.value; renderHierarchy(); }; $('#iName').onchange = function(){ pushUndo(); };
  $('#iTag').onchange = function(){ pushUndo(); o.tag = this.value; };
  $$('input[data-k]', box).forEach(function(inp){ inp.onchange = function(){ pushUndo(); var v = parseFloat(this.value); if(isNaN(v)) v = 0; if(this.dataset.k === 'scale' && v <= 0) v = 0.1; o[this.dataset.k][+this.dataset.i] = v; syncMesh(o); if(o.tex !== 'none') rebuildMesh(o); updateSelVis(); }; });
  var bind = function(id, fn){ var el = $(id); if(!el) return; var ev = (el.type==='range'||el.type==='color') ? 'input' : 'change'; el.addEventListener(ev, function(){ if(ev==='input'){ if(!el._u){ pushUndo(); el._u = 1; } } else pushUndo(); fn(el); if(ev==='input') clearTimeout(el._t), el._t = setTimeout(function(){ el._u = 0; }, 600); }); };
  bind('#iColor', function(el){ o.color = el.value; rebuildMesh(o); updateSelVis(); });
  bind('#iEmis', function(el){ o.emissive = el.checked; rebuildMesh(o); updateSelVis(); });
  bind('#iTex', function(el){ o.tex = el.value; rebuildMesh(o); updateSelVis(); });
  bind('#iMetal', function(el){ o.metal = +el.value; rebuildMesh(o); updateSelVis(); });
  bind('#iRough', function(el){ o.rough = +el.value; rebuildMesh(o); updateSelVis(); });
  bind('#iOp', function(el){ o.opacity = +el.value; rebuildMesh(o); updateSelVis(); });
  bind('#iInt', function(el){ o.intensity = +el.value; rebuildMesh(o); updateSelVis(); });
  bind('#iBounce', function(el){ o.bounce = +el.value; el.nextSibling.textContent = el.value; });
  bind('#iBody', function(el){ o.body = el.value; });
  if($('#iText')){ $('#iText').value = o.text || ''; $('#iText').onchange = function(){ pushUndo(); o.text = this.value; rebuildMesh(o); updateSelVis(); }; }
  if($('#iImg')) $('#iImg').onchange = function(){ var f = this.files[0]; if(!f) return; var im = new Image(); im.onload = function(){ var c = document.createElement('canvas'), m = 256, k = Math.min(1, m/Math.max(im.width, im.height)); c.width = Math.max(1, Math.round(im.width*k)); c.height = Math.max(1, Math.round(im.height*k)); c.getContext('2d').drawImage(im,0,0,c.width,c.height); pushUndo(); o.texData = c.toDataURL('image/jpeg', 0.82); o.tex = 'custom'; rebuildMesh(o); updateSelVis(); renderInspector(); toast('تم تطبيق الصورة كخامة'); }; im.src = URL.createObjectURL(f); };
  bind('#iKind', function(el){ o.kind = el.value; rebuildMesh(o); updateSelVis(); });
  $('#iPreset').onchange = function(){ if(this.value === '') return; pushUndo(); o.script = SCRIPTS[this.value]; if(this.value === 'player'){ o.body = 'dynamic'; if(!o.tag) o.tag = 'player'; } if(['coin','enemy','goal','killzone','bouncer'].indexOf(this.value) >= 0) o.body = 'trigger'; if(this.value === 'platform') o.body = 'kinematic'; renderInspector(); renderHierarchy(); openScript(); };
  $('#iEditS').onclick = openScript;
}
function fillInspectorValues(){ var o = selId && getObj(selId); if(!o) return; $$('#inspector input[data-k]').forEach(function(inp){ inp.value = (+o[inp.dataset.k][+inp.dataset.i]).toFixed(2).replace(/\.?0+$/,'') || '0'; }); }
function renderAll(){ renderHierarchy(); renderInspector(); $('#sName').value = state.settings.title || 'لعبتي'; }

/* السكربت */
function openScript(){
  var o = selId && getObj(selId); if(!o) return; showPanel('script');
  $('#scriptTitle').textContent = 'سكربت: ' + o.name; var ta = $('#scriptTa'); ta.value = o.script || ''; ta.dataset.id = o.id;
  ta.onchange = function(){ var t = getObj(+ta.dataset.id); if(t){ pushUndo(); t.script = ta.value; renderHierarchy(); } };
}
function log(kind, text){ var c = $('#console'), d = document.createElement('div'); d.className = kind; d.textContent = (kind==='error'?'⚠ ':'› ') + text; c.appendChild(d); c.scrollTop = c.scrollHeight; if(kind === 'error'){ showPanel('console'); } }

function showPanel(name){ $$('.tabs button[data-p]').forEach(function(b){ b.classList.toggle('on', b.dataset.p === name); }); $$('.panel').forEach(function(p){ p.style.display = p.id === 'p-'+name ? 'flex' : 'none'; }); }
$$('.tabs button[data-p]').forEach(function(b){ b.onclick = function(){ showPanel(b.dataset.p); }; });
function showSide(name){ $$('.stabs button').forEach(function(b){ b.classList.toggle('on', b.dataset.s === name); }); $$('.sp').forEach(function(p){ p.style.display = p.id === 's-'+name ? 'block' : 'none'; }); }
$$('.stabs button').forEach(function(b){ b.onclick = function(){ showSide(b.dataset.s); }; });

/* الإضافة */
function addObject(type, over){
  pushUndo(); var o = newObj(type, over);
  if(!(over && over.pos) && !DEFAULTS[type].pos){ var t = orbit.target; o.pos = [Math.round(t.x), type === 'plane' ? -0.05 : (type==='coin'?1: 0.5), Math.round(t.z)]; if(type !== 'plane' && type !== 'light' && type !== 'coin') o.pos[1] = o.scale[1]/2; if(type==='light') o.pos[1] = 5; }
  state.objects.push(o); addMesh(o); select(o.id); return o;
}
function parseOBJ(txt){
  var vs = [], tri = [], lines = txt.split('\n'), i, j;
  for(i = 0; i < lines.length; i++){ var p = lines[i].trim().split(/\s+/);
    if(p[0] === 'v' && p.length >= 4) vs.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
    else if(p[0] === 'f' && p.length >= 4){ var ix = []; for(j = 1; j < p.length; j++){ var n = parseInt(p[j].split('/')[0], 10); ix.push(n < 0 ? vs.length + n : n - 1); } for(j = 1; j < ix.length - 1; j++) tri.push(ix[0], ix[j], ix[j+1]); } }
  if(!vs.length || !tri.length) return null;
  var mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9]; vs.forEach(function(v){ for(var k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], v[k]); mx[k] = Math.max(mx[k], v[k]); } });
  var sz = Math.max(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]) || 1, c = [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2], out = [];
  tri.forEach(function(t){ var v = vs[t]; if(!v) return; out.push(+((v[0]-c[0])/sz).toFixed(4), +((v[1]-c[1])/sz).toFixed(4), +((v[2]-c[2])/sz).toFixed(4)); });
  return out.length > 9 && out.length % 9 === 0 ? out : null;
}

function parseGLB(buf){
  var dv = new DataView(buf); if(dv.getUint32(0, true) !== 0x46546C67) return null;
  var off = 12, json = null, bin = null;
  while(off < buf.byteLength){ var len = dv.getUint32(off, true), typ = dv.getUint32(off + 4, true); if(typ === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len))); else if(typ === 0x004E4942 && !bin) bin = buf.slice(off + 8, off + 8 + len); off += 8 + len + 0; if(len % 4) off += 4 - len % 4; }
  if(!json || !bin) return null;
  function acc(i){ var a = json.accessors[i], bv = json.bufferViews[a.bufferView], comps = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4 }[a.type], base = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || 0, out = [], j, k, ctype = a.componentType, size = ({5126:4,5125:4,5123:2,5121:1,5122:2,5120:1})[ctype], d = new DataView(bin);
    for(j = 0; j < a.count; j++){ for(k = 0; k < comps; k++){ var p = base + j * (stride || comps * size) + k * size, v; if(ctype === 5126) v = d.getFloat32(p, true); else if(ctype === 5125) v = d.getUint32(p, true); else if(ctype === 5123) v = d.getUint16(p, true); else if(ctype === 5121) v = d.getUint8(p); else v = 0; out.push(v); } } return out; }
  var tris = [], color = null, mats = json.materials || [];
  var nodes = json.nodes || [], meshNodes = [];
  function walk(ni, m){ var n = nodes[ni], M = m.slice(); if(n.translation){ M[12] += n.translation[0]; M[13] += n.translation[1]; M[14] += n.translation[2]; } if(n.scale){ M[0] *= n.scale[0]; M[5] *= n.scale[1]; M[10] *= n.scale[2]; M[12] *= 1; } if(n.mesh != null) meshNodes.push([n.mesh, M]); (n.children || []).forEach(function(c){ walk(c, M); }); }
  var ident = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  if(json.scenes && json.scenes.length){ ((json.scenes[json.scene || 0].nodes) || []).forEach(function(n){ walk(n, ident); }); } else (json.meshes || []).forEach(function(m, i){ meshNodes.push([i, ident]); });
  meshNodes.forEach(function(mn){ json.meshes[mn[0]].primitives.forEach(function(pr){ if(pr.mode != null && pr.mode !== 4) return; var pos = acc(pr.attributes.POSITION), idx = pr.indices != null ? acc(pr.indices) : null, M = mn[1], n = idx ? idx.length : pos.length / 3, t;
    if(color == null && pr.material != null && mats[pr.material] && mats[pr.material].pbrMetallicRoughness && mats[pr.material].pbrMetallicRoughness.baseColorFactor){ var c = mats[pr.material].pbrMetallicRoughness.baseColorFactor; color = '#' + [0,1,2].map(function(q){ return ('0' + Math.round(Math.pow(c[q], 1/2.2) * 255).toString(16)).slice(-2); }).join(''); }
    for(t = 0; t < n; t++){ var vi = idx ? idx[t] : t; tris.push(pos[vi*3] * M[0] + M[12], pos[vi*3+1] * M[5] + M[13], pos[vi*3+2] * M[10] + M[14]); } }); });
  if(tris.length < 9) return null;
  var mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9], i, k; for(i = 0; i < tris.length; i += 3) for(k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], tris[i+k]); mx[k] = Math.max(mx[k], tris[i+k]); }
  var sz = Math.max(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]) || 1, c2 = [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2], out = [];
  for(i = 0; i < tris.length; i += 3) out.push(+((tris[i]-c2[0])/sz).toFixed(4), +((tris[i+1]-c2[1])/sz).toFixed(4), +((tris[i+2]-c2[2])/sz).toFixed(4));
  return { model: out, color: color };
}
$('#bObj').onclick = function(){ $('#fObj').click(); };
$('#fObj').onchange = function(){ var f = this.files[0]; this.value = ''; if(!f) return; var isGlb = /\.(glb)$/i.test(f.name), fr = new FileReader();
  function add(m, col){ if(!m){ toast('ملف الموديل غير صالح'); return; } if(m.length > 450000){ toast('الموديل كبير (أكثر من 50 ألف مثلث). بسّطه أولاً'); return; } pushUndo(); var t = orbit.target, o = newObj('cube', { name: f.name.replace(/\.(obj|glb)$/i,''), type:'model', pos:[Math.round(t.x), 6, Math.round(t.z)], scale:[3,3,3], color: col || '#c9d6ff' }); o.type = 'model'; o.model = m; o.body = 'static'; state.objects.push(o); addMesh(o); select(o.id); toast('تم استيراد الموديل (' + (m.length/9) + ' مثلث)'); }
  fr.onload = function(){ if(isGlb){ var r = null; try{ r = parseGLB(fr.result); }catch(x){} add(r && r.model, r && r.color); } else add(parseOBJ(fr.result)); };
  if(isGlb) fr.readAsArrayBuffer(f); else fr.readAsText(f); };
$$('#addGrid button').forEach(function(b){ b.onclick = function(){ addObject(b.dataset.t); }; });
(function(){ var g = $('#prefabGrid'); Object.keys(PREFABS).forEach(function(k){ var b = document.createElement('button'); b.className = 'btn'; b.textContent = PREFABS[k][0]; b.onclick = function(){ addPrefab(k); }; g.appendChild(b); }); })();
function customPrefabs(){ try{ return JSON.parse(localStorage.getItem('engine.prefabs') || '{}'); }catch(x){ return {}; } }
function renderCustomPrefabs(){ var g = $('#customPrefabs'); g.innerHTML = ''; var cp = customPrefabs(); Object.keys(cp).forEach(function(n){ var b = document.createElement('button'); b.className = 'btn'; b.textContent = '⭐ ' + n; b.title = 'اضغط للإضافة، ضغطة طويلة للحذف'; var t; b.onclick = function(){ pushUndo(); var o = JSON.parse(JSON.stringify(cp[n])); o.id = uid++; var tg = orbit.target; o.pos = [Math.round(tg.x), o.pos[1], Math.round(tg.z)]; state.objects.push(o); addMesh(o); select(o.id); }; b.oncontextmenu = function(ev){ ev.preventDefault(); if(confirm('حذف الأصل "' + n + '"؟')){ delete cp[n]; localStorage.setItem('engine.prefabs', JSON.stringify(cp)); renderCustomPrefabs(); } }; g.appendChild(b); }); }
$('#bSavePrefab').onclick = function(){ var o = selId && getObj(selId); if(!o){ toast('اختر كائناً أولاً'); return; } var n = prompt('اسم الأصل:', o.name); if(!n) return; var cp = customPrefabs(); cp[n] = JSON.parse(JSON.stringify(o)); localStorage.setItem('engine.prefabs', JSON.stringify(cp)); renderCustomPrefabs(); toast('تم حفظ الأصل ⭐ في المكتبة'); };
$('#bCrate').onclick = function(){ addObject('cube', {name:'صندوق', color:'#c68642', body:'dynamic', tex:'bricks'}); };
$('#bDup').onclick = function(){ var ids = multi.length ? multi.slice() : (selId ? [selId] : []); if(!ids.length) return; pushUndo(); var last = null, newIds = []; ids.forEach(function(i){ var o = getObj(i); if(!o) return; var c = JSON.parse(JSON.stringify(o)); c.id = uid++; c.name = o.name + ' نسخة'; c.pos[0] += 1.5; c.pos[2] += 1.5; state.objects.push(c); addMesh(c); newIds.push(c.id); last = c; }); if(last){ select(newIds[0]); newIds.slice(1).forEach(function(i){ select(i, true); }); } };
$('#bMulti').onclick = function(){ multiMode = !multiMode; this.classList.toggle('on', multiMode); };
$('#bAlign').onclick = function(){ var ids = multi.slice(); if(ids.length < 2){ toast('حدد كائنين أو أكثر (Shift أو زر متعدد)'); return; } pushUndo(); var base = getObj(selId); ids.forEach(function(i){ var o = getObj(i); if(o && o !== base){ o.pos[1] = base.pos[1]; syncMesh(o); } }); updateSelVis(); toast('تم محاذاة الارتفاع'); };
$('#bGround').onclick = function(){ var ids = multi.length ? multi : (selId ? [selId] : []); if(!ids.length) return; pushUndo(); ids.forEach(function(i){ var o = getObj(i); if(o){ o.pos[1] = (BASE[o.type] ? BASE[o.type][1] : 1) * o.scale[1] / 2; syncMesh(o); } }); updateSelVis(); fillInspectorValues(); toast('تم وضع الكائنات على الأرض'); };
$('#bDel').onclick = delSel;
function delSel(){ var ids = multi.length ? multi.slice() : (selId ? [selId] : []); if(!ids.length) return; pushUndo(); state.objects = state.objects.filter(function(x){ return ids.indexOf(x.id) < 0; }); ids.forEach(removeMesh); select(null); }
$('#bUndo').onclick = undo; $('#bRedo').onclick = redo;
$$('#tools button').forEach(function(b){ b.onclick = function(){ tool = b.dataset.tool; $$('#tools button').forEach(function(x){ x.classList.toggle('on', x === b); }); }; });
$('#snapSel').onchange = function(){ snap = parseFloat(this.value); };
$('#bFocus').onclick = function(){ var o = selId && getObj(selId); if(o) orbit.target.set(o.pos[0],o.pos[1],o.pos[2]); };
document.addEventListener('keydown', function(e){
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if(mode !== 'edit') return;
  if(e.key === 'Delete' || e.key === 'Backspace') delSel();
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'd'){ e.preventDefault(); $('#bDup').click(); }
  else if(e.key === 'w') $('[data-tool=move]').click(); else if(e.key === 'e') $('[data-tool=rotate]').click(); else if(e.key === 'r') $('[data-tool=scale]').click(); else if(e.key === 'f') $('#bFocus').click();
});

/* ===== اللعب ===== */
function play(){
  if(mode === 'play') return; mode = 'play'; $('#playHost').style.display = 'block'; $('#vtools').style.display = 'none'; $('#levelBar').style.display = 'none'; $('#bPlay').style.display = 'none'; $('#bStop').style.display = ''; $('#console').innerHTML = ''; gizmo.visible = false;
  startRun();
}
function startRun(){
  if(run) run.stop(); var ph = $('#playHost'); ph.innerHTML = '';
  try{ run = GameRuntime(THREE, ph, gameData(), { onLog: log, touch: matchMedia('(pointer:coarse)').matches, onRestart: startRun, onFps: function(f){ $('#fps').textContent = f + ' إطار/ث'; } }); }catch(err){ log('error', 'فشل التشغيل: ' + err.message); }
}
function stop(){ if(mode !== 'play') return; mode = 'edit'; if(run){ run.stop(); run = null; } $('#playHost').style.display = 'none'; $('#vtools').style.display = ''; $('#levelBar').style.display = 'flex'; $('#playHost').innerHTML = ''; $('#bPlay').style.display = ''; $('#bStop').style.display = 'none'; $('#fps').textContent = ''; updateSelVis(); resizeEd(); }
$('#bPlay').onclick = play; $('#bStop').onclick = stop;

/* ===== تصدير ===== */
function fetchText(u){ return fetch(u, {cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error(u); return r.text(); }); }
function buildExport(){
  return Promise.all([fetchText(window.THREE_SRC || 'three.min.js'), fetchText('runtime.js')]).then(function(r){
    var title = (state.settings.title || 'لعبتي').replace(/[<&]/g, '');
    var data = JSON.stringify(gameData()).replace(/</g, '\\u003c');
    var esc = function(t){ return t.replace(/<\/script/gi, '<\\/script'); };
    return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>' + title + '</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#g{position:fixed;inset:0}</style></head><body><div id="g"></div>\n<script>' + esc(r[0]) + '</script>\n<script>' + esc(r[1]) + '</script>\n<script>var DATA=' + data + ';GameRuntime(THREE, document.getElementById("g"), DATA, {});</script></body></html>';
  });
}
function download(name, text, type){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:type||'text/html'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
$('#bExport').onclick = function(){ var b = this; b.disabled = true; buildExport().then(function(html){ download((state.settings.title||'game').replace(/\s+/g,'-') + '.html', html); toast('تم تصدير اللعبة كملف HTML واحد يشتغل بدون إنترنت ✓ (' + Math.round(html.length/1024) + ' كيلوبايت)'); }).catch(function(e){ toast('فشل التصدير: ' + e.message); }).then(function(){ b.disabled = false; }); };
$('#bJson').onclick = function(){ download((state.settings.title||'project') + '.json', JSON.stringify(state,null,1), 'application/json'); };
$('#fileIn').onchange = function(){ var f = this.files[0]; if(!f) return; var r = new FileReader(); r.onload = function(){ try{ var d = JSON.parse(r.result); if(!d.objects) throw 0; pushUndo(); state = d; relink(); allUid(); selId = null; rebuildAll(); renderAll(); renderLevels(); toast('تم فتح المشروع'); }catch(e){ toast('ملف غير صالح'); } }; r.readAsText(f); this.value = ''; };

/* مشاريع محفوظة */
function listProjects(){ try{ return JSON.parse(localStorage.getItem('engine.projects') || '{}'); }catch(e){ return {}; } }
$('#bSave').onclick = function(){ var n = prompt('اسم المشروع:', state.settings.title || 'لعبتي'); if(!n) return; var p = listProjects(); p[n] = snapshot(); localStorage.setItem('engine.projects', JSON.stringify(p)); toast('تم حفظ "' + n + '"'); };
$('#bOpen').onclick = function(){ var p = listProjects(), names = Object.keys(p); var d = $('#dlgOpen'); var ul = $('#projList'); ul.innerHTML = names.length ? '' : '<li class="hint">لا توجد مشاريع محفوظة</li>'; names.forEach(function(n){ var li = document.createElement('li'); var s = document.createElement('span'); s.textContent = n; s.onclick = function(){ pushUndo(); restore(p[n]); d.close(); toast('تم فتح "' + n + '"'); }; var x = document.createElement('button'); x.textContent = '🗑'; x.className = 'btn sm'; x.onclick = function(){ delete p[n]; localStorage.setItem('engine.projects', JSON.stringify(p)); li.remove(); }; li.appendChild(s); li.appendChild(x); ul.appendChild(li); }); d.showModal(); };
$('#bTemplates').onclick = function(){ var ul = $('#tmplList'); ul.innerHTML = ''; Object.keys(TEMPLATES).forEach(function(k){ var li = document.createElement('li'); li.textContent = TEMPLATES[k][0]; li.onclick = function(){ if(!confirm('سيتم استبدال المشهد الحالي (يمكنك التراجع). متابعة؟')) return; pushUndo(); state = TEMPLATES[k][1](); selId = null; allUid(); rebuildAll(); renderAll(); renderLevels(); $('#dlgTmpl').close(); orbit.target.set(0,1,0); orbit.dist = 22; }; ul.appendChild(li); }); $('#dlgTmpl').showModal(); };
$$('dialog .close').forEach(function(b){ b.onclick = function(){ b.closest('dialog').close(); }; });

/* إعدادات */
$('#bSet').onclick = function(){ var S = Object.assign({}, DEFAULT_SETTINGS, state.settings); $('#sName').value = S.title; $('#sSky').value = S.sky; $('#sGrav').value = S.gravity; $('#sFog').checked = S.fog; $('#sCam').value = S.camera; $('#sDist').value = S.camDist; $('#sHeight').value = S.camHeight; $('#sSun').value = S.sun; $('#sMusic').checked = !!S.music; $('#sSkyKind').value = S.skyKind || 'solid'; $('#sGrade').value = S.grade || 'none'; $('#sVig').checked = !!S.vig; $('#sCycle').checked = !!S.cycle; $('#dlgSet').showModal(); };
$('#sApply').onclick = function(){ pushUndo(); state.settings = { title:$('#sName').value || 'لعبتي', sky:$('#sSky').value, gravity:+$('#sGrav').value, fog:$('#sFog').checked, camera:$('#sCam').value, camDist:+$('#sDist').value, camHeight:+$('#sHeight').value, sun:+$('#sSun').value, music:$('#sMusic').checked, skyKind:$('#sSkyKind').value, grade:$('#sGrade').value, vig:$('#sVig').checked, cycle:$('#sCycle').checked }; applySettings(); $('#dlgSet').close(); };
$('#bHelp').onclick = function(){ $('#dlgHelp').showModal(); };
function toast(t){ var d = $('#toast'); d.textContent = t; d.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function(){ d.classList.remove('on'); }, 3200); }

/* بدء */
function allUid(){ var m = 0; (state.levels || [{objects:state.objects}]).forEach(function(l){ l.objects.forEach(function(o){ m = Math.max(m, o.id); }); }); uid = m + 1; }
function renderLevels(){
  var bar = $('#levelBar'); bar.innerHTML = '';
  var ls = state.levels || [{name:'مستوى 1'}], act = state.active || 0;
  ls.forEach(function(l,i){ var b = document.createElement('button'); b.className = 'btn sm' + (i === act ? ' on' : ''); b.textContent = l.name || ('مستوى ' + (i+1)); b.onclick = function(){ switchLevel(i); }; bar.appendChild(b); });
  var add = document.createElement('button'); add.className = 'btn sm'; add.textContent = '＋ مستوى'; add.onclick = addLevel; bar.appendChild(add);
  if(ls.length > 1){ var del = document.createElement('button'); del.className = 'btn sm'; del.textContent = '🗑'; del.title = 'حذف المستوى الحالي'; del.onclick = delLevel; bar.appendChild(del); }
}
function ensureLevels(){ if(!state.levels){ state.levels = [{ name:'مستوى 1', objects: state.objects }]; state.active = 0; } }
function switchLevel(i){ ensureLevels(); syncLevels(); state.active = i; state.objects = state.levels[i].objects; selId = null; rebuildAll(); renderAll(); renderLevels(); markDirty(); }
function addLevel(){ pushUndo(); ensureLevels(); syncLevels(); var t = tmplEmpty(); t.objects.push(newObj('goal',{pos:[0,1.2,-10]})); t.objects.push(newObj('coin',{pos:[0,1,-5]})); state.levels.push({ name:'مستوى ' + (state.levels.length+1), objects: t.objects }); switchLevel(state.levels.length-1); toast('أُضيف مستوى جديد. الفوز بالهدف ينقل اللاعب للمستوى التالي'); }
function delLevel(){ if(!state.levels || state.levels.length < 2 || !confirm('حذف هذا المستوى؟')) return; pushUndo(); state.levels.splice(state.active,1); var i = Math.max(0, state.active-1); state.active = i; state.objects = state.levels[i].objects; selId = null; rebuildAll(); renderAll(); renderLevels(); }
function boot(){
  var saved = null; try{ saved = localStorage.getItem('engine.autosave'); }catch(e){}
  if(saved){ try{ state = JSON.parse(saved); if(!state.objects || !state.objects.length) throw 0; }catch(e){ state = null; } }
  if(!state) state = tmplPlatformer();
  relink(); allUid(); rebuildAll(); renderAll(); renderLevels(); renderCustomPrefabs(); showPanel('script'); showSide('objs'); resizeEd(); loop(); orbit.dist = 24; updateUndoBtns();
  window.__engine = { buildExport: buildExport, cam: cam, get state(){ return state; }, select: select, addObject: addObject, play: play, stop: stop, get run(){ return run; }, orbit: orbit };
}
boot();
})();
