<?php

namespace Tests\Feature;

use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(AdminUserSeeder::class);
    }

    /**
     * Test that registering with a fake / invalid domain fails.
     */
    public function test_cannot_register_with_fake_email_domain(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Fake User',
            'email' => 'fakeuser123987@nonexistentinvaliddomain999888.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message']);
    }

    /**
     * Test that registering an admin account is strictly blocked.
     */
    public function test_cannot_register_admin_account(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'AdminStore',
            'email' => 'admin_new@clothingshop.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test that admin login rejects non-admin users.
     */
    public function test_admin_login_rejects_customer_user(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email' => 'dara@example.com',
            'password' => 'Test@1234',
            'role' => 'admin',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test that admin can login successfully with admin credentials.
     */
    public function test_admin_can_login_via_admin_mode(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email' => 'AdminStore',
            'password' => 'store168',
            'role' => 'admin',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.role', 'admin');
    }

    /**
     * Test email validation endpoint for real and fake emails.
     */
    public function test_email_validation_endpoint(): void
    {
        $fakeCheck = $this->postJson('/api/v1/auth/validate-email', [
            'email' => 'user@fakeinvaliddomain999000.com',
        ]);
        $fakeCheck->assertStatus(422);

        $realCheck = $this->postJson('/api/v1/auth/validate-email', [
            'email' => 'support@gmail.com',
        ]);
        $realCheck->assertStatus(200)
            ->assertJson(['valid' => true, 'is_google' => true]);
    }

    /**
     * Test Google auth endpoint with real verified email.
     */
    public function test_google_auth_endpoint(): void
    {
        $response = $this->postJson('/api/v1/auth/google', [
            'email' => 'testuser.real@gmail.com',
            'name' => 'Real Google User',
            'google_id' => '123456789012345678901',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }
}
