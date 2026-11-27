<?php

use App\Models\Product;
use Database\Seeders\ProductSeeder;

test('returns product list shape matching openapi contract with real filters', function () {
    $this->seed(ProductSeeder::class);

    $this->getJson('/api/v1/products?search=mawar&category=Mawar&page=1')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'slug', 'name', 'price', 'stock', 'category', 'imageUrl', 'isActive'],
            ],
            'items',
            'total',
            'page',
            'counts',
        ]);

    $response = $this->getJson('/api/v1/products?category=Wisuda');
    $response->assertOk();
    expect($response->json('total'))->toBeGreaterThan(0);
    foreach ($response->json('items') as $item) {
        expect($item['category'])->toBe('Wisuda');
    }
});

test('returns product detail by slug and 404 when missing', function () {
    $this->seed(ProductSeeder::class);

    $this->getJson('/api/v1/products/single-sunflower-mentari-wisuda')
        ->assertOk()
        ->assertJsonPath('slug', 'single-sunflower-mentari-wisuda')
        ->assertJsonStructure(['gallery', 'description', 'care', 'specs', 'sizes', 'wraps']);

    $this->getJson('/api/v1/products/slug-yang-tidak-ada')
        ->assertNotFound()
        ->assertJsonPath('code', 'PRODUCT_NOT_FOUND');
});

test('hides unpublished products from public catalog', function () {
    Product::query()->create([
        'sku' => 'DF-DRAFT-001',
        'slug' => 'buket-draft-internal',
        'name' => 'Buket Draft Internal',
        'category' => 'Wisuda',
        'price' => 120000,
        'stock' => 5,
        'is_published' => false,
    ]);

    $this->getJson('/api/v1/products/buket-draft-internal')->assertNotFound();
});
