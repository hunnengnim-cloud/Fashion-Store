<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('avatar');
            $table->date('date_of_birth')->nullable()->after('gender');
            $table->boolean('is_active')->default(true)->after('date_of_birth');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('preferred_language', 5)->default('en')->after('last_login_at');
            $table->string('preferred_currency', 3)->default('USD')->after('preferred_language');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'avatar', 'gender', 'date_of_birth',
                'is_active', 'last_login_at', 'preferred_language',
                'preferred_currency',
            ]);
            $table->dropSoftDeletes();
        });
    }
};
