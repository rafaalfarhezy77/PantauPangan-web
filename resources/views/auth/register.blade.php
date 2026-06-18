<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Daftar — PantauPangan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'green-deep':  '#1a3a2a',
          'green-mid':   '#2d6a4f',
          'green-light': '#52b788',
          'green-pale':  '#b7e4c7',
          'green-mist':  '#d8f3dc',
          'cream':       '#faf7f2',
          'cream-dark':  '#f0ebe0',
        },
        fontFamily: {
          sans:  ['Plus Jakarta Sans', 'sans-serif'],
          serif: ['Lora', 'serif'],
        },
      }
    }
  }
</script>
<style>
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes float   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.04)} }
  .anim-0  { animation: fadeUp .7s ease both; }
  .anim-1  { animation: fadeUp .7s .15s ease both; }
  .anim-2  { animation: fadeUp .7s .3s ease both; }
  .float-1 { animation: float 8s ease-in-out infinite; }
  .float-2 { animation: float 6s ease-in-out infinite reverse; }
</style>
</head>
<body class="bg-cream min-h-screen flex">

<!-- ── PANEL KIRI (Visual) ── -->
<div class="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden
            bg-gradient-to-br from-green-deep via-green-mid to-green-light">

  <!-- bg pattern -->
  <div class="absolute inset-0 opacity-[0.04]"
       style="background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><path fill=%22white%22 d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/></svg>')">
  </div>

  <!-- Blobs dekoratif -->
  <div class="float-1 absolute -bottom-20 -right-20 w-96 h-96 rounded-full"
       style="background:radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 70%)"></div>
  <div class="float-2 absolute top-1/3 -left-14 w-52 h-52 rounded-full"
       style="background:radial-gradient(circle, rgba(255,255,255,.06) 0%, transparent 70%)"></div>

  <!-- Brand -->
  <div class="relative z-10 flex items-center gap-3 anim-0">
    <div class="w-11 h-11 bg-white/15 border border-white/20 backdrop-blur-sm rounded-xl
                flex items-center justify-center text-xl">🌾</div>
    <span class="font-bold text-white text-xl tracking-tight">
      Pantau<span class="text-green-pale">Pangan</span>
    </span>
  </div>

  <!-- Content tengah -->
  <div class="relative z-10 anim-1">
    <p class="font-serif italic text-green-pale text-base mb-4 opacity-90">Bergabung bersama ribuan pengguna</p>
    <h1 class="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
      Daftar Gratis,<br><em class="font-serif font-normal italic text-green-pale">Pantau</em> Harga Sekarang
    </h1>
    <p class="text-white/70 text-base leading-relaxed max-w-sm mb-10">
      Buat akun dan mulai memantau harga komoditas pangan favoritmu dari seluruh Indonesia.
    </p>

    <!-- Commodity cards -->
    <div class="flex flex-col gap-2.5 anim-2">
      <div class="flex items-center gap-3.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3.5">
        <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🌾</div>
        <div class="flex-1">
          <p class="text-xs text-white/60">Beras Premium</p>
          <p class="text-base font-bold text-white">Rp 14.500/kg</p>
        </div>
        <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-green-400/20 text-green-300">▲ 1.2%</span>
      </div>
      <div class="flex items-center gap-3.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3.5">
        <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🌶️</div>
        <div class="flex-1">
          <p class="text-xs text-white/60">Cabai Merah</p>
          <p class="text-base font-bold text-white">Rp 32.000/kg</p>
        </div>
        <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-red-400/20 text-red-300">▲ 8.4%</span>
      </div>
      <div class="flex items-center gap-3.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3.5">
        <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🧅</div>
        <div class="flex-1">
          <p class="text-xs text-white/60">Bawang Merah</p>
          <p class="text-base font-bold text-white">Rp 28.500/kg</p>
        </div>
        <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-red-400/20 text-red-300">▼ 3.1%</span>
      </div>
    </div>
  </div>

  <!-- Footer stats -->
  <div class="relative z-10 flex gap-8 pt-7 border-t border-white/10 anim-2">
    <div><p class="text-2xl font-bold text-white leading-tight">34</p><p class="text-xs text-white/50">Provinsi</p></div>
    <div><p class="text-2xl font-bold text-white leading-tight">120+</p><p class="text-xs text-white/50">Komoditas</p></div>
    <div><p class="text-2xl font-bold text-white leading-tight">Harian</p><p class="text-xs text-white/50">Update</p></div>
  </div>
</div>

