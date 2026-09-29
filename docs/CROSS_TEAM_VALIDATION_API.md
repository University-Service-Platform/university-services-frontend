# Group 5 — Cross-Team Identity, Account Status & Role Validation API Specification

## Executive Overview
This document specifies the official secure backend API endpoints provided by **Group 5 (University Identity and Directory)** to external service teams (**Group 6**, **Group 7**, and **Group 8**). 

To enforce security boundaries, external groups **MUST NOT** access the Group 5 database directly. All user identity validation, account status checks, and role authorization queries MUST be performed via these secure RESTful API endpoints.

---

## Architecture & Security Boundary
- **Base URL**: `/api/v1`
- **Authentication**: HTTP Bearer Token or Service API Key header (`Authorization: Bearer <token>` or `X-Service-Api-Key: <key>`).
- **Data Access**: Strictly restricted to non-sensitive identity metadata (User ID, Email, Account Status, User Roles, Department/Faculty/Service Unit assignment). Passwords, password hashes, secrets, and internal session tokens are **NEVER** returned.
- **Independent Backend Enforcement**: Backend APIs independently validate consuming service authorization, request parameters, user existence, and account status before returning authorization signals.

---

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/validate/{userId}` | Validate user identity, account status & roles | Yes (`Bearer` / `Service-Key`) |
| `POST` | `/api/v1/users/validate/roles` | Validate if user possesses specific required roles | Yes (`Bearer` / `Service-Key`) |
| `GET` | `/api/v1/users/account-status/{userId}` | Verify user account activation status (`ACTIVE`/`INACTIVE`) | Yes (`Bearer` / `Service-Key`) |

---

## Detailed Endpoint Specifications

### 1. Validate User Identity, Status & Roles
Validates whether a user exists, is active, and returns their assigned system roles and organizational unit scopes.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/users/validate/{userId}`
- **URL Parameters**:
  - `userId` (string, required): University user identifier (e.g. `USER-1001` or `student@kln.ac.lk`)

#### Headers
```http
Authorization: Bearer <service_token>
Content-Type: application/json
```

#### Successful Response (HTTP 200 OK)
```json
{
  "valid": true,
  "userId": "USER-1001",
  "email": "student@kln.ac.lk",
  "accountStatus": "ACTIVE",
  "isAccountActive": true,
  "roles": [
    "STUDENT"
  ],
  "departmentId": "DEPT-CS-01",
  "facultyId": "FSC-01"
}
```

#### Error Responses

##### 400 Bad Request (Invalid Request Parameters)
```json
{
  "error": "Bad Request",
  "message": "User ID is required for cross-team identity validation.",
  "status": 400
}
```

##### 401 Unauthorized (Missing/Invalid Consuming Service Token)
```json
{
  "error": "Unauthorized",
  "message": "Unauthenticated API access. Consuming service authentication credentials are invalid or missing.",
  "status": 401
}
```

##### 403 Forbidden (Inactive Account Access Attempt)
```json
{
  "valid": false,
  "userId": "USER-1002",
  "accountStatus": "INACTIVE",
  "isAccountActive": false,
  "roles": [
    "STUDENT"
  ],
  "error": "Forbidden",
  "message": "User account is currently INACTIVE. Access to university services is restricted.",
  "status": 403
}
```

##### 404 Not Found (User Does Not Exist)
```json
{
  "error": "Not Found",
  "message": "Target user identity record not found in university identity directory.",
  "status": 404
}
```

---

### 2. Validate User Role Requirements
Validates if a specific user holds one or more required system roles (`ADMIN`, `STAFF`, `STUDENT`, `DEAN`, `HOD`).

- **HTTP Method**: `POST`
- **Endpoint**: `/api/v1/users/validate/roles`
- **Request Body**:
```json
{
  "userId": "USER-1001",
  "requiredRoles": [
    "STAFF",
    "ADMIN"
  ]
}
```

#### Successful Response (HTTP 200 OK — Role Match Authorized)
```json
{
  "valid": true,
  "userId": "USER-1001",
  "accountStatus": "ACTIVE",
  "isAccountActive": true,
  "roles": [
    "ADMIN"
  ],
  "isRoleAuthorized": true
}
```

#### Error Response (HTTP 403 Forbidden — Role Match Failed)
```json
{
  "valid": false,
  "userId": "USER-1001",
  "accountStatus": "ACTIVE",
  "isAccountActive": true,
  "roles": [
    "STUDENT"
  ],
  "isRoleAuthorized": false,
  "error": "Forbidden",
  "message": "User does not possess the required role(s) [STAFF, ADMIN] for this service feature.",
  "status": 403
}
```

---

### 3. Verify Account Activation Status
Quick health and access validation endpoint for checking if an account status is `ACTIVE`.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/users/account-status/{userId}`

#### Successful Response (HTTP 200 OK)
```json
{
  "userId": "USER-1001",
  "accountStatus": "ACTIVE",
  "isInactive": false
}
```

---

## Status Code Reference

| Status Code | Meaning | Cause |
| :--- | :--- | :--- |
| `200 OK` | Success | Identity/role validation succeeded. |
| `400 Bad Request` | Invalid Input | Missing or malformed `userId` or payload parameters. |
| `401 Unauthorized` | Authentication Failed | Consuming service token/API key missing or invalid. |
| `403 Forbidden` | Authorization Failed | User account is `INACTIVE` or does not meet required roles. |
| `404 Not Found` | Resource Not Found | Target `userId` does not exist in identity directory. |
| `500 Internal Server Error` | System Failure | Backend integration error or database connection failure. |

---

## Data Model & Types Reference
- **AccountStatus**: `"ACTIVE"` \| `"INACTIVE"`
- **UserRole**: `"ADMIN"` \| `"STAFF"` \| `"STUDENT"` \| `"DEAN"` \| `"HOD"` \| `"GUEST"`

---

*Note: Group 5 frontend integration boundaries are implemented in `src/services/validationService.ts` and exported via `src/services/index.ts`.*
