<?php

test('returns product list shape matching openapi contract', function () {
    $this->getJson('/api/v1/products?search=mawar&category=buket&page=1')
        ->assertOk()
        ->assertExactJson(['data' => []]);
});
