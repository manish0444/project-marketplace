// Deployment script for project-showcase
// This script helps prepare the application for production deployment

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}=== Project Showcase Deployment Script ===${colors.reset}`);

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), '.env.local');
const envProductionPath = path.join(process.cwd(), '.env.production');

if (!fs.existsSync(envLocalPath)) {
  console.error(`${colors.red}Error: .env.local file not found. Please create it first.${colors.reset}`);
  process.exit(1);
}

// Create .env.production from .env.local
console.log(`${colors.blue}Creating .env.production file...${colors.reset}`);
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

// Replace development-specific values with production values
let envProductionContent = envLocalContent
  .replace(/NEXT_PUBLIC_APP_URL=http:\/\/localhost:3000/g, 'NEXT_PUBLIC_APP_URL=https://marketplace.krishendra.com.np')
  .replace(/NEXTAUTH_URL=http:\/\/localhost:3000/g, 'NEXTAUTH_URL=https://marketplace.krishendra.com.np');

// Write to .env.production
fs.writeFileSync(envProductionPath, envProductionContent);
console.log(`${colors.green}✓ Created .env.production${colors.reset}`);

// Run the slug generation script
console.log(`${colors.blue}Generating slugs for existing projects...${colors.reset}`);
try {
  execSync('node scripts/generate-slugs.js', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Slugs generated successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error generating slugs: ${error.message}${colors.reset}`);
}

// Build the application
console.log(`${colors.blue}Building the application...${colors.reset}`);
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Build completed successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error building the application: ${error.message}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.cyan}=== Deployment Preparation Complete ===${colors.reset}`);
console.log(`
${colors.yellow}Next steps:${colors.reset}
1. Upload the built application to your hosting provider
2. Set the following environment variables on your hosting provider:
   - MONGODB_URI
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL=https://marketplace.krishendra.com.np
   - NEXT_PUBLIC_APP_URL=https://marketplace.krishendra.com.np
   - CLOUDINARY_CLOUD_NAME=${process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name'}
   - CLOUDINARY_API_KEY=${process.env.CLOUDINARY_API_KEY || 'your-api-key'}
   - CLOUDINARY_API_SECRET=${process.env.CLOUDINARY_API_SECRET || 'your-api-secret'}
   - GEMINI_API_KEY=${process.env.GEMINI_API_KEY || 'your-gemini-api-key'}
`);
