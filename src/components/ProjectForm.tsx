'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { Project } from '@/types/project';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// SEO generation response type
interface SeoGenerationResponse {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  socialMediaDescription: string;
}

interface ProjectFormProps {
  project?: Project;
  mode: 'create' | 'edit';
}

export default function ProjectForm({ project, mode }: ProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    price: project?.price || 0,
    technologies: project?.technologies?.length ? project.technologies : [''],
    projectType: project?.projectType || 'Web Application',
    features: project?.features?.length ? project.features : [''],
    demoUrl: project?.demoUrl || '',
    githubUrl: project?.githubUrl || '',
    category: project?.category || '',
    seoTitle: project?.title || '',
    seoDescription: project?.description || '',
    seoKeywords: '',
    socialMediaDescription: '',
    forSale: project?.forSale !== undefined ? project.forSale : true,
  });

  // SEO generation state
  const [isSeoGenerating, setIsSeoGenerating] = useState(false);
  const [seoData, setSeoData] = useState<SeoGenerationResponse | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [projectFileName, setProjectFileName] = useState<string>(project?.projectFile?.split('/').pop() || '');
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(project?.paymentQrCode ? `/${project.paymentQrCode}` : null);

  useEffect(() => {
    if (project?.images && project.images.length > 0) {
      const formattedImages = project.images.map(img => {
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img;
        }
        return img.startsWith('/') ? img : `/${img}`;
      });
      setPreviews(formattedImages);
    }
  }, [project]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);

    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeImage = (index: number) => {
    const updatedPreviews = [...previews];
    updatedPreviews.splice(index, 1);
    setPreviews(updatedPreviews);

    if (index < files.length) {
      const updatedFiles = [...files];
      updatedFiles.splice(index, 1);
      setFiles(updatedFiles);
    }
  };

  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setProjectFile(file);
      setProjectFileName(file.name);
    }
  };

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size exceeds 5MB limit');
        return;
      }
      setQrCodeFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setQrCodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        toast.error('Title is required');
        return;
      }

      if (!formData.description.trim()) {
        toast.error('Description is required');
        return;
      }

      // If SEO data is available, consider using it for title/description if not set manually
      if (!formData.seoTitle.trim() && formData.title.trim()) {
        formData.seoTitle = formData.title;
      }

      if (!formData.seoDescription.trim() && formData.description.trim()) {
        // Truncate description to 160 chars for SEO if needed
        formData.seoDescription = formData.description.length > 160 ?
          `${formData.description.substring(0, 157)}...` : formData.description;
      }

      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const filteredValues = value.filter(item => item.trim() !== '');
          formDataToSend.append(key, JSON.stringify(filteredValues.length > 0 ? filteredValues : ['']));
        } else {
          formDataToSend.append(key, value.toString());
        }
      });

      if (mode === 'edit') {
        formDataToSend.append('id', project?._id || '');
        const existingImages = project?.images || [];
        const keptImages = existingImages.filter((_, i) =>
          previews.includes(existingImages[i]) ||
          previews.includes(`/${existingImages[i]}`)
        );
        formDataToSend.append('existingImages', JSON.stringify(keptImages));
      }

      files.forEach(file => {
        formDataToSend.append('imageFiles', file);
      });

      if (projectFile) {
        formDataToSend.append('projectFile', projectFile);
      } else if (project?.projectFile) {
        formDataToSend.append('existingProjectFile', project.projectFile);
      }

      if (qrCodeFile) {
        formDataToSend.append('qrCodeFile', qrCodeFile);
      } else if (project?.paymentQrCode) {
        formDataToSend.append('existingQrCode', project.paymentQrCode);
      }

      const url = mode === 'create' ? '/api/projects' : `/api/projects`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to save project');
      }

      toast.success(mode === 'create' ? 'Project created!' : 'Project updated!');
      router.push('/admin/projects');
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save project';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleArrayInput(
    field: 'technologies' | 'features',
    index: number,
    value: string
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => (i === index ? value : item)),
    }));
  }

  function addArrayItem(field: 'technologies' | 'features') {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  }

  // SEO content generation function using Gemini AI
  async function generateSeoContent() {
    // Basic validation
    if (!formData.title || !formData.description) {
      toast.error('Please add a title and description first');
      return;
    }

    if (formData.technologies.some(tech => !tech.trim()) || formData.features.some(feature => !feature.trim())) {
      toast.error('Please fill in all technology and feature fields');
      return;
    }

    setIsSeoGenerating(true);

    try {
      const prompt = `
      You are an SEO expert specializing in technology and software projects. Generate professional, marketing-focused SEO content for the following project.
      Respond ONLY with a valid JSON object containing the requested fields.

      Project Title: ${formData.title}
      Project Description: ${formData.description}
      Project Type: ${formData.projectType}
      Technologies: ${formData.technologies.join(', ')}
      Features: ${formData.features.join(', ')}

      IMPORTANT INSTRUCTIONS:
      1. Create a title that is DIFFERENT from the original project title but captures its essence and includes high-value SEO keywords
      2. Write a description that is more marketing-focused than the original description
      3. Focus on benefits and unique selling points in the description
      4. Include relevant industry terms and technical keywords
      5. Make the social media description engaging and shareable

      The response must be a valid JSON object with the following structure and nothing else:
      {
        "title": "A professional, SEO-optimized title under 60 characters that is DIFFERENT from the original title",
        "description": "A marketing-focused meta description under 160 characters highlighting benefits and unique selling points",
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
        "category": "Best matching product category or industry vertical",
        "socialMediaDescription": "An engaging, shareable social media pitch under 200 characters"
      }
      `;

      const response = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          title: formData.title,
          description: formData.description,
          projectType: formData.projectType,
          technologies: formData.technologies.filter(t => t.trim()),
          features: formData.features.filter(f => f.trim()),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate SEO content');
      }

      if (result.success && result.data) {
        const seoContent = result.data as SeoGenerationResponse;
        setSeoData(seoContent);

        // Update form data with AI-generated SEO content
        setFormData(prev => ({
          ...prev,
          seoTitle: seoContent.title,
          seoDescription: seoContent.description,
          category: seoContent.category,
          seoKeywords: seoContent.keywords.join(', '),
          socialMediaDescription: seoContent.socialMediaDescription,
        }));

        toast.success('SEO content generated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating SEO content:', error);
      toast.error('Failed to generate SEO content. Please try again.');
    } finally {
      setIsSeoGenerating(false);
    }
  }

  function removeArrayItem(field: 'technologies' | 'features', index: number) {
    if (formData[field].length <= 1) {
      setFormData((prev) => ({
        ...prev,
        [field]: [''],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_: string, i: number) => i !== index),
      }));
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="space-y-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
        {/* Title */}
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900  rounded-xl">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-gray-50 transition-all duration-200 dark:bg-gray-900"
          />
        </div>

        {/* Description */}
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900  rounded-xl">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            required
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-gray-50 transition-all duration-200 dark:bg-gray-900"
          />
        </div>

        {/* Price, Project Type & For Sale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900">
          {/* Price */}
          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price ($)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 pl-8 border bg-gray-50 transition-all duration-200 dark:bg-gray-900"
              />
            </div>
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Type
            </label>
            <select
              id="projectType"
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-gray-50 transition-all duration-200 dark:bg-gray-900"
            >
              <option value="Web Application">Web Application</option>
              <option value="Mobile App">Mobile App</option>
              <option value="Desktop Application">Desktop Application</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* For Sale Toggle */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">For Sale</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Is this project available for purchase or just for showcase?
              </p>
            </div>
            <label htmlFor="forSale" className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="forSale"
                className="sr-only"
                checked={formData.forSale}
                onChange={(e) => setFormData({ ...formData, forSale: e.target.checked })}
              />
              <div
                onClick={() => setFormData({ ...formData, forSale: !formData.forSale })}
                className={`w-11 h-6 bg-gray-200 rounded-full dark:bg-gray-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${formData.forSale ? 'bg-indigo-600 dark:bg-indigo-500 after:translate-x-full after:border-white' : ''}`}
              ></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                {formData.forSale ? 'For Sale' : 'Showcase Only'}
              </span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Images</label>
          <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">Upload up to 10 images showcasing your project</p>

          <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-400' : 'border-gray-300 hover:border-indigo-400 bg-gray-50 dark:border-gray-400 dark:bg-gray-400'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isDragActive ? (
                <p className="text-indigo-600 font-medium">Drop images here</p>
              ) : (
                <>
                  <p className="text-gray-700 font-medium">Drag & drop images here</p>
                  <p className="text-gray-500 text-sm">or click to browse files</p>
                </>
              )}
            </div>
          </div>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 dark:bg-gray-900">
              {previews.map((preview, index) => (
                <motion.div
                  key={index}
                  className="relative group rounded-lg overflow-hidden shadow-sm dark:bg-gray-900"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="aspect-square w-full bg-gray-100 dark:bg-gray-900 relative">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                      }}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md dark:bg-red-400 dark:text-gray-900"
                    whileHover={{ scale: 1.1 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Technologies */}
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Technologies Used</label>
          <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">List the technologies used in this project</p>

          <div className="space-y-3">
            {formData.technologies.map((tech, index) => (
              <motion.div
                key={index}
                className="flex gap-2 items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <input
                  type="text"
                  value={tech}
                  onChange={(e) => handleArrayInput('technologies', index, e.target.value)}
                  placeholder="e.g., React, Node.js, MongoDB"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-gray-50 transition-all duration-200 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('technologies', index)}
                  disabled={formData.technologies.length === 1 && !tech}
                  className="rounded-lg p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:text-red-400 dark:bg-gray-900 dark:hover:bg-red-400 dark:border-gray-400 dark:hover:border-red-400 dark:shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </motion.div>
            ))}
            <motion.button
              type="button"
              onClick={() => addArrayItem('technologies')}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 dark:text-indigo-400 dark:hover:text-indigo-600 dark:bg-gray-900 dark:hover:bg-indigo-400 dark:border-gray-400 dark:hover:border-indigo-400 dark:shadow-md"
              whileHover={{ x: 2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Technology
            </motion.button>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key Features</label>
          <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">Highlight the main features of your project</p>

          <div className="space-y-3 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
            {formData.features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex gap-2 items-center dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayInput('features', index, e.target.value)}
                  placeholder="e.g., User authentication, Real-time updates"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-gray-50 transition-all duration-200 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('features', index)}
                  disabled={formData.features.length === 1 && !feature}
                  className="rounded-lg p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:text-red-400 dark:bg-gray-900 dark:hover:bg-red-400 dark:border-gray-400 dark:hover:border-red-400 dark:shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </motion.div>
            ))}
            <motion.button
              type="button"
              onClick={() => addArrayItem('features')}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 dark:text-indigo-400 dark:hover:text-indigo-600 dark:bg-gray-900 dark:hover:bg-indigo-400 dark:border-gray-400 dark:hover:border-indigo-400 dark:shadow-md"
              whileHover={{ x: 2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Feature
            </motion.button>
          </div>
        </div>

        {/* URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
          {/* Demo URL */}
          <div className="space-y-2 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
            <label htmlFor="demoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Demo URL
            </label>
            <input
              type="url"
              id="demoUrl"
              value={formData.demoUrl}
              onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
              placeholder="https://demo.example.com"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-gray-50 transition-all duration-200 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
            />
          </div>

          {/* GitHub URL */}
          <div className="space-y-2 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
            <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700">
              GitHub URL
            </label>
            <input
              type="url"
              id="githubUrl"
              value={formData.githubUrl}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              placeholder="https://github.com/username/repo"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-gray-50 transition-all duration-200 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
            />
          </div>
        </div>

        {/* SEO Section */}
        <div className="space-y-4 p-5 border border-indigo-100 rounded-xl bg-indigo-50 dark:bg-gray-900 dark:border-indigo-900">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-300 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                AI-powered SEO Optimization
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                Generate optimized SEO content for your project using Gemini AI
              </p>
            </div>
            <motion.button
              type="button"
              onClick={generateSeoContent}
              disabled={isSeoGenerating}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-indigo-800 dark:hover:bg-indigo-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSeoGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate SEO Content
                </>
              )}
            </motion.button>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-3">
            {/* SEO Title */}
            <div className="space-y-2">
              <label htmlFor="seoTitle" className="block text-sm font-medium text-indigo-800 dark:text-indigo-300">
                SEO Title
              </label>
              <input
                type="text"
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="Optimized title for search engines"
                className="block w-full rounded-lg border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-white transition-all duration-200 dark:bg-gray-800 dark:border-indigo-700 dark:text-gray-200"
              />
              {formData.seoTitle && (
                <p className={`text-xs mt-1 ${formData.seoTitle.length > 60 ? 'text-red-500' : 'text-green-600'}`}>
                  {formData.seoTitle.length}/60 characters {formData.seoTitle.length > 60 ? '(too long)' : ''}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Category
              </label>
              <input
                type="text"
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Product category"
                className="block w-full rounded-lg border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-white transition-all duration-200 dark:bg-gray-800 dark:border-indigo-700 dark:text-gray-200"
              />
            </div>

            {/* SEO Description */}
            <div className="space-y-2">
              <label htmlFor="seoDescription" className="block text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Meta Description
              </label>
              <textarea
                id="seoDescription"
                rows={3}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="Optimized description for search engines"
                className="block w-full rounded-lg border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-white transition-all duration-200 dark:bg-gray-800 dark:border-indigo-700 dark:text-gray-200"
              />
              {formData.seoDescription && (
                <p className={`text-xs mt-1 ${formData.seoDescription.length > 160 ? 'text-red-500' : 'text-green-600'}`}>
                  {formData.seoDescription.length}/160 characters {formData.seoDescription.length > 160 ? '(too long)' : ''}
                </p>
              )}
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <label htmlFor="seoKeywords" className="block text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Keywords
              </label>
              <input
                type="text"
                id="seoKeywords"
                value={formData.seoKeywords}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                placeholder="Comma-separated keywords"
                className="block w-full rounded-lg border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-white transition-all duration-200 dark:bg-gray-800 dark:border-indigo-700 dark:text-gray-200"
              />
            </div>

            {/* Social Media Description */}
            <div className="space-y-2">
              <label htmlFor="socialMediaDescription" className="block text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Social Media Description
              </label>
              <textarea
                id="socialMediaDescription"
                rows={2}
                value={formData.socialMediaDescription}
                onChange={(e) => setFormData({ ...formData, socialMediaDescription: e.target.value })}
                placeholder="Catchy description for social media"
                className="block w-full rounded-lg border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border bg-white transition-all duration-200 dark:bg-gray-800 dark:border-indigo-700 dark:text-gray-200"
              />
              {formData.socialMediaDescription && (
                <p className={`text-xs mt-1 ${formData.socialMediaDescription.length > 200 ? 'text-red-500' : 'text-green-600'}`}>
                  {formData.socialMediaDescription.length}/200 characters {formData.socialMediaDescription.length > 200 ? '(too long)' : ''}
                </p>
              )}
            </div>
          </div>
        </div>


        {/* QR Code Upload */}
        <div className="space-y-2 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300 ">
          <label className="block text-sm font-medium text-gray-700 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
            Payment QR Code
          </label>
          <p className="text-sm text-gray-500 mb-3 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
            Upload a QR code image for payment processing (max 5MB)
          </p>

          <motion.div
            whileHover={{ scale: 1.005 }}
            className="p-6 border-2 border-dashed rounded-xl bg-gray-50 transition-all duration-200 hover:border-indigo-400 border-gray-300 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
          >
            {qrCodePreview ? (
              <div className="flex flex-col items-center space-y-4 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
                <div className="relative w-48 h-48 bg-white p-4 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
                  <Image
                    src={qrCodePreview}
                    alt="Payment QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQrCodePreview(null);
                    setQrCodeFile(null);
                  }}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors duration-200 dark:text-red-400 dark:hover:text-red-600 dark:bg-gray-900 dark:hover:bg-red-400 dark:border-gray-400 dark:hover:border-red-400 dark:shadow-md "
                >
                  Remove QR code
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-3 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg  " className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-400 ">
                  <label htmlFor="qr-code-file" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none dark:text-indigo-400">
                    <span>Upload QR code</span>
                    <input
                      id="qr-code-file"
                      name="qr-code-file"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleQrCodeChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300">
        <motion.button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 px-6 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : mode === 'create' ? (
            'Create Project'
          ) : (
            'Update Project'
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}