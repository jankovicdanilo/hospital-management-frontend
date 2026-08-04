---
name: service-lookup
description: Use this skill when you need to interact with {service-name} backend (for fetching or updating).
---

# Service Lookup

## Steps

1. Identify the service name mentioned in the prompt (e.g. "patient-service").
2. Read `../references/{service-name}-contract.md` to get that
      service's endpoints and DTOs.
3. Implement the feature using those endpoints/DTOs, following the
   general API conventions already provided in the prompt.

## Fallback

If no reference file exists for the named service, do not guess at
endpoints or DTOs. Stop and ask which contract file to create, or
whether the actual backend controller/service code should be read
directly to derive the contract.