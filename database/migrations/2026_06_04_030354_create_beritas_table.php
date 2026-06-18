<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('berita', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->text('deskripsi');
            $table->string('cover_image')->nullable();
            $table->date('tanggal');
            $table->string('slug_komoditas')->nullable();
            $table->string('uploaded_by')->nullable();
            $table->string('sumber')->nullable();
            $table->string('penulis')->nullable();
            $table->string('link_url')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('berita'); }
};