<?php

namespace App\Jobs;

use App\Models\User;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWelcomeEmail implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    /**
     * Jumlah percobaan ulang jika job gagal.
     */
    public int $tries = 3;

    /**
     * Jeda antar retry (dalam detik).
     */
    public array $backoff = [30, 60, 120];

    /**
     * Create a new job instance.
     */
    public function __construct(
        public readonly User $user
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('[SendWelcomeEmail] Mengirim email welcome ke: ' . $this->user->email);
        \Illuminate\Support\Facades\Mail::to($this->user->email)->send(new \App\Mail\WelcomeEmail($this->user));
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('[SendWelcomeEmail] Job gagal untuk user: ' . $this->user->email . ' — ' . $exception->getMessage());
    }
}
