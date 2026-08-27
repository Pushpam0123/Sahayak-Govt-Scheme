"""Shared pytest configuration for the API test suite.

``api.config.Settings`` reads its secrets via ``os.getenv`` in the class body, so
they are bound the first time ``api.config`` is imported.
``validate_security_configuration`` then refuses to start the app when
``ADMIN_TOKEN`` or ``JWT_SECRET`` is empty.

That check is deliberate and must not be relaxed for tests. Instead we supply
non-empty test-only values here, before pytest imports any test module (and
therefore before anything imports ``api.config``). ``setdefault`` is used so a
real environment always wins over these placeholders.
"""

import os

os.environ.setdefault("ADMIN_TOKEN", "test-admin-token-not-for-production")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-not-for-production")

# F-4 moved rate limiting into Redis, so a bucket now outlives the process that
# created it. With the production limit of 60/minute the whole suite shares one
# IP-keyed bucket and unrelated tests start returning 429 once the suite grows
# past it — and stay failing on reruns inside the same window. Rate limiting is
# still exercised directly in test_rate_limiter.py, which builds its own
# middleware with an explicit low limit.
os.environ.setdefault("RATE_LIMIT_REQUESTS", "100000")
