# GetFast - Courier Management System

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/courier-system
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Courier System <noreply@courier.com>
```

3. Start MongoDB:

```bash
mongod
```

4. Run development server:

```bash
pnpm dev
```

## API Endpoints

### Auth

- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update profile

### Parcels (Customer)

- POST `/api/parcels/book` - Book parcel
- GET `/api/parcels/my-bookings` - Get my bookings
- GET `/api/parcels/:id` - Get parcel details

### Parcels (Admin)

- GET `/api/parcels` - Get all parcels
- GET `/api/parcels/stats/dashboard` - Get dashboard stats
- PUT `/api/parcels/:id/assign` - Assign agent

### Parcels (Agent)

- GET `/api/parcels/agent/assigned` - Get assigned parcels
- PUT `/api/parcels/:id/status` - Update parcel status
- PATCH `/api/parcels/agent/location` - Update agent location

### Admin

- GET `/api/admin/users` - Get all users

### Reports

- GET `/api/reports/export/csv` - Export CSV
- GET `/api/reports/export/pdf` - Export PDF
- GET `/api/reports/agent-performance` - Agent performance

## Deployment

### Railway / Render

1. Push code to GitHub
2. Connect repository
3. Add environment variables
4. Deploy
