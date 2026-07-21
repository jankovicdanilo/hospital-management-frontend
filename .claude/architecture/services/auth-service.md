### POST /api/auth/login

Request body:
```
{ username: string, password: string }
```

Success (200):
```

{ username: string, email: string, role: string, token: string }
```

Failure (401):
```
{ message: string, errorCode: string }