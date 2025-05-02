# Project Showcase

A full-stack application for showcasing and selling your projects. Built with Next.js, MongoDB, and NextAuth.

## Features

- 🎨 Modern and responsive design
- 🔐 User authentication with NextAuth
- 👑 Admin dashboard for project management
- 📱 Project showcase with detailed views
- 🔍 Project filtering and search
- 💰 Project pricing and details
- 📊 Admin statistics and insights

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **UI Components**: Headless UI
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd project-showcase
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
MONGODB_URI=your-mongodb-uri
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
project-showcase/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   └── projects/       # Project pages
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   ├── models/             # MongoDB models
│   ├── providers/          # React context providers
│   └── types/             # TypeScript types
├── public/                # Static files
└── package.json          # Project dependencies
```

## Features

### Authentication
- User sign up and sign in
- Protected admin routes
- Role-based authorization

### Project Management
- Create, edit, and delete projects
- Upload project images
- Set project details and pricing
- Add technologies and features

### Admin Dashboard
- Project statistics
- Recent projects
- Project type distribution
- Total value tracking

### Project Showcase
- Responsive grid layout
- Detailed project views
- Technology tags
- Project features list
- Demo and GitHub links

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
