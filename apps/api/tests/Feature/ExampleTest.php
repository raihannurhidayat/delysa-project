<?php

test('returns api identifier from web root', function () {
    $this->get('/')
        ->assertOk()
        ->assertExactJson(['service' => 'delysa-api']);
});
