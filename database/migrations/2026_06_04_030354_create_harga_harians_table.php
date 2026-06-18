<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('harga_harian', function (Blueprint $table) {
            $table->id();
            $table->string('slug_komoditas')->index();
            $table->string('provinsi')->index();
            $table->integer('harga');
            $table->date('tanggal')->index();
            $table->timestamps();
            $table->unique(['slug_komoditas', 'provinsi', 'tanggal']);
        });
    }
    public function down(): void { Schema::dropIfExists('harga_harian'); }
};