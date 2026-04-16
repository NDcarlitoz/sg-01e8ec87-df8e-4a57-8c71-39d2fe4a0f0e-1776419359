---
title: Add forgot password and reset password flow
status: in_progress
priority: high
type: feature
tags: [frontend, supabase, auth]
created_by: agent
created_at: 2026-04-16T21:57:00Z
position: 16
---

## Notes
Implement a complete password reset flow using Supabase auth:
- Public "Forgot Password" page where users can request a reset email by entering their email address.
- Public "Reset Password" page that users land on from the Supabase email link, allowing them to set a new password.
- Integrate with Supabase via authService so that all auth logic stays in one place.
- Make sure the flow is secure, shows clear success/error states, and works well on mobile.

## Checklist
- [ ] Extend `authService` with:
  - [ ] `requestPasswordReset(email: string)` using `supabase.auth.resetPasswordForEmail`
  - [ ] `updatePassword(newPassword: string)` using `supabase.auth.updateUser`
  - [ ] Use existing redirect URL helper so Supabase sends users back to `/reset-password`
- [ ] Create `src/pages/forgot-password.tsx`:
  - [ ] Simple card layout matching login/signup styling
  - [ ] Email input + submit button
  - [ ] Call `authService.requestPasswordReset`
  - [ ] Show toasts for success ("Check your email") and error cases
  - [ ] Link back to Login page
- [ ] Create `src/pages/reset-password.tsx`:
  - [ ] Explain that this page is reached from the email link
  - [ ] New password + confirm password fields with basic validation
  - [ ] Call `authService.updatePassword`
  - [ ] Handle expired/invalid link (no active session) with a clear error and link back to Forgot Password
  - [ ] On success, show toast and redirect to Login
- [ ] Update `src/pages/login.tsx` to add a "Forgot password?" link under the form
- [ ] Run type-check/build to ensure there are no TS/Next errors