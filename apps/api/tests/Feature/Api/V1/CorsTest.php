<?php

test('allows preflight from local spa origin', function () {
    $this->call('OPTIONS', '/api/v1/health', [], [], [],
        ['HTTP_ORIGIN' => 'http://localhost:3000', 'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET'])
        ->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
});
