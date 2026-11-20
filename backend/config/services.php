<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'bakong' => [
        'api_url' => env('BAKONG_API_URL', 'https://api-bakong.nbc.gov.kh'),
        'account_id' => env('BAKONG_ACCOUNT_ID', 'huonneng_nim@bkrt'),
        'merchant_name' => env('BAKONG_MERCHANT_NAME', 'Huonneng Nim'),
        'token' => env('BAKONG_TOKEN', env('BAKONG_API_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiN2UxODg5OWZkMzA5NDM2MiJ9LCJpYXQiOjE3OTI1NzgyODQsImV4cCI6MTgwMDM1NDI4NH0.rxrik-U21yWij0k5XmzkzeEJP8srNh8wzPYPQGS6_IM')),
    ],

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN', '8914044934:AAHYn5I5loQlw7L0CQv-TNbU5I8GdIkq2w8'),
        'chat_id' => env('TELEGRAM_CHAT_ID', '8039165243'),
        'bot_username' => env('TELEGRAM_BOT_USERNAME', 'ClothingOnlineShop_bot'),
    ],

];
