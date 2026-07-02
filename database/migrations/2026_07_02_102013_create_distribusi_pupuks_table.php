<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('distribusi_pupuks', function (Blueprint $table) {
            $table->id();
            $table->string('kabupaten_kota');
            $table->foreignId('jenis_pupuk_id')->constrained('jenis_pupuks')->cascadeOnDelete();
            $table->decimal('kuota', 10, 2)->default(0);
            $table->decimal('tersalurkan', 10, 2)->default(0);
            $table->string('periode')->nullable(); // e.g. "2026"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distribusi_pupuks');
    }
};
