<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('hasil_panen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('nama_komoditas');
            $table->decimal('jumlah', 10, 2);
            $table->string('satuan')->default('kg');
            $table->date('tanggal_panen');
            $table->string('lokasi_lahan')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('hasil_panen'); }
};