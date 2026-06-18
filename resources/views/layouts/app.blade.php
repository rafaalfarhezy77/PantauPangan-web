<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Dashboard') — PantauPangan</title>

    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">

    {{-- Styles --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <style>
        :root {
            --green-deep:  #1a3a2a;
            --green-mid:   #2d6a4f;
            --green-light: #52b788;
            --green-pale:  #b7e4c7;
            --green-mist:  #d8f3dc;
            --cream:       #faf7f2;
            --cream-dark:  #f0ebe0;
        }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--cream); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .4s ease both; }
    </style>

    @stack('styles')
</head>
<body class="min-h-screen" style="background: var(--cream);">

    {{-- Sidebar --}}
    <x-sidebar />

    {{-- Main content area --}}
    <div class="md:ml-60 min-h-screen flex flex-col">

        {{-- Topbar --}}
        <x-topbar :title="View::yieldContent('title')" />

        {{-- Flash messages --}}
        @if(session('success'))
        <div class="mx-4 mt-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-mist text-green-deep border border-green-light/40 fade-up"
             x-data x-init="setTimeout(() => $el.remove(), 4000)">
            ✅ {{ session('success') }}
        </div>
        @endif

        @if(session('error'))
        <div class="mx-4 mt-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200 fade-up"
             x-data x-init="setTimeout(() => $el.remove(), 4000)">
            ❌ {{ session('error') }}
        </div>
        @endif

        {{-- Page Content --}}
        <main class="flex-1 p-4 md:p-8">
            @yield('content')
            {{ $slot ?? '' }}
        </main>

        {{-- Footer --}}
        <footer class="text-center text-xs text-gray-400 py-4 border-t border-cream-dark">
            PantauPangan &copy; {{ date('Y') }} — Universitas Sebelas Maret
        </footer>
    </div>

    @stack('scripts')
</body>
</html>
