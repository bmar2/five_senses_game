// Five Senses — WebGL mini-games using three.js
let scene, camera, renderer, raycaster, mouse, clock;
let orbs = [];
let score = 0;
const orbData = [
  {id:'sight', label:'Sight', color:0xff6b6b},
  {id:'hearing', label:'Hearing', color:0x6b9bff},
  {id:'touch', label:'Touch', color:0x6bffb4},
  {id:'smell', label:'Smell', color:0xffd36b},
  {id:'taste', label:'Taste', color:0xd36bff},
];

init();
animate();

function init(){
  const canvas = document.getElementById('c');
  renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0,0,6);

  // lighting
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.8);
  scene.add(hemi);

  // orbs
  const geo = new THREE.SphereGeometry(0.5, 32, 32);
  orbData.forEach((d,i)=>{
    const mat = new THREE.MeshStandardMaterial({color:d.color, emissive:d.color, emissiveIntensity:0.05, metalness:0.2, roughness:0.3});
    const mesh = new THREE.Mesh(geo, mat);
    const angle = i * Math.PI*2 / orbData.length;
    mesh.position.set(Math.cos(angle)*3.0, Math.sin(angle)*1.6, (Math.random()-0.5)*1.5);
    mesh.userData = d;
    scene.add(mesh);
    orbs.push(mesh);

    // label (simple sprite)
    const canvasLabel = document.createElement('canvas');
    canvasLabel.width = 256; canvasLabel.height = 64;
    const ctx = canvasLabel.getContext('2d');
    ctx.font = '30px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign='center';
    ctx.fillText(d.label, 128, 42);
    const tex = new THREE.CanvasTexture(canvasLabel);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, opacity:0.9}));
    sprite.scale.set(1.6,0.4,1);
    sprite.position.set(mesh.position.x, mesh.position.y-0.9, mesh.position.z);
    scene.add(sprite);
  });

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  clock = new THREE.Clock();

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('pointerdown', onPointerDown);

  document.getElementById('reset').addEventListener('click', ()=>{score=0;updateScore();});
  document.getElementById('close').addEventListener('click', closeModal);
}

function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(){
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  orbs.forEach((o,i)=>{
    o.rotation.y += 0.01 + i*0.002;
    o.position.y += Math.sin(t + i)*0.002;
    o.material.emissiveIntensity = 0.05 + 0.15*Math.abs(Math.sin(t*1.2 + i));
  });
  renderer.render(scene, camera);
}

function onPointerDown(e){
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(orbs);
  if(hits.length>0){
    const picked = hits[0].object.userData;
    openChallenge(picked.id);
  }
}

function openChallenge(id){
  const modal = document.getElementById('modal');
  const challenge = document.getElementById('challenge');
  modal.classList.remove('hidden');
  challenge.innerHTML = '';
  if(id==='sight') sightChallenge(challenge);
  if(id==='hearing') hearingChallenge(challenge);
  if(id==='touch') touchChallenge(challenge);
  if(id==='smell') smellChallenge(challenge);
  if(id==='taste') tasteChallenge(challenge);
}

// --- Score helper
function updateScore(delta=0){
  score += delta;
  if(score<0) score=0;
  document.getElementById('score-val').innerText = score;
}

// --- Modal
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }

// --- Sight: Memory of colors sequence
function sightChallenge(container){
  container.innerHTML = '<h2>Sight — Color Sequence</h2><p>Watch the sequence of colors and reproduce it by clicking squares.</p>';
  const colors = ['#ff6b6b','#6b9bff','#6bffb4','#ffd36b','#d36bff'];
  const seq = [];
  for(let i=0;i<4;i++) seq.push(colors[Math.floor(Math.random()*colors.length)]);
  const display = document.createElement('div'); display.className='center';
  const boxes = colors.map(c=>{const b=document.createElement('div');b.className='colorbox';b.style.background=c;return b});
  boxes.forEach(b=>display.appendChild(b));
  container.appendChild(display);

  // show sequence animation
  let idx=0;
  const status = document.createElement('div'); status.style.marginTop='12px';
  container.appendChild(status);
  function flashNext(){
    if(idx>=seq.length){ status.innerText='Now reproduce the sequence by clicking boxes.'; enableInput(); return;}
    status.innerText = `Watching... ${idx+1}/${seq.length}`;
    boxes.forEach(b=>b.style.filter='brightness(0.85)');
    const target = boxes.find(b=>b.style.background===seq[idx]);
    target.style.filter='brightness(1.8)';
    idx++;
    setTimeout(()=>{boxes.forEach(b=>b.style.filter=''); setTimeout(flashNext,300);},600);
  }
  flashNext();

  // input
  let attempt = [];
  function enableInput(){
    boxes.forEach(b=>{
      b.style.cursor='pointer';
      b.addEventListener('click', ()=>{
        attempt.push(b.style.background);
        b.style.transform='scale(0.92)';
        setTimeout(()=>b.style.transform='',120);
        if(attempt.length===seq.length){
          const ok = attempt.join('|')===seq.join('|');
          status.innerText = ok ? 'Correct! +2 points' : 'Incorrect. Try again later.';
          if(ok) updateScore(2);
          setTimeout(closeModal,1200);
        }
      });
    });
  }
}

