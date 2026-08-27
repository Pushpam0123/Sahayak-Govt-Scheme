"""Shared pytest configuration for the API test suite.

``api.config.Settings`` reads its secrets via ``os.getenv`` in the class body, so
they are bound the first time ``api.config`` is imported. ``validate_security_configuration``
then refuses to start the app when ``ADMIN_TOKEN`` or ``JWT_SECRET`` is empty.

That check is deliberate and must not be relaxed for tests. Instead we supply
non-empty test-only values here, before pytest imports any test module (and
therefore before anything imports ``api.config``). ``setdefault`` is used so a
real environment always wins over these placeholders.
"""

import os

os.environ.setdefault("ADMIN_TOKEN", "test-admin-token-not-for-production")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-not-for-production")
