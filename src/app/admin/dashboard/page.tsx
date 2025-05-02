import { Project } from '@/types/project';
import {
  DocumentIcon,
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';

async function getStats() {
  // Get the base URL for API calls
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Fetch projects
  let projects: Project[] = [];
  let totalProjects = 0;
  try {
    const projectsRes = await fetch(`${baseUrl}/api/projects`, { 
      cache: 'no-store'
    });
    if (projectsRes.ok) {
      projects = await projectsRes.json();
      totalProjects = projects.length;
      console.log('Projects fetched:', totalProjects);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
  
  // Fetch purchases (only count approved ones)
  let approvedPurchases = 0;
  try {
    const purchasesRes = await fetch(`${baseUrl}/api/purchases?status=approved`, {
      cache: 'no-store'
    });
    
    if (purchasesRes.ok) {
      const purchasesData = await purchasesRes.json();
      console.log('Purchases data:', purchasesData);
      if (purchasesData.success && Array.isArray(purchasesData.purchases)) {
        approvedPurchases = purchasesData.purchases.length;
      }
    }
  } catch (error) {
    console.error('Error fetching purchases:', error);
  }
  
  // Fetch reviews
  let totalReviews = 0;
  try {
    const reviewsRes = await fetch(`${baseUrl}/api/reviews`, {
      cache: 'no-store'
    });
    
    if (reviewsRes.ok) {
      const reviewsData = await reviewsRes.json();
      console.log('Reviews data:', reviewsData);
      if (reviewsData.success && Array.isArray(reviewsData.reviews)) {
        totalReviews = reviewsData.reviews.length;
      } else if (Array.isArray(reviewsData)) {
        // Handle case where API returns array directly
        totalReviews = reviewsData.length;
      }
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
  
  // Fetch users
  let totalUsers = 0;
  try {
    const usersRes = await fetch(`${baseUrl}/api/users`, {
      cache: 'no-store'
    });
    
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      console.log('Users data:', usersData);
      if (usersData.success && Array.isArray(usersData.users)) {
        totalUsers = usersData.users.length;
      } else if (Array.isArray(usersData)) {
        // Handle case where API returns array directly
        totalUsers = usersData.length;
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }

  return {
    totalProjects,
    approvedPurchases,
    totalReviews,
    totalUsers,
    recentProjects: projects.slice(0, 5),
  };
}

export default async function Dashboard() {
  const { 
    totalProjects, 
    approvedPurchases,
    totalReviews,
    totalUsers,
    recentProjects 
  } = await getStats();

  console.log('Dashboard Statistics:', {
    totalProjects, 
    approvedPurchases,
    totalReviews,
    totalUsers,
    projectCount: recentProjects?.length || 0
  });
  
  // Calculate performance metrics with safe calculations to avoid NaN
  const projectsPerUser = totalUsers > 0 ? (totalProjects / totalUsers).toFixed(1) : '0.0';
  const purchaseConversion = totalProjects > 0 ? ((approvedPurchases / totalProjects) * 100).toFixed(1) : '0.0';
  const reviewsPerProject = totalProjects > 0 ? (totalReviews / totalProjects).toFixed(1) : '0.0';
  const reviewsPerUser = totalUsers > 0 ? (totalReviews / totalUsers).toFixed(1) : '0.0';

  // Define stat cards
  const statCards = [
    {
      name: 'Total Projects',
      value: totalProjects,
      icon: DocumentIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Approved Purchases',
      value: approvedPurchases,
      icon: ShoppingCartIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Reviews',
      value: totalReviews,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-amber-500',
    },
    {
      name: 'Registered Users',
      value: totalUsers,
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100 dark:border-gray-700"
          >
            <dt>
              <div className={`absolute rounded-md ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Performance Overview</h2>
          <PresentationChartLineIcon className="h-5 w-5 text-indigo-500" />
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Projects Per User</h3>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {projectsPerUser}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Purchase Conversion</h3>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">
              {purchaseConversion}%
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Reviews Per Project</h3>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
              {reviewsPerProject}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Reviews Per User</h3>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {reviewsPerUser}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Projects</h2>
        <div className="space-y-4">
          {recentProjects.map((project) => (
            <div
              key={project._id}
              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{project.projectType}</p>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                ${project.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}