// --- Hearing: Play tone sequence and reproduce with keys (A S D F G)
function hearingChallenge(container){
  container.innerHTML = '<h2>Hearing — Tone Memory</h2><p>Listen to the sequence of tones. Reproduce it using keys A S D F G (or the on-screen buttons).</p>';
  const freqs = [440,523.25,587.33,659.25,783.99]; // A4 and others
  const seq = [];
  for(let i=0;i<4;i++) seq.push(Math.floor(Math.random()*freqs.length));
  const synth = new ToneSynth();
  const btnRow = document.createElement('div'); btnRow.className='center';
  const buttons = freqs.map((f,i)=>{const b=document.createElement('button');b.className='button small';b.innerText=String.fromCharCode(65+i);b.addEventListener('click',()=>{synth.playFreq(f,0.3); record(i)});return b});
  buttons.forEach(b=>btnRow.appendChild(b));
  container.appendChild(btnRow);
  const playBtn = document.createElement('button'); playBtn.className='button'; playBtn.innerText='Play Sequence'; playBtn.onclick = ()=>{playSeq();};
  container.appendChild(playBtn);
  const status = document.createElement('div'); status.style.marginTop='12px'; container.appendChild(status);

  let attempt = [];
  function playSeq(){
    status.innerText='Playing...';
    let i=0;
    const playNext = ()=>{
      if(i>=seq.length){ status.innerText='Now reproduce using keys or buttons.'; return; }
      synth.playFreq(freqs[seq[i]],0.45);
      i++; setTimeout(playNext,600);
    };
    playNext();
  }

  function record(i){
    attempt.push(i);
    if(attempt.length===seq.length){
      const ok = attempt.join('|')===seq.join('|');
      status.innerText = ok ? 'Correct! +2 points' : 'Incorrect. Sequence was: ' + seq.map(n=>String.fromCharCode(65+n)).join(' ');
      if(ok) updateScore(2);
      setTimeout(closeModal,1200);
    }
  }

  // keyboard support
  window.addEventListener('keydown', function kb(e){
    const code = e.key.toUpperCase();
    if(code>='A' && code<='G'){
      const idx = code.charCodeAt(0)-65;
      if(idx<freqs.length) { buttons[idx].click(); }
    }
    // remove after modal closed
    if(document.getElementById('modal').classList.contains('hidden')) window.removeEventListener('keydown', kb);
  });
  // auto-play once
  setTimeout(playSeq,300);
}

