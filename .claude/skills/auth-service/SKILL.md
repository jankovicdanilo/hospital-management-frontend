---
name: auth-service
description: Use this skill when building or modifying any frontend feature that calls the Auth service — login, registration, current user, or user management endpoints.
---

# Auth Service

### POST /api/auth/login

Request body:
{ username: string, password: string }

Success (200):
{ username: string, email: string, role: string, token: string }

Failure (401):
{ message: string, errorCode: string }