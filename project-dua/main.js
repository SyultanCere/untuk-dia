// ════════════════════════════════════════
//  KONFIGURASI SUPABASE
// ════════════════════════════════════════
const SUPABASE_URL = 'https://mhionvzwkurabadaaobf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_w3GTzc2IRmzDZ355em-ogQ_QKVY4uPT';
const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};
const STORAGE_URL    = `${SUPABASE_URL}/storage/v1/object/galeri-media`;
const STORAGE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public/galeri-media`;

// ════════════════════════════════════════
//  SUPABASE — PESAN
// ════════════════════════════════════════
async function dbInsert(data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/pesan`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  return r.json();
}
async function dbFetch() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/pesan?order=waktu.desc&select=*`, { headers: HEADERS });
  return r.json();
}

// ════════════════════════════════════════
//  SUPABASE — GALERI
// ════════════════════════════════════════
async function galeriInsert(row) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/galeri`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(row)
  });
  return r.json();
}
async function galeiFetch() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/galeri?order=waktu.asc&select=id,foto_base64,diunggah_oleh,waktu,tipe,media_url`, { headers: HEADERS });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    console.error('galeiFetch error:', r.status, err);
    // Fallback: coba tanpa kolom baru
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/galeri?order=waktu.asc&select=id,foto_base64,diunggah_oleh,waktu`, { headers: HEADERS });
    const data2 = await r2.json();
    return Array.isArray(data2) ? data2.map(d => ({ ...d, tipe: 'foto', media_url: null })) : [];
  }
  return r.json();
}
async function galeriDelete(id, mediaUrl) {
  await fetch(`${SUPABASE_URL}/rest/v1/galeri?id=eq.${id}`, { method: 'DELETE', headers: HEADERS });
  if (mediaUrl) {
    const path = mediaUrl.split('/galeri-media/')[1];
    if (path) await fetch(`${SUPABASE_URL}/storage/v1/object/galeri-media/${path}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  }
}

// ════════════════════════════════════════
//  SUPABASE STORAGE — upload
// ════════════════════════════════════════
async function uploadToStorage(file, folder) {
  const ext  = file.name.split('.').pop();
  const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const r = await fetch(`${STORAGE_URL}/${name}`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type, 'x-upsert': 'true' },
    body: file
  });
  if (!r.ok) throw new Error('Upload gagal');
  return `${STORAGE_PUBLIC}/${name}`;
}

// ════════════════════════════════════════
//  PETALS
// ════════════════════════════════════════
function initPetals() {
  const pc = document.getElementById('petals');
  const colors = ['#f2d6db','#f9e4e8','#fce8ec','#efc6ce','#f5d0d7'];
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const s = 5 + Math.random() * 8;
    p.style.cssText = `left:${Math.random()*100}%;width:${s}px;height:${s*1.4}px;background:${colors[i%colors.length]};animation-duration:${10+Math.random()*12}s;animation-delay:${Math.random()*16}s;transform:rotate(${Math.random()*360}deg)`;
    pc.appendChild(p);
  }
}

// ════════════════════════════════════════
//  SPLASH SCREEN + MUSIK AUTOPLAY
// ════════════════════════════════════════
const bgAudio = new Audio('lagu.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.7;
let musicPlaying = false;

function setMusicUI(playing) {
  const btn = document.getElementById('musicBtn');
  btn.textContent = playing ? '♫' : '♪';
  playing ? btn.classList.add('playing') : btn.classList.remove('playing');
}

function initSplash() {
  // Buat kelopak di splash
  const sp = document.getElementById('splashPetals');
  const colors = ['#f2d6db','#f9e4e8','#fce8ec','#efc6ce','#f5d0d7'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'splash-petal';
    const s = 6 + Math.random() * 8;
    p.style.cssText = `left:${Math.random()*100}%;width:${s}px;height:${s*1.4}px;background:${colors[i%colors.length]};animation-duration:${8+Math.random()*10}s;animation-delay:${Math.random()*8}s;transform:rotate(${Math.random()*360}deg)`;
    sp.appendChild(p);
  }

  document.getElementById('splashBtn').addEventListener('click', async () => {
    // Play lagu — ini adalah interaksi user, dijamin berhasil
    try {
      await bgAudio.play();
      musicPlaying = true;
      setMusicUI(true);
    } catch (e) {
      // Tetap lanjut meski lagu gagal (file tidak ada)
    }

    // Animasi tutup splash
    const splash = document.getElementById('splash');
    splash.classList.add('hiding');
    setTimeout(() => {
      splash.style.display = 'none';
      document.body.style.overflow = '';
    }, 800);
  });

  // Kunci scroll selama splash terbuka
  document.body.style.overflow = 'hidden';
}

function initMusic() {
  document.getElementById('musicBtn').addEventListener('click', async () => {
    if (!musicPlaying) {
      try {
        await bgAudio.play();
        musicPlaying = true;
        setMusicUI(true);
        showToast('Penjaga Hati — Nadhif Basalamah ♪');
      } catch (e) {
        showToast('File lagu.mp3 tidak ditemukan');
      }
    } else {
      bgAudio.pause();
      bgAudio.currentTime = 0;
      musicPlaying = false;
      setMusicUI(false);
      showToast('Musik dihentikan');
    }
  });
}

// ════════════════════════════════════════
//  SURAT
// ════════════════════════════════════════
function openLetter() {
  document.getElementById('envPrompt').style.display = 'none';
  document.getElementById('envelope').classList.add('opened');
  showToast('Surat terbuka ♡');
}

// ════════════════════════════════════════
//  LIGHTBOX
// ════════════════════════════════════════
let lbItems = [], lbCurrent = 0;

function openLightbox(items, index) {
  lbItems = items; lbCurrent = index;
  renderLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (musicPlaying) bgAudio.volume = 0.15;
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  document.body.style.overflow = '';
  const vid = lb.querySelector('video');
  if (vid) { vid.pause(); vid.src = ''; }
  if (musicPlaying) bgAudio.volume = 0.7;
}
function lbPrev() { lbCurrent = (lbCurrent - 1 + lbItems.length) % lbItems.length; renderLightbox(); }
function lbNext() { lbCurrent = (lbCurrent + 1) % lbItems.length; renderLightbox(); }

function renderLightbox() {
  const item    = lbItems[lbCurrent];
  const content = document.getElementById('lbContent');
  const counter = document.getElementById('lbCounter');
  const byEl    = document.getElementById('lbBy');
  const oldVid  = content.querySelector('video');
  if (oldVid) { oldVid.pause(); oldVid.src = ''; }
  content.innerHTML = '';
  if (item.tipe === 'video') {
    const vid = document.createElement('video');
    vid.src = item.url; vid.controls = true; vid.autoplay = true; vid.playsInline = true;
    content.appendChild(vid);
  } else {
    const img = document.createElement('img');
    img.src = item.url; img.alt = 'kenangan';
    content.appendChild(img);
  }
  counter.textContent = `${lbCurrent + 1} / ${lbItems.length}`;
  byEl.textContent    = item.oleh === 'admin' ? 'dari kamu' : 'dari dia';
}

function initLightbox() {
  // Keyboard navigation
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  lbPrev();
    if (e.key === 'ArrowRight') lbNext();
  });
  // Swipe mobile
  const lb = document.getElementById('lightbox');
  let touchX = 0;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) dx < 0 ? lbNext() : lbPrev();
  });
}

// ════════════════════════════════════════
//  GALERI
// ════════════════════════════════════════
let isAdmin = false, currentMedia = [];
const ADMIN_PASS = 'admin2tahun';

// Input admin tersembunyi — dipanggil saat secret trigger aktif
function triggerAdminUpload() {
  document.getElementById('adminUpload').click();
}

function activateAdmin() {
  const pass = prompt('Password:');
  if (pass === ADMIN_PASS) {
    isAdmin = true;
    renderGallery(currentMedia);
    showToast('Mode admin aktif ♡');
    // Tampilkan indikator kecil di nav brand
    const brand = document.querySelector('.nav-brand');
    brand.style.color = 'var(--rose-deep)';
    setTimeout(() => { brand.style.color = ''; }, 3000);
  } else if (pass !== null) {
    showToast('Password salah');
  }
}

function deactivateAdmin() {
  isAdmin = false;
  renderGallery(currentMedia);
  showToast('Mode admin nonaktif');
}

// Secret trigger: tap .nav-brand 5 kali dalam 3 detik
function initAdminTrigger() {
  const brand = document.querySelector('.nav-brand');
  let tapCount = 0, tapTimer = null;

  brand.addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapTimer);

    if (tapCount >= 5) {
      tapCount = 0;
      if (!isAdmin) {
        activateAdmin();
      } else {
        deactivateAdmin();
      }
      return;
    }

    // Reset counter setelah 2 detik tidak ada tap
    tapTimer = setTimeout(() => { tapCount = 0; }, 2000);
  });
}

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<div class="gallery-empty">Memuat media...</div>';
  try {
    const data = await galeiFetch();

    // Supabase kadang return object error bukan array
    if (!Array.isArray(data)) {
      console.error('Galeri error:', data);
      // Coba fetch tanpa kolom baru (fallback untuk tabel lama)
      const r2 = await fetch(`${SUPABASE_URL}/rest/v1/galeri?order=waktu.asc&select=id,foto_base64,diunggah_oleh,waktu`, { headers: HEADERS });
      const data2 = await r2.json();
      if (Array.isArray(data2)) {
        currentMedia = data2.map(d => ({ ...d, tipe: 'foto', media_url: null }));
        renderGallery(currentMedia);
        return;
      }
      grid.innerHTML = '<div class="gallery-empty">Gagal memuat. Coba refresh halaman.</div>';
      return;
    }

    currentMedia = data;
    renderGallery(currentMedia);
  } catch (e) {
    console.error('loadGallery error:', e);
    grid.innerHTML = '<div class="gallery-empty">Gagal memuat media. Cek koneksi.</div>';
  }
}

function renderGallery(items) {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';

  // Tombol upload admin — hanya muncul saat mode admin aktif
  if (isAdmin) {
    const adminUploadBtn = document.createElement('label');
    adminUploadBtn.className = 'gallery-item gallery-admin-add';
    adminUploadBtn.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none">
        <span style="font-size:22px;color:var(--rose)">＋</span>
        <span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">upload</span>
      </div>
      <input type="file" id="adminUpload" accept="image/*,video/*" multiple style="display:none">
    `;
    // Pasang listener baru
    const inp = adminUploadBtn.querySelector('input');
    inp.addEventListener('change', async e => {
      const files = [...e.target.files];
      inp.value = '';
      await uploadFiles(files, 'admin');
    });
    grid.appendChild(adminUploadBtn);
  }

  // Filter item yang punya konten
  const valid = items.filter(p => p.foto_base64 || p.media_url);

  if (valid.length === 0) {
    grid.innerHTML = '<div class="gallery-empty">Belum ada foto atau video. Tambahkan kenangan kita ♡</div>';
    return;
  }

  const lbList = valid.map(p => ({
    tipe: p.tipe || 'foto',
    url:  p.media_url || p.foto_base64 || '',
    oleh: p.diunggah_oleh || 'dia'
  }));
  valid.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.onclick   = () => openLightbox(lbList, idx);
    const url  = p.media_url || p.foto_base64 || '';
    const tipe = p.tipe || 'foto';
    if (tipe === 'video') {
      // Canvas thumbnail — capture frame dari video
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      canvas.width  = 300;
      canvas.height = 300;
      item.appendChild(canvas);

      // Placeholder sementara canvas belum terisi
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'position:absolute;inset:0;background:var(--rose-pale);display:flex;align-items:center;justify-content:center;';
      placeholder.innerHTML = '<span style="font-size:28px;opacity:0.4">🎬</span>';
      item.appendChild(placeholder);

      // Buat video tersembunyi untuk capture frame
      const vid = document.createElement('video');
      vid.src         = url;
      vid.muted       = true;
      vid.playsInline = true;
      vid.preload     = 'metadata';
      vid.crossOrigin = 'anonymous';
      vid.style.display = 'none';
      document.body.appendChild(vid);

      vid.addEventListener('loadeddata', () => {
        vid.currentTime = 1;
      });
      vid.addEventListener('seeked', () => {
        try {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          placeholder.style.display = 'none';
        } catch(e) {}
        vid.remove();
      });
      vid.addEventListener('error', () => {
        vid.remove(); // biarkan placeholder tetap tampil
      });

      // Ikon play overlay
      const play = document.createElement('div');
      play.className = 'play-icon';
      item.appendChild(play);
    } else {
      const img = document.createElement('img');
      img.src = url; img.alt = 'kenangan'; img.loading = 'lazy';
      item.appendChild(img);
    }
    const by = document.createElement('div');
    by.className = 'g-by';
    by.textContent = p.diunggah_oleh === 'admin' ? 'kamu' : 'dia';
    item.appendChild(by);
    if (isAdmin) {
      const del = document.createElement('button');
      del.className = 'g-del'; del.textContent = '×'; del.title = 'Hapus';
      del.onclick = async e => {
        e.stopPropagation();
        if (!confirm('Hapus media ini?')) return;
        await galeriDelete(p.id, p.media_url);
        showToast('Media dihapus');
        loadGallery();
      };
      item.appendChild(del);
    }
    grid.appendChild(item);
  });
}

