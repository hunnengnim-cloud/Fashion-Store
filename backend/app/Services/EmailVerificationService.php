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
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Invalid email format).',
            ];
        }

        $parts = explode('@', $cleanEmail);
        $username = $parts[0] ?? '';
        $domain = $parts[1] ?? '';

        if (empty($username) || empty($domain)) {
            return [
                'valid' => false,
                'is_google' => false,
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។',
            ];
        }

        // Check against known disposable domains
        if (in_array($domain, self::DISPOSABLE_DOMAINS, true)) {
            return [
                'valid' => false,
                'is_google' => false,
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Disposable email blocked).',
            ];
        }

        // Check if domain is standard Google / Gmail
        $isGoogleDomain = in_array($domain, ['gmail.com', 'googlemail.com'], true);

        // Strict Google username length and character check (Google requires 6-30 chars)
        if ($isGoogleDomain) {
            $userLen = strlen($username);
            if ($userLen < 6 || $userLen > 30) {
                return [
                    'valid' => false,
                    'is_google' => true,
                    'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Google requires 6-30 characters).',
                ];
            }

            // Cannot start or end with a dot, cannot have consecutive dots
            if (str_starts_with($username, '.') || str_ends_with($username, '.') || str_contains($username, '..')) {
                return [
                    'valid' => false,
                    'is_google' => true,
                    'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។',
                ];
            }
        }

        // Check for obvious fake/test patterns in username
        $cleanUsername = strtolower(str_replace(['.', '_', '-'], '', $username));
        foreach (self::FAKE_USERNAMES as $fake) {
            // Block exact matches (e.g. "test", "fake", "dummy") or test strings with digits (e.g. "test123", "fake99")
            if ($cleanUsername === $fake || preg_match('/^'.preg_quote($fake, '/').'\d+$/', $cleanUsername)) {
                return [
                    'valid' => false,
                    'is_google' => $isGoogleDomain,
                    'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
                ];
            }
        }

        // Block explicit test prefix with separator (e.g. "test.account", "fake_user")
        if (preg_match('/^(test|fake|temp|dummy|sample|example)[._-]/i', $username)) {
            return [
                'valid' => false,
                'is_google' => $isGoogleDomain,
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
            ];
        }

        // Block if username is just repeated letters or numbers (e.g. "aaaaaa", "111111")
        if (preg_match('/^(.)\1+$/', $cleanUsername) || preg_match('/([a-z0-9])\1{2,}/', $cleanUsername)) {
            return [
                'valid' => false,
                'is_google' => $isGoogleDomain,
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
            ];
        }

        // Block random consonant smash with no vowels (e.g. "bcdfgh", "zxcvbn")
        $lettersOnly = preg_replace('/[^a-z]/', '', $cleanUsername);
        if (strlen($lettersOnly) >= 5 && ! preg_match('/[aeiouy]/', $lettersOnly)) {
            return [
                'valid' => false,
                'is_google' => $isGoogleDomain,
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
            ];
        }

        // Block 5 or more consecutive consonants (unpronounceable keyboard smash e.g. "wuyfehgwfdgh")
        if (preg_match('/[bcdfghjklmnpqrstvwxz]{5,}/i', $cleanUsername)) {
            return [
                'valid' => false,
                'is_google' => $isGoogleDomain,
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
            ];
        }

        // Block 4 or more consecutive vowels (e.g. "uoiea", "aaaa")
        if (preg_match('/[aeiou]{4,}/i', $cleanUsername)) {
            return [
                'valid' => false,
                'is_google' => $isGoogleDomain,
                'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
            ];
        }

        // Block obvious keyboard sequential mash
        $keyboardPatterns = [
            'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl',
            'qwer', 'wert', 'erty', 'rtyu', 'tyui', 'yuio', 'uiop',
            'zxcv', 'xcvb', 'cvbn', 'vbnm',
            'lkjh', 'kjhg', 'jhgf', 'hgfd', 'gfds', 'fdsa',
            'poiuy', 'oiuyt', 'iuytr', 'uytre', 'ytrew', 'trewq',
            '1234', '2345', '3456', '4567', '5678', '6789', '7890',
            '0987', '9876', '8765', '7654', '6543', '5432', '4321',
        ];
        foreach ($keyboardPatterns as $pat) {
            if (str_contains($cleanUsername, $pat)) {
                return [
                    'valid' => false,
                    'is_google' => $isGoogleDomain,
                    'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
                ];
            }
        }

        // Block extremely low vowel ratio in long usernames (keyboard mashing)
        if (strlen($lettersOnly) >= 8) {
            preg_match_all('/[aeiouy]/i', $lettersOnly, $vMatches);
            $vowelCount = count($vMatches[0] ?? []);
            if (($vowelCount / strlen($lettersOnly)) < 0.20) {
                return [
                    'valid' => false,
                    'is_google' => $isGoogleDomain,
                    'message' => 'Email នេះមិនមែនជា Email ពិតប្រាកដឡើយ មិនអាចផ្ញើលេខកូដ OTP បានទេ។ (Email is not real and cannot send code OTP).',
                ];
            }
        }

        // Check if domain is standard Google / Gmail
        $isGoogleDomain = in_array($domain, ['gmail.com', 'googlemail.com'], true);

        // Standard Google domains are known valid immediately without DNS latency
        if ($isGoogleDomain) {
            $hasMx = true;
        } else {
            // Check DNS MX record for real mail exchange server
            $hasMx = false;
            try {
                if (function_exists('checkdnsrr')) {
                    $hasMx = @checkdnsrr($domain, 'MX');
                } else {
                    $hasMx = true;
                }
            } catch (\Throwable $e) {
                Log::warning('DNS MX check failed for domain '.$domain.': '.$e->getMessage());
                // If DNS is unreachable in isolated environment, fallback to domain validation
                $hasMx = true;
            }
        }

        if (! $hasMx) {
            return [
                'valid' => false,
                'is_google' => false,
                'message' => "Domain '{$domain}' មិនមានម៉ាស៊ីនបម្រើ Email (Mail Server/MX) ពិតប្រាកដឡើយ។ Email នេះមិនពិតទេ។",
            ];
        }

        // Check if Google MX servers are used by this domain
        if (! $isGoogleDomain && function_exists('dns_get_record')) {
            try {
                $mxRecords = @dns_get_record($domain, DNS_MX);
                if (is_array($mxRecords)) {
                    foreach ($mxRecords as $rec) {
                        $target = strtolower($rec['target'] ?? '');
                        if (str_contains($target, 'google') || str_contains($target, 'googlemail') || str_contains($target, 'l.google.com')) {
                            $isGoogleDomain = true;
                            break;
                        }
                    }
                }
            } catch (\Throwable) {
                // Keep domain check result
            }
        }

        return [
            'valid' => true,
            'is_google' => $isGoogleDomain,
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