// --- Touch: Drag the shape into the matching shadow; vibrations if available
function touchChallenge(container){
  container.innerHTML = '<h2>Touch — Drag & Fit</h2><p>Drag the shape to fit the silhouette. On mobile this will also vibrate when you drop correctly (if allowed).</p>';
  const area = document.createElement('div'); area.style.height='220px'; area.className='center'; container.appendChild(area);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS,'svg'); svg.setAttribute('width','640'); svg.setAttribute('height','220');
  svg.style.maxWidth='100%'; svg.style.borderRadius='8px'; svg.style.background='rgba(255,255,255,0.02)';
  area.appendChild(svg);

  // simple two shapes: star and triangle
  const shapes = ['star','triangle'];
  const pick = shapes[Math.floor(Math.random()*shapes.length)];
  // silhouette on right
  const sil = document.createElementNS(svgNS,'path');
  sil.setAttribute('fill','rgba(255,255,255,0.04)');
  sil.setAttribute('stroke','rgba(255,255,255,0.06)');
  sil.setAttribute('transform','translate(460,20) scale(0.8)');
  if(pick==='star') sil.setAttribute('d','M100 10 L120 80 L190 80 L130 120 L150 190 L100 145 L50 190 L70 120 L10 80 L80 80 Z');
  else sil.setAttribute('d','M100 20 L180 180 L20 180 Z');
  svg.appendChild(sil);

  // draggable piece on left
  const piece = document.createElementNS(svgNS,'path');
  piece.setAttribute('fill','#6bffb4'); piece.setAttribute('stroke','#e6eef8'); piece.setAttribute('stroke-width','2');
  piece.setAttribute('transform','translate(80,20) scale(0.8)');
  if(pick==='star') piece.setAttribute('d','M100 10 L120 80 L190 80 L130 120 L150 190 L100 145 L50 190 L70 120 L10 80 L80 80 Z');
  else piece.setAttribute('d','M100 20 L180 180 L20 180 Z');
  svg.appendChild(piece);

  piece.style.cursor='grab';
  let dragging=false, offsetX=0, offsetY=0;

  piece.addEventListener('pointerdown', (e)=>{ dragging=true; piece.setPointerCapture(e.pointerId); piece.style.cursor='grabbing'; const t = piece.getCTM(); offsetX = e.clientX - (t.e); offsetY = e.clientY - (t.f); });
  window.addEventListener('pointermove', (e)=>{ if(!dragging) return; const x = e.clientX - offsetX; const y = e.clientY - offsetY; piece.setAttribute('transform',`translate(${x-40},${y-20}) scale(0.8)`); });
  piece.addEventListener('pointerup', (e)=>{ dragging=false; piece.style.cursor='grab'; // check overlap by bounding boxes
    const b1 = piece.getBoundingClientRect(); const b2 = sil.getBoundingClientRect();
    const overlap = !(b1.right < b2.left || b1.left > b2.right || b1.bottom < b2.top || b1.top > b2.bottom);
    const status = document.createElement('div'); status.style.marginTop='12px';
    container.appendChild(status);
    if(overlap){ status.innerText='Good fit! +2 points'; try{ navigator.vibrate && navigator.vibrate([50,30,50]); }catch(e){} updateScore(2);} else { status.innerText='Not quite—try again later.'; }
    setTimeout(closeModal,1200);
  });
}

// --- Smell: real-world prompt (optional). Keep it safe.
function smellChallenge(container){
  container.innerHTML = '<h2>Smell — Optional Real-World Test</h2><p>This round asks you to find a safe, everyday scented item near you (e.g., citrus peel, coffee, soap). If you prefer not to, skip it.</p>';
  const info = document.createElement('p'); info.style.marginTop='8px';
  info.innerHTML = 'When ready: <strong>close your eyes</strong>, inhale gently and choose the correct descriptor.';
  container.appendChild(info);
  const options = ['Citrus/bright','Earthy','Sweet','Soapy/clean','Unsure'];
  const row = document.createElement('div'); row.className='grid';
  options.forEach(opt=>{ const b=document.createElement('button'); b.className='button small'; b.innerText=opt; b.addEventListener('click', ()=>{ if(opt==='Unsure'){ closeModal(); } else { document.getElementById('challenge').appendChild(document.createElement('div')).innerText='Marked — thanks! +1 point'; updateScore(1); setTimeout(closeModal,900); } }); row.appendChild(b); });
  container.appendChild(row);
  const skip = document.createElement('button'); skip.className='button'; skip.innerText='Skip'; skip.onclick = closeModal; container.appendChild(skip);
}

// --- Taste: safe sip test (optional) — encourage water or tea; never ask to ingest unknowns
function tasteChallenge(container){
  container.innerHTML = '<h2>Taste — Optional Safe Test</h2><p>Only attempt if you have a safe, familiar beverage or snack (water, tea, bread). Take a small sip/bite if comfortable, then choose the descriptor.</p>';
  const options = ['Salty','Sweet','Bitter','Sour','Neutral/Water','Skip'];
  const row = document.createElement('div'); row.className='grid';
  options.forEach(opt=>{ const b=document.createElement('button'); b.className='button small'; b.innerText=opt; b.addEventListener('click', ()=>{ if(opt==='Skip'){ closeModal(); } else { document.getElementById('challenge').appendChild(document.createElement('div')).innerText='Marked — thanks! +1 point'; updateScore(1); setTimeout(closeModal,900); } }); row.appendChild(b); });
  container.appendChild(row);
}

// --- Simple WebAudio synth for tones
function ToneSynth(){
  this.ctx = null;
  try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  this.playFreq = function(f, dur){
    if(!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type='sine'; o.frequency.value = f;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(this.ctx.destination);
    o.start();
    // ramp up quickly
    g.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.stop(this.ctx.currentTime + dur + 0.02);
  };
}

// small helper to ensure mobile audio can start after user action
document.addEventListener('click', function unlockAudio(){ try{ const ctx = new (window.AudioContext||window.webkitAudioContext)(); if(ctx.state==='suspended') ctx.resume(); }catch(e){} document.removeEventListener('click', unlockAudio); });

