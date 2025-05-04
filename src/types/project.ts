// Rating interface for projects
export interface ProjectRating {
  average: number;
  count: number;
}

export interface Project {
  _id: string;
  title: string;
  slug?: string; // URL-friendly version of the title
  description: string;
  price: number;
  images: string[];
  technologies: string[];
  projectType: string;
  features: string[];
  category?: string; // Category for the project
  rating?: ProjectRating; // Aggregate rating information
  demoUrl?: string;
  githubUrl?: string;
  projectFile?: string; // Path to downloadable zip file
  paymentQrCode?: string; // Payment QR code image
  createdAt: Date;
  updatedAt: Date;
}

// User interface for populated fields
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Interface for purchase status
export interface Purchase {
  _id: string;
  projectId: string | Project; // Can be string ID or populated Project object
  userId: string | User; // Can be string ID or populated User object
  status: 'pending' | 'approved' | 'rejected';
  paymentProof: string;
  deliveryEmail: string; // Added email for project delivery
  feedback?: string;
  reviewedBy?: string | User; // Can be string ID or populated User object
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for review
export interface Review {
  _id: string;
  projectId: string | Project;
  userId: string | User;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}