"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/types/project';
import { useState, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Enhanced motion values for advanced effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const cardScale = useMotionValue(1);
  const backgroundOpacity = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.25), transparent 80%)`;
  const shadowEffect = useMotionTemplate`0 10px 30px -5px rgba(79, 70, 229, ${backgroundOpacity})`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    mouseX.set(x);
    mouseY.set(y);
    
    const centerX = width / 2;
    const centerY = height / 2;
    rotateX.set((y - centerY) / 25);
    rotateY.set(-(x - centerX) / 25);
  };

  const getImageSrc = (path: string | undefined): string => {
    if (!path) return '/images/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return path.startsWith('/') ? path : `/${path}`;
  };

  return (
    <motion.div 
      ref={cardRef}
      data-project-type={project.projectType}
      className="group relative h-full overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover="hover"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovered(true);
        animate(cardScale, 1.03, { duration: 0.3 });
        animate(backgroundOpacity, 0.2, { duration: 0.4 });
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        animate(cardScale, 1, { duration: 0.3 });
        animate(backgroundOpacity, 0, { duration: 0.4 });
        animate(rotateX, 0, { duration: 0.5 });
        animate(rotateY, 0, { duration: 0.5 });
      }}
      style={{ 
        transformStyle: 'preserve-3d',
        scale: cardScale,
        boxShadow: shadowEffect
      }}
    >
      {/* Clickable overlay for entire card */}
      <Link 
        href={`/projects/${project.slug || project._id}`} 
        className="absolute inset-0 z-10" 
        aria-label={`View ${project.title} project`}
      />
      
      {/* Animated gradient overlay */}
      <motion.div 
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />
      
      {/* Glass morphic overlay */}
      <div className="absolute inset-0 bg-white/5 dark:bg-black/5 backdrop-blur-[1px] rounded-2xl" />
      
      {/* 3D tilt container */}
      <motion.div
        className="h-full w-full"
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1200,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Image section with reduced height */}
        <div className="relative h-44 overflow-hidden rounded-t-2xl">
          {project.images?.[0] && !imageError ? (
            <>
              <motion.div
                className="absolute inset-0 z-0"
                initial={{ scale: 1 }}
                animate={{ scale: isHovered ? 1.08 : 1 }}
                transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
              >
                <Image
                  src={getImageSrc(project.images[0])}
                  alt={project.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
              
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: isHovered ? 0.5 : 0.3 }}
              />
              
           
              <motion.div 
                className="absolute top-4 left-4 flex flex-wrap gap-2"
                initial={{ y: 10, opacity: 0.8 }}
                animate={{ y: isHovered ? 0 : 10, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.span 
                  className="rounded-full bg-indigo-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm shadow-md"
                  whileHover={{ scale: 1.05 }}
                >
                  {project.projectType || 'Project'}
                </motion.span>
                
              </motion.div>
              <motion.div 
            className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {project.technologies?.slice(0, 2).map((tech, i) => (
              <motion.span
                key={`${tech}-${i}`}
                className="inline-flex items-center rounded-full bg-gray-100/80 dark:bg-gray-800/80 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200 backdrop-blur-sm transition-all duration-200 hover:bg-indigo-600 hover:text-white border border-gray-200 dark:border-gray-700"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 3px 10px rgba(99, 102, 241, 0.3)'
                }}  
                transition={{ type: "spring", stiffness: 400 }}
              >
                {tech}
              </motion.span>
            ))}
            {project.technologies && project.technologies.length > 2 && (
              <span className="inline-flex items-center rounded-full bg-gray-200/80 dark:bg-gray-700/80 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                +{project.technologies.length - 2}
              </span>
            )}
          </motion.div>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <span className="text-sm text-gray-400">No image available</span>
            </div>
          )}
        </div>
        
        {/* Content section */}
        <div className="relative z-10 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <motion.h3 
                className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {project.title}
              </motion.h3>
              
              <motion.p
                className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {project.description}
              </motion.p>
            </div>
            
            {/* price badge */}
            {project.price && (
              <motion.span
                className="inline-flex items-center rounded-full bg-green-300 dark:bg-green-600 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Rs.{project.price}
              </motion.span>
            )}
          </div>
          
          {/* Primary CTA button (appears on hover) - floating design */}
          <motion.div
            className="absolute -top-4 right-4 z-20"
            initial={{ y: 15, opacity: 0, scale: 0.9 }}
            animate={{ 
              y: isHovered ? 0 : 15, 
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.9
            }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Link 
              href={`/projects/${project._id}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-lg transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              aria-label={`Quick view ${project.title}`}
              onClick={(e) => e.stopPropagation()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </Link>
          </motion.div>
        </div>
        
        {/* Subtle border highlight on hover */}
        <motion.div 
          className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-transparent"
          animate={{ 
            borderColor: isHovered ? 'rgba(99, 102, 241, 0.3)' : 'transparent'
          }}
        />
      </motion.div>
    </motion.div>
  );
}