<?php

test('returns the xsrf cookie for the spa', function () {
    $this->withHeaders(spaHeaders())
        ->get('/sanctum/csrf-cookie')
        ->assertNoContent()
        ->assertCookie('XSRF-TOKEN');
});