async function uploadFiles(files, oleh) {
  if (!files || files.length === 0) return;
  const bar = document.getElementById('uploadBar');
  const fill = document.getElementById('uploadFill');
  const label = document.getElementById('uploadLabel');
  bar.classList.add('show');
  let done = 0;
  const total = files.length;
  for (const file of files) {
    label.textContent = `Mengunggah ${done + 1} dari ${total}...`;
    fill.style.width  = `${(done / total) * 100}%`;
    const isVideo = file.type.startsWith('video/');
    try {
      if (isVideo) {
        const url = await uploadToStorage(file, oleh);
        await galeriInsert({ tipe: 'video', media_url: url, diunggah_oleh: oleh });
      } else {
        const base64 = await compressImage(await readFileAsBase64(file));
        if (base64.length > 4_000_000) {
          const blob = base64ToBlob(base64, 'image/jpeg');
          const f    = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
          const url  = await uploadToStorage(f, oleh);
          await galeriInsert({ tipe: 'foto', media_url: url, diunggah_oleh: oleh });
        } else {
          await galeriInsert({ tipe: 'foto', foto_base64: base64, diunggah_oleh: oleh });
        }
      }
    } catch (err) { showToast(`Gagal upload: ${file.name}`); }
    done++;
    fill.style.width = `${(done / total) * 100}%`;
  }
  fill.style.width  = '100%';
  label.textContent = 'Selesai!';
  setTimeout(() => { bar.classList.remove('show'); fill.style.width = '0%'; }, 1200);
  showToast(`${total} file tersimpan ♡`);
  loadGallery();
}

