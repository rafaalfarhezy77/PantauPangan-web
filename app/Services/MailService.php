<?php

namespace App\Services;

use App\Models\User;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Illuminate\Support\Facades\Log;

class MailService
{
    /**
     * Kirim email sambutan ke user yang baru mendaftar.
     */
    public function sendWelcome(User $user): bool
    {
        $mail = new PHPMailer(true);

        try {
            // ── Server Settings (Sumopod SMTP) ────────────────────────
            $mail->isSMTP();
            $mail->Host       = env('SUMOPOD_HOST', 'smtp.sumopod.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('SUMOPOD_USERNAME');
            $mail->Password   = env('SUMOPOD_PASSWORD');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL port 465
            $mail->Port       = (int) env('SUMOPOD_PORT', 465);
            $mail->CharSet    = PHPMailer::CHARSET_UTF8;

            // ── Recipients ────────────────────────────────────────────
            $mail->setFrom(
                env('SUMOPOD_FROM_ADDRESS', 'noreply@pantaupangan.id'),
                env('SUMOPOD_FROM_NAME', 'PantauPangan')
            );
            $mail->addAddress($user->email, $user->username);

            // ── Content ───────────────────────────────────────────────
            $mail->isHTML(true);
            $mail->Subject = '🌾 Selamat Datang di PantauPangan, ' . $user->username . '!';
            $mail->Body    = $this->buildWelcomeHtml($user);
            $mail->AltBody = $this->buildWelcomePlainText($user);

            $mail->send();

            Log::info('[MailService] Email welcome berhasil dikirim ke: ' . $user->email);
            return true;

        } catch (Exception $e) {
            Log::error('[MailService] Gagal kirim email welcome ke ' . $user->email . ' — ' . $mail->ErrorInfo);
            return false;
        }
    }

    // ── HTML Template ─────────────────────────────────────────────────

    private function buildWelcomeHtml(User $user): string
    {
        $username     = htmlspecialchars($user->username);
        $email        = htmlspecialchars($user->email);
        $role         = htmlspecialchars(ucwords($user->role));
        $dashboardUrl = config('app.url') . '/dashboard';
        $year         = date('Y');

        return <<<HTML
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Selamat Datang di PantauPangan</title>
        </head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 50%,#166534 100%);padding:48px 40px;text-align:center;">
                                    <div style="font-size:56px;margin-bottom:16px;">🌾</div>
                                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">PantauPangan</h1>
                                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Sistem Pemantauan Harga Pangan</p>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:48px 40px;">
                                    <h2 style="color:#1a2e1a;margin:0 0 12px;font-size:24px;font-weight:700;">Selamat Datang, {$username}! 👋</h2>
                                    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 28px;">
                                        Akun kamu berhasil dibuat di <strong>PantauPangan</strong>. Kini kamu bisa memantau harga pangan, melihat prediksi harga, dan mengakses informasi pertanian terkini.
                                    </p>

                                    <!-- Info Card -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:32px;">
                                        <tr>
                                            <td style="padding:24px 28px;">
                                                <p style="margin:0 0 16px;color:#166534;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Detail Akun Kamu</p>
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="color:#6b7280;font-size:14px;padding:5px 0;width:80px;vertical-align:top;">Email</td>
                                                        <td style="color:#374151;font-size:14px;padding:5px 0;font-weight:600;">{$email}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color:#6b7280;font-size:14px;padding:5px 0;vertical-align:top;">Role</td>
                                                        <td style="color:#374151;font-size:14px;padding:5px 0;font-weight:600;">{$role}</td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- CTA Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding-bottom:8px;">
                                                <a href="{$dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 4px 16px rgba(22,163,74,0.35);">
                                                    🚀 Mulai Pantau Harga
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Divider -->
                            <tr>
                                <td style="padding:0 40px;">
                                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding:28px 40px;text-align:center;">
                                    <p style="color:#9ca3af;font-size:13px;margin:0 0 6px;">© {$year} PantauPangan. Seluruh hak dilindungi.</p>
                                    <p style="color:#d1d5db;font-size:12px;margin:0;">Email ini dikirim secara otomatis, harap tidak membalas.</p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        HTML;
    }

    // ── Plain Text Fallback ───────────────────────────────────────────

    private function buildWelcomePlainText(User $user): string
    {
        $dashboardUrl = config('app.url') . '/dashboard';

        return
            "Selamat Datang di PantauPangan!\n\n" .
            "Halo {$user->username},\n\n" .
            "Akun kamu berhasil dibuat dengan detail berikut:\n" .
            "  Email : {$user->email}\n" .
            "  Role  : " . ucwords($user->role) . "\n\n" .
            "Kunjungi dashboard kamu di:\n{$dashboardUrl}\n\n" .
            "Salam,\nTim PantauPangan";
    }
}
