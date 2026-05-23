# Smart Team Task Dashboard

A Next.js task dashboard app for teams with:

- user registration and login
- protected dashboard with task CRUD
- task insights (total/completed/pending/recent activity)
- forgot-password flow with OTP via EmailJS

## Tech Stack

- Next.js (App Router)
- React
- MongoDB + Mongoose
- Tailwind CSS
- EmailJS Node SDK (`@emailjs/nodejs`)

## Project Structure

```text
smart_team_task_dashboard/
	app/
		api/
			auth/
			delete/
			display/
			insert/
			insights/
			reset_password/
			search/
			update/
			users/
		dashboard/
		login/
		register/
		reset_password/
	lib/
	models/
```

## Environment Variables

Create a `.env.local` file in the project root.

```dotenv
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
```

Notes:

- `MONGODB_URI` is required.
- EmailJS keys are required for OTP email sending.
- `JWT_SECRET` is currently optional in this codebase because auth now uses `sessionStorage` + request headers (`x-user-id`, `x-user-email`) in `lib/auth.js`.

## Installation

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open:

`http://localhost:3000`

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Main Features

1. Authentication
- Register and login APIs under `app/api/auth/*`.
- Login stores user data in `sessionStorage` as `smart-team-user`.

2. Task Management
- Create task (`/api/insert`)
- Update task (`/api/update`)
- Delete task (`/api/delete`)
- Search/filter/list tasks (`/api/search`, `/api/display`)

3. Insights
- Dashboard cards are powered by `/api/insights`.
- Recent activity is stored in dedicated activity records.

4. Forgot Password (OTP)
- UI page: `/reset_password`
- API route: `/api/reset_password`
- OTP flow actions:
	- `send_otp`
	- `verify_otp`
	- `reset_password`
- OTP values are hashed and stored in `models/Otp.js`.

## Reset Password API (Quick Reference)

Endpoint:

`POST /api/reset_password`

Examples:

Send OTP:

```json
{
	"action": "send_otp",
	"email": "user@example.com"
}
```

Verify OTP:

```json
{
	"action": "verify_otp",
	"email": "user@example.com",
	"otp": "123456"
}
```

Reset password:

```json
{
	"action": "reset_password",
	"email": "user@example.com",
	"otp": "123456",
	"password": "NewPass@123",
	"confirm_password": "NewPass@123"
}
```

Password rule:

- At least 8 characters
- At least one uppercase letter
- At least one special character from `@#$%^`

## EmailJS Setup Checklist

If OTP sending fails, verify these settings in EmailJS Dashboard:

1. Service and template IDs are correct.
2. API access for non-browser environments is enabled.
3. Private key is configured when strict mode is enabled.
4. Connected email provider (for example Gmail) is reauthorized if needed.

## Troubleshooting

- `This email doesn't exist`
	- The email is not registered in your users collection.

- `Please request OTP first`
	- No active OTP record found for that email.

- `Invalid OTP`
	- OTP does not match the latest unused OTP record.

- Mongo connection errors
	- Recheck `MONGODB_URI` and network access in your MongoDB cluster settings.

## License

Private project / internal use.
