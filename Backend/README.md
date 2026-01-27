# CampusFlow Backend API

A comprehensive Node.js/Express backend for the CampusFlow campus event management platform.

## Features

### 🔐 Authentication & Authorization
- Email/Password registration with OTP verification
- JWT-based authentication
- Role-based access control (Student, Organizer, Admin)
- Password reset functionality
- Secure session management

### 📅 Event Management
- Full CRUD operations for events
- Multi-step approval workflow (Draft → Pending → Approved/Rejected)
- Multi-club collaboration (joint events)
- Budget tracking and expense management
- PDF rulebook uploads
- Event status management

### 🏢 Resource Booking
- Time-slot based booking system
- **Automatic conflict detection**
- Approval workflows (auto-approve or manual)
- Booking history and management
- Real-time availability checking

### 👥 User Management
- Comprehensive user profiles
- Multi-club membership support
- Profile visibility controls (public/internal/private)
- Department and year tracking

### 📊 Analytics Dashboard
- Event participation trends
- Club engagement metrics
- Resource utilization statistics
- Budget reports with CSV/Excel export
- Leaderboards for gamification

### 💬 Real-Time Communication
- In-app chat (1-to-1 and group)
- Context-aware chat rooms (events, clubs)
- Socket.IO for real-time messaging
- Typing indicators
- Read receipts

### 🔔 Notifications
- Real-time push notifications
- Event approvals/rejections
- Booking confirmations
- Deadline reminders
- Email notifications

### 🎓 Certificates
- Auto-generate certificates (participation, winner, organizer)
- QR code generation for event passes
- Downloadable PDF certificates

### 💰 Sponsorship Management
- Sponsorship portal for events and clubs
- Track deliverables and commitments
- Approval workflow

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + bcrypt
- **Real-time:** Socket.IO
- **File Storage:** Cloudinary
- **Email:** Nodemailer with Brevo (Sendinblue)
- **Validation:** Zod
- **QR Codes:** qrcode library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository:**
\`\`\`bash
cd Backend
\`\`\`

2. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables:**
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration:
\`\`\`env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/campusflow

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email (Brevo/Sendinblue) - FREE 300 emails/day
EMAIL_FROM=noreply@campusflow.com
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-smtp-login
BREVO_SMTP_PASS=your-smtp-password

# Cloudinary - FREE 25 credits/month
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (Optional - for Socket.IO scaling)
REDIS_URL=redis://localhost:6379
\`\`\`

4. **Run in development mode:**
\`\`\`bash
npm run dev
\`\`\`

The server will start on `http://localhost:5000`

5. **Build for production:**
\`\`\`bash
npm run build
npm start
\`\`\`

## API Documentation

### Base URL
\`\`\`
http://localhost:5000/api
\`\`\`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/verify-otp` | Verify email OTP | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/logout` | Logout user | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |
| POST | `/auth/refresh-token` | Refresh access token | No |
| GET | `/auth/me` | Get current user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update profile | Yes |
| POST | `/users/profile/picture` | Upload profile picture | Yes |
| POST | `/users/clubs/join` | Join a club | Yes |
| POST | `/users/clubs/leave` | Leave a club | Yes |
| GET | `/users` | List all users | Yes |

### Event Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/events` | List all approved events | Yes | All |
| GET | `/events/:id` | Get event details | Yes | All |
| POST | `/events` | Create new event | Yes | Organizer/Admin |
| PUT | `/events/:id` | Update event | Yes | Organizer/Admin |
| DELETE | `/events/:id` | Delete event | Yes | Organizer/Admin |
| POST | `/events/:id/submit` | Submit for approval | Yes | Organizer |
| POST | `/events/:id/rulebook` | Upload rulebook | Yes | Organizer/Admin |
| GET | `/events/my/events` | Get my events | Yes | Organizer/Admin |
| GET | `/events/admin/pending` | Get pending events | Yes | Admin |
| POST | `/events/:id/approve` | Approve event | Yes | Admin |
| POST | `/events/:id/reject` | Reject event | Yes | Admin |
| POST | `/events/:id/request-changes` | Request changes | Yes | Admin |

