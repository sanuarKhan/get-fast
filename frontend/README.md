# GetFast - Courier Management System

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` file:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

3. Run development server:

```bash
pnpm dev
```

## Build for Production

```bash
pnpm build
```

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## User Roles

### Customer

- Register/Login
- Book parcels
- Track parcels in real-time
- View booking history
- Receive email notifications

### Delivery Agent

- View assigned parcels
- Update parcel status
- Scan QR codes
- Update location

### Admin

- View dashboard statistics
- Manage all parcels
- Assign agents to parcels
- Export reports (CSV/PDF)
- View all users
