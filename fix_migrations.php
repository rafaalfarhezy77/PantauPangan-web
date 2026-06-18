<?php

file_put_contents('database/migrations/2026_06_04_030353_create_komoditas_table.php', <<<EOT
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('komoditas', function (Blueprint \$table) {
            \$table->id();
            \$table->string('nama_komoditas');
            \$table->string('slug_komoditas')->unique();
            \$table->string('kategori')->nullable();
            \$table->string('icon')->nullable();
            \$table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            \$table->timestamps();
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
        Schema::create('harga_harian', function (Blueprint \$table) {
            \$table->id();
            \$table->string('slug_komoditas')->index();
            \$table->string('provinsi')->index();
            \$table->integer('harga');
            \$table->date('tanggal')->index();
            \$table->timestamps();
            \$table->unique(['slug_komoditas', 'provinsi', 'tanggal']);
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
        Schema::create('berita', function (Blueprint \$table) {
            \$table->id();
            \$table->string('judul');
            \$table->text('deskripsi');
            \$table->string('cover_image')->nullable();
            \$table->date('tanggal');
            \$table->string('slug_komoditas')->nullable();
            \$table->string('uploaded_by')->nullable();
            \$table->string('sumber')->nullable();
            \$table->string('penulis')->nullable();
            \$table->string('link_url')->nullable();
            \$table->timestamps();
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
        Schema::create('pantauan_user', function (Blueprint \$table) {
            \$table->id();
            \$table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            \$table->string('slug_komoditas')->index();
            \$table->timestamp('ditambahkan_pada')->useCurrent();
            \$table->timestamps();
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
        Schema::create('riwayat_user', function (Blueprint \$table) {
            \$table->id();
            \$table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            \$table->string('slug_komoditas')->index();
            \$table->timestamp('waktu_pencarian')->useCurrent();
            \$table->timestamps();
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
        Schema::create('hasil_panen', function (Blueprint \$table) {
            \$table->id();
            \$table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            \$table->string('nama_komoditas');
            \$table->decimal('jumlah', 10, 2);
            \$table->string('satuan')->default('kg');
            \$table->date('tanggal_panen');
            \$table->string('lokasi_lahan')->nullable();
            \$table->timestamps();
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
        Schema::create('import_log', function (Blueprint \$table) {
            \$table->id();
            \$table->string('slug_komoditas');
            \$table->date('tanggal_upload');
            \$table->string('uploaded_by');
            \$table->string('filename')->nullable();
            \$table->integer('total_entri')->default(0);
            \$table->integer('errors')->default(0);
            \$table->timestamps();
            \$table->unique(['slug_komoditas', 'tanggal_upload']);
        });
    }
    public function down(): void { Schema::dropIfExists('import_log'); }
};
EOT
);
echo "SUCCESS_MIGRATIONS";
