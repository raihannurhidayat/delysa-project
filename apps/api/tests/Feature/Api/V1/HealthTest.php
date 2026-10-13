<?php

test('returns ok from api v1 health', function () {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertExactJson(['status' => 'ok']);
});
