<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('import_log', function (Blueprint $table) {
            $table->id();
            $table->string('slug_komoditas');
            $table->date('tanggal_upload');
            $table->string('uploaded_by');
            $table->string('filename')->nullable();
            $table->integer('total_entri')->default(0);
            $table->integer('errors')->default(0);
            $table->timestamps();
            $table->unique(['slug_komoditas', 'tanggal_upload']);
        });
    }
    public function down(): void { Schema::dropIfExists('import_log'); }
};