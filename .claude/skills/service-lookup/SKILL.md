---
name: service-lookup
description: Use this skill when you need to interact with {service-name} backend (for fetching or updating).
---

# Service Lookup

## Steps

1. Identify the service name mentioned in the prompt (e.g. "patient-service").
2. Read `../references/{service-name}-contract.md` to get that service's
   endpoints and DTOs.
3. Apply the general conventions from the api-conventions skill
   (error shapes, success response shapes, shared apiErrors.ts)
   — these apply regardless of which service you're calling.
4. Implement the feature using the specific endpoints/DTOs from step 2
   and the general conventions from step 3.