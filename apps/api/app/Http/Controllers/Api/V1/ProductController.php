<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * List katalog (stub Fase 0: data kosong, query diterima dan diabaikan).
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => []]);
    }
}
