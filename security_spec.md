# Security Specification: Cyber Dynamic Technologies Firestore Rules

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid == userId` or by an administrator. Users cannot escalate their own role to `admin`.
2. **Admin Privilege Invariant**: Admin privileges require existence of `/admins/{request.auth.uid}` or token matching verified administrative root user `opwataallan@gmail.com`.
3. **Order Ownership Invariant**: A customer order at `/orders/{orderId}` must reference the authenticated user (`incoming().userId == request.auth.uid` or matches verified email) upon creation. Orders can be read by the owner or an admin.
4. **Terminal Order State Locking**: Orders marked as `completed`, `delivered`, or `cancelled` cannot be altered by non-admin users.
5. **Review Integrity Invariant**: A product review at `/reviews/{reviewId}` must have `incoming().userId == request.auth.uid` and valid rating between 1 and 5.
6. **Store Ownership Invariant**: A vendor store document at `/stores/{storeId}` can only be updated by its verified `vendorId` or by an admin.
7. **Temporal Invariant**: Creation timestamps must match server request time (`incoming().createdAt == request.time`).
8. **Catch-all Default Deny**: Any unmatched paths are completely closed to all reads and writes.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Spoofed Admin Role Injection on User Profile Creation**
   - Payload: `{ "userId": "attacker123", "email": "attacker@evil.com", "role": "admin" }`
   - Target: `users/attacker123`
   - Expected: `PERMISSION_DENIED` (cannot self-assign admin role).

2. **Foreign User Profile Overwrite**
   - Payload: `{ "firstName": "Hacked", "userId": "victim_uid" }`
   - Target: `users/victim_uid` sent by `attacker_uid`
   - Expected: `PERMISSION_DENIED` (`request.auth.uid != victim_uid`).

3. **Ghost / Shadow Field Injection Attack**
   - Payload: `{ "userId": "user123", "firstName": "Alice", "lastName": "Doe", "role": "customer", "isMasterAdmin": true }`
   - Target: `users/user123`
   - Expected: `PERMISSION_DENIED` (`affectedKeys` / schema violation).

4. **Arbitrary Order Status Tampering to Completed**
   - Payload: `{ "status": "completed", "userId": "user123" }`
   - Target: `orders/ord_999` sent by non-admin customer
   - Expected: `PERMISSION_DENIED` (only admins can set terminal fulfillment states).

5. **Customer Order Hijack**
   - Payload: `{ "userId": "victim_uid", "total": 1000 }`
   - Target: `orders/ord_100` sent by `attacker_uid`
   - Expected: `PERMISSION_DENIED` (`userId` does not match auth UID).

6. **Order Modification After Cancellation**
   - Payload: `{ "total": 0, "status": "delivered" }`
   - Target: `orders/ord_cancelled_1`
   - Expected: `PERMISSION_DENIED` (terminal state locked).

7. **Review Rating Boundary Overflow**
   - Payload: `{ "productId": 101, "userId": "user123", "rating": 9999, "review": "Spam" }`
   - Target: `reviews/rev_1`
   - Expected: `PERMISSION_DENIED` (`rating` out of bounds 1..5).

8. **Review Impersonation**
   - Payload: `{ "productId": 101, "userId": "legit_buyer", "rating": 1, "review": "Fake review" }`
   - Target: `reviews/rev_2` sent by `attacker_uid`
   - Expected: `PERMISSION_DENIED` (`userId` mismatch).

9. **Store Front Impersonation / Takeover**
   - Payload: `{ "name": "Fake CDT", "vendorId": "victim_vendor" }`
   - Target: `stores/store_cdt` sent by `unauthorized_uid`
   - Expected: `PERMISSION_DENIED` (vendor ownership failure).

10. **ID Poisoning Attack (10KB Junk Path ID)**
    - Target: `users/AAAAAAAAAAAAAAAAAAAAAAAA[...1000 chars...]`
    - Expected: `PERMISSION_DENIED` (`isValidId` length & regex check).

11. **Client Timestamp Forgery**
    - Payload: `{ "createdAt": "1999-01-01T00:00:00Z" }`
    - Target: `orders/ord_past`
    - Expected: `PERMISSION_DENIED` (must equal `request.time`).

12. **Blanket Query Scraping on Customer Orders**
    - Query: `collection("orders")` without `where("userId", "==", auth.uid)`
    - Expected: `PERMISSION_DENIED` (Query Enforcer mandates resource filtering).
