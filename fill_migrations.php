<?php

file_put_contents('database/migrations/2026_06_04_030353_create_komoditas_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('komoditas', function (Blueprint \) {
            \->id();
            \->string('nama_komoditas');
            \->string('slug_komoditas')->unique();
            \->string('kategori')->nullable();
            \->string('icon')->nullable();
            \->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            \->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('komoditas'); }
};
EOT
);

file_put_contents('database/migrations/2026_06_04_030354_create_harga_harians_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('harga_harian', function (Blueprint \) {
            \->id();
            \->string('slug_komoditas')->index();
            \->string('provinsi')->index();
            \->integer('harga');
            \->date('tanggal')->index();
            \->timestamps();
            \->unique(['slug_komoditas', 'provinsi', 'tanggal']);
        });
    }
    public function down(): void { Schema::dropIfExists('harga_harian'); }
};
EOT
);

file_put_contents('database/migrations/2026_06_04_030354_create_beritas_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('berita', function (Blueprint \) {
            \->id();
            \->string('judul');
            \->text('deskripsi');
            \->string('cover_image')->nullable();
            \->date('tanggal');
            \->string('slug_komoditas')->nullable();
            \->string('uploaded_by')->nullable();
            \->string('sumber')->nullable();
            \->string('penulis')->nullable();
            \->string('link_url')->nullable();
            \->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('berita'); }
};
EOT
);

file_put_contents('database/migrations/2026_06_04_030355_create_pantauan_users_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('pantauan_user', function (Blueprint \) {
            \->id();
            \->foreignId('user_id')->constrained('users')->onDelete('cascade');
            \->string('slug_komoditas')->index();
            \->timestamp('ditambahkan_pada')->useCurrent();
            \->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('pantauan_user'); }
};
EOT
);

file_put_contents('database/migrations/2026_06_04_030355_create_riwayat_users_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('riwayat_user', function (Blueprint \) {
            \->id();
            \->foreignId('user_id')->constrained('users')->onDelete('cascade');
            \->string('slug_komoditas')->index();
            \->timestamp('waktu_pencarian')->useCurrent();
            \->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('riwayat_user'); }
};
EOT
);

file_put_contents('database/migrations/2026_06_04_030356_create_hasil_panens_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('hasil_panen', function (Blueprint \) {
            \->id();
            \->foreignId('user_id')->constrained('users')->onDelete('cascade');
            \->string('nama_komoditas');
            \->decimal('jumlah', 10, 2);
            \->string('satuan')->default('kg');
            \->date('tanggal_panen');
            \->string('lokasi_lahan')->nullable();
            \->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('hasil_panen'); }
};
EOT
);

file_put_contents('database/migrations/2026_06_04_030356_create_import_logs_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('import_log', function (Blueprint \) {
            \->id();
            \->string('slug_komoditas');
            \->date('tanggal_upload');
            \->string('uploaded_by');
            \->string('filename')->nullable();
            \->integer('total_entri')->default(0);
            \->integer('errors')->default(0);
            \->timestamps();
            \->unique(['slug_komoditas', 'tanggal_upload']);
        });
    }
    public function down(): void { Schema::dropIfExists('import_log'); }
};
EOT
);
echo "SUCCESS_MIGRATIONS";
