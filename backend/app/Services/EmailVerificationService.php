<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailVerificationService
{
    /**
     * Known disposable / fake email domains that should be blocked.
     */
    protected const DISPOSABLE_DOMAINS = [
        'mailinator.com',
        'tempmail.com',
        'temp-mail.org',
        '10minutemail.com',
        'guerrillamail.com',
        'guerrillamail.net',
        'sharklasers.com',
        'trashmail.com',
        'fake.com',
        'fakeinbox.com',
        'yopmail.com',
        'yopmail.fr',
        'dispostable.com',
        'throwawaymail.com',
        'getairmail.com',
        'mytemp.email',
        'burnermail.io',
        'guerrillamailblock.com',
        'generator.email',
        'inboxkitten.com',
        'dropmail.me',
        'mohmal.com',
        'crazymailing.com',
        'nada.ltd',
        'getnada.com',
        'fakemailgenerator.com',
        'emailfake.com',
        'disposablemail.com',
    ];

    /**
     * Obvious fake / test patterns in username that should be blocked.
     */
    protected const FAKE_USERNAMES = [
        'test',
        'testing',
        'fake',
        'fakename',
        'fakemail',
        'notreal',
        'notrealemail',
        'temp',
        'temporary',
        'dummy',
        'dummyuser',
        'random',
        'sample',
        'example',
        'asdf',
        'asdfgh',
        'qwerty',
        'zxcvbn',
        '123456',
        '111111',
        'noreply',
        'unknown',
        'fakeemail',
        'testemail',
        'nobody',
        'noemail',
        'user123',
        'tester',
    ];

    /**
     * Check if an email address belongs to a real domain with active mail servers.
     *
     * @return array{valid: bool, is_google: bool, message: string}
     */
    public function validateRealEmail(string $email): array
    {
        $cleanEmail = strtolower(trim($email));

        if (! filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            return [
                'valid' => false,
                'is_google' => false,
                'message' => 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវឡើយ (Invalid email format).',
            ];
        }

        $parts = explode('@', $cleanEmail);
        $username = $parts[0] ?? '';
        $domain = $parts[1] ?? '';

        if (empty($username) || empty($domain)) {
            return [
                'valid' => false,
                'is_google' => false,
                'message' => 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវឡើយ (Invalid email format).',
            ];
        }

        // Check against known disposable domains
        if (in_array($domain, self::DISPOSABLE_DOMAINS, true)) {
            return [
                'valid' => false,
                'is_google' => false,
                'message' => 'សូមប្រើប្រាស់អ៊ីមែលពិតប្រាកដ។ មិនអនុញ្ញាតឱ្យប្រើ Temporary / Disposable Email ឡើយ។',
            ];
        }

        // Standard known valid email providers
        $isGoogleDomain = in_array($domain, ['gmail.com', 'googlemail.com'], true);
        $knownValidDomains = [
            'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com',
            'outlook.com', 'icloud.com', 'me.com', 'mac.com', 'live.com',
            'msn.com', 'aol.com', 'zoho.com', 'proton.me', 'protonmail.com',
        ];

        if (in_array($domain, $knownValidDomains, true)) {
            return [
                'valid' => true,
                'is_google' => $isGoogleDomain,
                'message' => 'Email ត្រូវបានផ្ទៀងផ្ទាត់ថាជា Email ពិតប្រាកដ។',
            ];
        }

        // For other custom domains, check DNS MX records
        $hasMx = false;
        try {
            if (function_exists('checkdnsrr')) {
                $hasMx = @checkdnsrr($domain, 'MX');
            } else {
                $hasMx = true;
            }
        } catch (\Throwable $e) {
            $hasMx = true;
        }

        if (! $hasMx) {
            return [
                'valid' => false,
                'is_google' => false,
                'message' => "Domain '{$domain}' មិនមានម៉ាស៊ីនបម្រើ Email (Mail Server/MX) ពិតប្រាកដឡើយ។",
            ];
        }

        return [
            'valid' => true,
            'is_google' => false,
            'message' => 'Email ត្រូវបានផ្ទៀងផ្ទាត់ថាជា Email ពិតប្រាកដ។',
        ];
    }

    /**
     * Verify Google ID Token (from Google Identity Services / GIS).
     *
     * @return array{email: string, name: string, google_id: string, avatar: ?string, email_verified: bool}|null
     */
    public function verifyGoogleIdToken(string $idToken): ?array
    {
        try {
            $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);

            if (! $response->successful()) {
                Log::warning('Google tokeninfo verification failed: '.$response->body());

                return null;
            }

            $payload = $response->json();

            // Must be issued by Google
            $iss = $payload['iss'] ?? '';
            if (! in_array($iss, ['accounts.google.com', 'https://accounts.google.com'], true)) {
                return null;
            }

            // Must be verified email
            $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
            if (! $emailVerified || empty($payload['email'])) {
                return null;
            }

            return [
                'email' => strtolower($payload['email']),
                'name' => $payload['name'] ?? $payload['given_name'] ?? 'Google User',
                'google_id' => (string) ($payload['sub'] ?? ''),
                'avatar' => $payload['picture'] ?? null,
                'email_verified' => true,
            ];
        } catch (\Throwable $e) {
            Log::error('Error verifying Google ID token: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Verify Google Access Token via userinfo endpoint.
     *
     * @return array{email: string, name: string, google_id: string, avatar: ?string, email_verified: bool}|null
     */
    public function verifyGoogleAccessToken(string $accessToken): ?array
    {
        try {
            $response = Http::timeout(10)
                ->withToken($accessToken)
                ->get('https://www.googleapis.com/oauth2/v3/userinfo');

            if (! $response->successful()) {
                return null;
            }

            $payload = $response->json();
            $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
            if (! $emailVerified || empty($payload['email'])) {
                return null;
            }

            return [
                'email' => strtolower($payload['email']),
                'name' => $payload['name'] ?? 'Google User',
                'google_id' => (string) ($payload['sub'] ?? ''),
                'avatar' => $payload['picture'] ?? null,
                'email_verified' => true,
            ];
        } catch (\Throwable $e) {
            Log::error('Error verifying Google Access token: '.$e->getMessage());

            return null;
        }
    }
}