function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = ev => res(ev.target.result); r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function compressImage(base64, maxW = 800) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = img.width * scale, h = img.height * scale;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      res(c.toDataURL('image/jpeg', 0.75));
    };
    img.src = base64;
  });
}
function base64ToBlob(base64, mime) {
  const arr = base64.split(','), data = atob(arr[1]), buf = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) buf[i] = data.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

function initGallery() {
  const diaInput   = document.getElementById('diaUpload');
  const adminInput = document.getElementById('adminUpload');

  diaInput.addEventListener('change', async e => {
    const files = [...e.target.files];
    diaInput.value = '';
    await uploadFiles(files, 'dia');
  });

  adminInput.addEventListener('change', async e => {
    const files = [...e.target.files];
    adminInput.value = '';
    await uploadFiles(files, 'admin');
  });

  initAdminTrigger();
  loadGallery();
}

// ════════════════════════════════════════
//  PESAN
// ════════════════════════════════════════
async function loadMessages() {
  const list = document.getElementById('savedList');
  try {
    const data = await dbFetch();
    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<div class="saved-empty">Belum ada pesan yang dikirim.</div>';
      document.getElementById('savedCount').textContent = '';
      return;
    }
    document.getElementById('savedCount').textContent = `${data.length} pesan`;
    list.innerHTML = data.map(m => {
      const d    = new Date(m.waktu);
      const time = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `<div class="saved-card">
        <div class="saved-card-msg">"${m.teks}"</div>
        ${m.balasan_ai ? `<div class="saved-card-ai">${m.balasan_ai}</div>` : ''}
        <span class="saved-card-time">${time}</span>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = '<div class="saved-empty">Gagal memuat. Cek koneksi internet.</div>';
  }
}

async function sendMessage() {
  const input   = document.getElementById('msgInput');
  const text    = input.value.trim();
  if (!text) { showToast('Tulis sesuatu dulu ya ♡'); return; }
  const btn     = document.getElementById('msgSendBtn');
  const btnText = document.getElementById('msgBtnText');
  btn.disabled  = true;
  btnText.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span>';
  let aiReply = '';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Kamu adalah penyambut pesan yang puitis dan hangat dalam sebuah website anniversary romantis. Seseorang mengirimkan pesan tentang perasaan mereka setelah membaca halaman anniversary 2 tahun hubungan HTS yang penuh cinta. Balas dengan bahasa Indonesia yang lembut, puitis, dan menyentuh hati. 2-3 kalimat saja. Jangan sebut dirimu AI. Beri respons seolah kamu adalah suara dari momen itu sendiri.',
        messages: [{ role: 'user', content: text }]
      })
    });
    const data = await resp.json();
    aiReply = data.content?.[0]?.text || 'Pesanmu sangat berarti dan akan selalu tersimpan di sini.';
  } catch (e) {
    aiReply = 'Pesanmu sudah aku terima — dengan sepenuh hati ♡';
  }
  try {
    await dbInsert({ teks: text, balasan_ai: aiReply });
    document.getElementById('msgResponseText').textContent = aiReply;
    document.getElementById('msgResponse').classList.add('show');
    input.value = '';
    showToast('Pesan tersimpan ♡');
    await loadMessages();
  } catch (e) {
    showToast('Gagal menyimpan. Coba lagi.');
  }
  btn.disabled = false;
  btnText.textContent = 'Kirim pesan';
}

// ════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ════════════════════════════════════════
//  SCROLL REVEAL
// ════════════════════════════════════════
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(r => obs.observe(r));
}

// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initPetals();
  initMusic();
  initLightbox();
  initGallery();
  loadMessages();
  initReveal();
});
