LINE BOARD PRO — SETUP

WHAT THIS VERSION DOES
- Professional responsive PPC interface for desktop + mobile browser.
- Username/password login.
- Aman132 / Aman@1324 is the initial Admin.
- Admin can create/edit/delete users and assign Admin/Supervisor/Operator/QC.
- New users can self-register; they start as Operator.
- Batch flow: Casting -> EPIC Cutting -> Manual Cutting -> SFG Stock 2 -> Charge Ready -> HOMO 1 -> HOMO 2 -> Cooling -> Completed -> Dispatch.
- Hold/Release, search, filters, dashboard.
- Google Sheet backend included.

REAL GOOGLE SHEET LIVE SYNC
1. Create a Google Sheet.
2. Open Extensions -> Apps Script.
3. Paste backend.gs.
4. Deploy -> New deployment -> Web app.
5. Execute as: Me.
6. Who has access: Anyone (or your Workspace domain if available).
7. Copy the /exec URL.
8. Open the app -> Google Sheet.
9. Paste the Google Sheet URL and Apps Script Web App URL.
10. Save Connection.
11. Use Sync Now.

SECURITY NOTE
This starter backend stores passwords in the Sheet for simplicity. Do NOT use it for sensitive production credentials without adding proper Google Workspace authentication/OAuth and hashed passwords. For a company deployment, the next step should be Firebase/Supabase/Google Workspace authentication.

HOW TO RUN
- Open index.html in a modern browser.
- For mobile, host the folder online; then add it to the phone home screen.
- For desktop, open the hosted URL in Chrome/Edge.

The app works in local mode even before the Google backend is configured.

TIMING: Every stage automatically records start/end time and duration. Batch Details shows the full timing table and total process time.

CUSTOMERS: Admin can add customer/company names and requirements. Each batch can be assigned a customer, target date/time and customer requirement. Dashboard and Batch Details show On Track, Target Met, Overdue/Late status.

SECURITY HARDENING
- Cloud passwords are salted and iteratively hashed server-side; plaintext passwords are not returned.
- Protected cloud API actions require server-side session tokens.
- Sessions expire after 30 minutes of inactivity.
- Admin permissions are checked server-side.
- New registrations are forced to Operator.
- Main Admin cannot be deleted or demoted.
- Cloud mode keeps the session token in sessionStorage, not the cloud password.
- For production, restrict the Apps Script deployment to your Google Workspace/domain and use Google OAuth/SSO.
- Local Demo mode is not suitable for confidential company data.

STOCK MODULES
- Added SFG Stock, FG Stock and Current HOMO Details sections.
- Added Production Summary based on the supplied spreadsheet layout.
- Added edit/delete for stock and HOMO records.
- Added stock data to the dashboard.
- Cloud backend now creates SFG_Stock, FG_Stock, HOMO_Details and Production_Summary tabs.

HOMO TIMING
- Current HOMO Details now includes In Time, Out Time and calculated Duration.
- New HOMO records default In Time to the current time.
- When status is set to Completed, Out Time is automatically filled if empty.
- Out Time cannot be earlier than In Time.
- Google Sheet HOMO_Details receives the In Time and Out Time columns.

HOMO IN/OUT TIME FIX
- HOMO Details table visibly shows HOMO IN TIME, HOMO OUT TIME and HOMO DURATION.
- Add/Edit HOMO form contains dedicated HOMO In Time and HOMO Out Time fields.
- New HOMO records start with the current time as In Time.
- Completed HOMO records auto-fill Out Time when left blank.
- Timing is stored in the Google Sheet HOMO_Details tab.

HOMO AM/PM + EDITABLE DURATION
- HOMO In Time and HOMO Out Time now use an explicit AM/PM display.
- Example: 2026-08-30 09:15 AM / 2026-08-30 05:30 PM.
- HOMO Duration is an editable field; if left blank, it is calculated automatically.
- Google Sheet HOMO_Details now includes an editable Duration column.


FINAL FIXES + TWO-STEP VERIFICATION
- Fixed New Batch form: target date/time and customer requirement fields are now present, so Create Batch works without missing-element errors.
- Fixed cloud persistence for batch creation, stage changes, edits and deletes.
- Batch stage timings are stored in the cloud Batches sheet as JSON.
- Added server-side TOTP two-step verification (Authenticator app).
- Login: password -> 6-digit authenticator code when 2FA is enabled.
- 2FA setup is confirmed with a real TOTP code before enabling.
- 2FA login challenges expire after 5 minutes and are limited to 5 attempts.
- TOTP accepts a small clock-drift window.
- Disable 2FA requires the current authenticator code.
- Users sheet gains twofaEnabled/twofaSecret columns.
- Existing accounts keep working until 2FA is enabled.
- For production, deploy Apps Script as restricted as your company Google Workspace permits; do not expose confidential sheets through a public endpoint.

NEW USER MOBILE NUMBER
- Mobile number is required for every NEW user registration.
- Admin can add/edit a user's mobile number in User Management.
- Main Admin Aman132 is not required to provide a mobile number.
- Mobile number is stored in the Users Google Sheet and returned only as account profile data.
- New users remain Operator by default.
- This mobile number field is for user contact/account information; SMS verification is not enabled by this change.

WORKING BUILD FIX
- Fixed the JavaScript syntax error that caused the app not to open.
- Revalidated the browser JavaScript before packaging.
- Preserved New Batch, HOMO timing, stock, customer, user, Google Sheet and 2FA modules.
- Mobile number is required for new non-admin users; the main Admin account is exempt.

2FA REMOVED COMPLETELY: login is username + password only; no authenticator/OTP step or 2FA settings are shown.

WORKING LOGIN FIX
- The app now works in Local mode without requiring an Apps Script URL.
- Demo Admin login: Aman132 / Aman@1324.
- Secure Cloud mode remains available after entering the Apps Script Web App URL.
- Repaired the backend login function so Secure Cloud deployment has a valid login function.
- Two-step verification is not part of the login flow.

LOGIN FIX: The missing login() function was restored. Local Demo login works without Apps Script. Username: Aman132 | Password: Aman@1324 | No 2FA.

CASTING PLAN
- Added a dedicated Casting Plan module to the main navigation.
- Supports Furnace 1 and Furnace 2.
- Fields: Plan Date, Charge No, Diameter, In Time, Out Time, Internal Code, Batch No.
- Add, edit and delete are supported.
- Casting plans are stored locally with the app in Local Demo mode.
- The design is intentionally styled as an internal production-control application rather than a generic AI dashboard.