<!-- ── PANEL KANAN (Form Register) ── -->
<div class="w-full lg:w-[460px] flex-shrink-0 bg-cream flex flex-col justify-center px-8 md:px-12 py-10 min-h-screen overflow-y-auto relative">

  <!-- Tombol kembali -->
  <a href="{{ route('beranda') }}"
     class="absolute top-6 right-6 flex items-center gap-1.5 text-xs font-medium text-gray-400
            bg-white border border-cream-dark px-3.5 py-2 rounded-full
            hover:border-green-pale hover:text-green-deep transition-colors no-underline">
    ← Ke Beranda
  </a>

  <!-- Mobile brand -->
  <div class="flex items-center gap-2.5 mb-8 lg:hidden">
    <div class="w-9 h-9 bg-green-deep rounded-xl flex items-center justify-center text-base">🌾</div>
    <span class="font-bold text-green-deep text-base">Pantau<span class="text-green-light">Pangan</span></span>
  </div>

  <!-- Header -->
  <div class="mb-7">
    <p class="font-serif italic text-green-mid text-sm mb-1">Halo, pengguna baru! 🌱</p>
    <h2 class="text-2xl font-bold text-green-deep tracking-tight mb-1">Buat Akun Baru</h2>
    <p class="text-sm text-gray-400">Gratis selamanya. Daftar sekarang dan mulai pantau harga!</p>
  </div>

  <!-- Tabs -->
  <div class="flex bg-cream-dark p-1 rounded-xl mb-6 gap-1">
    <a href="{{ route('login') }}"
       class="flex-1 py-2 text-sm font-semibold text-center rounded-lg text-gray-400 bg-transparent transition-all hover:text-gray-600 no-underline">
      Masuk
    </a>
    <a href="{{ route('register') }}"
       class="flex-1 py-2 text-sm font-semibold text-center rounded-lg bg-white text-green-deep shadow-sm transition-all no-underline">
      Daftar
    </a>
  </div>

  <!-- Error alert -->
  @if ($errors->any())
    <div class="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600">
      <ul class="list-disc list-inside space-y-0.5">
        @foreach ($errors->all() as $error)
          <li>{{ $error }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <!-- Form Register -->
  <form method="POST" action="{{ route('register') }}">
    @csrf
    <div class="space-y-4 mb-5">

      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
        <input id="username" type="text" name="username" value="{{ old('username') }}" required autocomplete="username"
               placeholder="cth : budisantoso"
               class="w-full px-3.5 py-3 bg-white border border-cream-dark rounded-xl text-sm
                      outline-none focus:border-green-light transition-colors font-sans @error('username') border-red-400 @enderror">
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">✉️</span>
          <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="email"
                 placeholder="nama@email.com"
                 class="w-full pl-10 pr-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                        outline-none focus:border-green-light transition-colors font-sans @error('email') border-red-400 @enderror">
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">Kata Sandi</label>
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔒</span>
          <input id="password" type="password" name="password" required autocomplete="new-password"
                 placeholder="Min. 8 karakter"
                 oninput="checkPwStrength(this.value)"
                 class="w-full pl-10 pr-12 py-3 bg-white border border-cream-dark rounded-xl text-sm
                        outline-none focus:border-green-light transition-colors font-sans @error('password') border-red-400 @enderror">
          <button type="button" onclick="togglePw('password', this)"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-base bg-transparent border-0 cursor-pointer leading-none">👁</button>
        </div>
        <!-- Password strength -->
        <div class="flex items-center gap-2 mt-2">
          <div class="flex gap-1 flex-1">
            <div id="bar1" class="h-1.5 flex-1 rounded-full bg-cream-dark transition-colors"></div>
            <div id="bar2" class="h-1.5 flex-1 rounded-full bg-cream-dark transition-colors"></div>
            <div id="bar3" class="h-1.5 flex-1 rounded-full bg-cream-dark transition-colors"></div>
          </div>
          <span id="pwLabel" class="text-xs font-semibold"></span>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">Konfirmasi Kata Sandi</label>
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔒</span>
          <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password"
                 placeholder="Ulangi kata sandi"
                 class="w-full pl-10 pr-12 py-3 bg-white border border-cream-dark rounded-xl text-sm
                        outline-none focus:border-green-light transition-colors font-sans">
          <button type="button" onclick="togglePw('password_confirmation', this)"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-base bg-transparent border-0 cursor-pointer leading-none">👁</button>
        </div>
      </div>
    </div>

    <!-- Role selector -->
    <p class="text-xs font-semibold text-gray-600 mb-2.5">Kamu adalah seorang...</p>
    <div id="roleGrid" class="grid grid-cols-3 gap-2 mb-3">
      <div onclick="selectRole('petani', this)"
           class="role-card flex flex-col items-center gap-1.5 p-3 bg-white border border-cream-dark rounded-xl cursor-pointer hover:border-green-pale transition-all text-center">
        <span class="text-2xl">🌾</span>
        <span class="text-xs font-semibold text-gray-700">Petani</span>
      </div>
      <div onclick="selectRole('pembeli', this)"
           class="role-card flex flex-col items-center gap-1.5 p-3 bg-white border border-cream-dark rounded-xl cursor-pointer hover:border-green-pale transition-all text-center">
        <span class="text-2xl">🛒</span>
        <span class="text-xs font-semibold text-gray-700">Pembeli</span>
      </div>
      <div onclick="selectRole('tengkulak', this)"
           class="role-card flex flex-col items-center gap-1.5 p-3 bg-white border border-cream-dark rounded-xl cursor-pointer hover:border-green-pale transition-all text-center">
        <span class="text-2xl">🏪</span>
        <span class="text-xs font-semibold text-gray-700">Tengkulak</span>
      </div>
      <div onclick="selectRole('pedagang', this)"
           class="role-card flex flex-col items-center gap-1.5 p-3 bg-white border border-cream-dark rounded-xl cursor-pointer hover:border-green-pale transition-all text-center">
        <span class="text-2xl">🏬</span>
        <span class="text-xs font-semibold text-gray-700">Pedagang</span>
      </div>
      <div onclick="selectRole('dinas pemerintah', this)"
           class="role-card flex flex-col items-center gap-1.5 p-3 bg-white border border-cream-dark rounded-xl cursor-pointer hover:border-green-pale transition-all text-center">
        <span class="text-2xl">🏛️</span>
        <span class="text-xs font-semibold text-gray-700">Dinas</span>
      </div>
      <div onclick="selectRole('lainnya', this)"
           class="role-card flex flex-col items-center gap-1.5 p-3 bg-white border border-cream-dark rounded-xl cursor-pointer hover:border-green-pale transition-all text-center">
        <span class="text-2xl">👤</span>
        <span class="text-xs font-semibold text-gray-700">Lainnya</span>
      </div>
    </div>
    <input type="hidden" id="selectedRole" name="role" value="{{ old('role') }}">

    <!-- Instansi Dinas (conditionally shown) -->
    <div id="instansiDinasContainer" class="hidden mb-5">
      <label class="block text-xs font-semibold text-gray-600 mb-1.5">Instansi Dinas</label>
      <div class="relative">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🏢</span>
        <input id="regInstansiDinas" type="text" name="instansi_dinas" value="{{ old('instansi_dinas') }}"
               placeholder="cth : Dinas Pertanian Jawa Barat"
               class="w-full pl-10 pr-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                      outline-none focus:border-green-light transition-colors font-sans">
      </div>
    </div>

    <button type="submit"
      class="w-full py-3.5 bg-green-deep text-white font-semibold text-sm rounded-xl
             hover:bg-green-mid transition-colors cursor-pointer border-0 font-sans mb-3 mt-2">
      Buat Akun →
    </button>
  </form>

  <p class="text-center text-xs text-gray-400 mt-2">
    Sudah punya akun?
    <a href="{{ route('login') }}" class="text-green-mid font-semibold hover:underline">Masuk sekarang</a>
  </p>
</div>

<script>
let selectedRoleValue = '{{ old('role') }}';

// Highlight role yang sudah dipilih (jika ada old value)
document.addEventListener('DOMContentLoaded', function() {
  if (selectedRoleValue) {
    const cards = document.querySelectorAll('.role-card');
    cards.forEach(card => {
      const spanText = card.querySelector('span:last-child').textContent.toLowerCase();
      const roleMap = { 'petani': 'petani', 'pembeli': 'pembeli', 'tengkulak': 'tengkulak', 'pedagang': 'pedagang', 'dinas': 'dinas pemerintah', 'lainnya': 'lainnya' };
      if (roleMap[spanText] === selectedRoleValue) {
        card.classList.add('border-green-light', 'bg-green-mist');
        card.classList.remove('border-cream-dark');
      }
    });
    if (selectedRoleValue === 'dinas pemerintah') {
      document.getElementById('instansiDinasContainer').classList.remove('hidden');
    }
  }
});

function togglePw(id, btn) {
  const input = document.getElementById(id);
  const hide  = input.type === 'password';
  input.type  = hide ? 'text' : 'password';
  btn.textContent = hide ? '🙈' : '👁';
}

function checkPwStrength(pw) {
  const bars  = [document.getElementById('bar1'), document.getElementById('bar2'), document.getElementById('bar3')];
  const label = document.getElementById('pwLabel');
  bars.forEach(b => { b.className = 'h-1.5 flex-1 rounded-full bg-cream-dark transition-colors'; });
  if (!pw) { label.textContent = ''; return; }
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  const levels = [
    {color:'bg-red-400',    textColor:'text-red-500',    text:'Lemah',  count:1},
    {color:'bg-orange-400', textColor:'text-orange-500', text:'Sedang', count:2},
    {color:'bg-green-400',  textColor:'text-green-600',  text:'Kuat',   count:3},
  ];
  const lv = levels[Math.min(score, 3) - 1] || levels[0];
  for (let i = 0; i < lv.count; i++) {
    bars[i].className = `h-1.5 flex-1 rounded-full ${lv.color} transition-colors`;
  }
  label.className   = `text-xs font-semibold ${lv.textColor}`;
  label.textContent = lv.text;
}

function selectRole(role, el) {
  selectedRoleValue = role;
  document.querySelectorAll('.role-card').forEach(c => {
    c.classList.remove('border-green-light', 'bg-green-mist');
    c.classList.add('border-cream-dark');
  });
  el.classList.add('border-green-light', 'bg-green-mist');
  el.classList.remove('border-cream-dark');
  document.getElementById('selectedRole').value = role;

  const instansiContainer = document.getElementById('instansiDinasContainer');
  if (role === 'dinas pemerintah') {
    instansiContainer.classList.remove('hidden');
  } else {
    instansiContainer.classList.add('hidden');
  }
}
</script>
</body>
</html>