### Resource & Booking Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/resources/resources` | List resources | Yes | All |
| GET | `/resources/resources/:id` | Get resource details | Yes | All |
| POST | `/resources/resources` | Create resource | Yes | Admin |
| PUT | `/resources/resources/:id` | Update resource | Yes | Admin |
| DELETE | `/resources/resources/:id` | Delete resource | Yes | Admin |
| POST | `/resources/bookings` | Create booking | Yes | All |
| GET | `/resources/bookings` | List all bookings | Yes | Admin |
| GET | `/resources/bookings/my` | Get my bookings | Yes | All |
| POST | `/resources/bookings/:id/approve` | Approve booking | Yes | Admin |
| POST | `/resources/bookings/:id/reject` | Reject booking | Yes | Admin |
| POST | `/resources/bookings/:id/cancel` | Cancel booking | Yes | All |
| POST | `/resources/bookings/check-availability` | Check availability | Yes | All |

### Registration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/registrations` | Register for event | Yes |
| GET | `/registrations/my` | Get my registrations | Yes |
| DELETE | `/registrations/:eventId` | Unregister from event | Yes |
| POST | `/registrations/checkin` | Check-in with QR | Yes |
| GET | `/registrations/event/:eventId` | Get event registrations | Yes |

### Notification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get notifications | Yes |
| GET | `/notifications/unread/count` | Get unread count | Yes |
| PUT | `/notifications/:id/read` | Mark as read | Yes |
| PUT | `/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/notifications/:id` | Delete notification | Yes |

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/chat/rooms` | Get chat rooms | Yes |
| POST | `/chat/rooms` | Create chat room | Yes |
| GET | `/chat/rooms/:roomId/messages` | Get messages | Yes |
| POST | `/chat/rooms/:roomId/messages` | Send message | Yes |
| PUT | `/chat/rooms/:roomId/read` | Mark messages as read | Yes |

### Analytics Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/analytics/events` | Event analytics | Yes | Admin |
| GET | `/analytics/clubs` | Club analytics | Yes | Admin |
| GET | `/analytics/resources` | Resource analytics | Yes | Admin |
| GET | `/analytics/budget` | Budget analytics | Yes | Admin |
| GET | `/analytics/leaderboard` | Leaderboard data | Yes | Admin |
| GET | `/analytics/export` | Export to CSV | Yes | Admin |

### Certificate Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/certificates/generate` | Generate certificate | Yes |
| GET | `/certificates/my` | Get my certificates | Yes |
| GET | `/certificates/:id` | Get certificate | Yes |
| GET | `/certificates/:id/download` | Download PDF | Yes |

### Sponsorship Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/sponsorships` | Create sponsorship | Yes | Organizer/Admin |
| GET | `/sponsorships` | List sponsorships | Yes | All |
| GET | `/sponsorships/:id` | Get sponsorship | Yes | All |
| PUT | `/sponsorships/:id` | Update sponsorship | Yes | Organizer/Admin |
| DELETE | `/sponsorships/:id` | Delete sponsorship | Yes | Organizer/Admin |
| POST | `/sponsorships/:id/approve` | Approve sponsorship | Yes | Admin |

## Database Schema

### Collections

1. **users** - User accounts with roles, clubs, profiles
2. **events** - Events with budget, status, joint-club support
3. **resources** - Rooms, halls, labs, equipment
4. **bookings** - Time-slot based resource bookings
5. **registrations** - Event registrations with QR codes
6. **notifications** - User notifications
7. **chatrooms** - Chat room definitions
8. **chatmessages** - Chat messages
9. **certificates** - Generated certificates
10. **sponsorships** - Sponsorship records

## Free Tier Deployment

### MongoDB Atlas (FREE)
- M0 Cluster: 512MB storage, shared RAM
- Sign up: https://www.mongodb.com/cloud/atlas/register

### Railway (FREE 500h/month)
- Deploy backend
- Environment variables management
- Sign up: https://railway.app

### Brevo Email (FREE 300 emails/day)
- SMTP for transactional emails
- Sign up: https://www.brevo.com

### Cloudinary (FREE 25 credits/month)
- Image and file storage
- Sign up: https://cloudinary.com

### Upstash Redis (FREE 10K commands/day)
- For Socket.IO scaling
- Sign up: https://upstash.com

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

\`\`\`
Backend/
├── src/
│   ├── config/          # Configuration files (database, socket)
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
