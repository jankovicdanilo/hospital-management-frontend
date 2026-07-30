# Error responses

All backend failures follow one of two shapes:

### Business-rule / not-found errors

Status code indicates the category (404 not found, 409 conflict,
401 unauthorized, 400 validation, 502 upstream failure). Body:

{ "message": string, "errorCode": string }

### Field-level validation errors (FluentValidation, always 400)

{
"errorCode": "VALIDATION_FAILED",
"message": string,
"errors": { "<FieldName>": ["<message>", ...], ... }
}