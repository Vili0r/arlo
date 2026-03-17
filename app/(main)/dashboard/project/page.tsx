"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations';
import Image from 'next/image';
import { createProject } from './actions';

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      platform: 'REACT_NATIVE',
    },
    mode: 'onChange',
  });

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, SVG, or WebP)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB');
      return;
    }

    setError('');
    setIconFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setIconPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setValue('iconUrl', undefined, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CreateProjectInput) => {
    setError('');

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("platform", data.platform);
      if (iconFile) formData.append("icon", iconFile);

      const project = await createProject(formData);
      router.push(`/dashboard/project/${project.id}`);
    } catch (err: any) {
      setIsUploading(false);
      console.error('Error creating project:', err);
      setError(err.message || 'Something went wrong');
    }
  };

  const isLoading = isSubmitting || isUploading;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-8">
      <div className="flex flex-col gap-1 text-center">
        <div className="mx-auto w-12 h-12 bg-white/[0.05] border border-white/[0.1] rounded-2xl flex items-center justify-center mb-2">
          <Rocket size={24} className="text-white/80" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Let&apos;s build something new.</h1>
        <p className="text-sm text-white/50">
          Create a new project to start managing your flows.
        </p>
      </div>

      <div className="border border-white/[0.08] bg-white/[0.02] rounded-xl p-6 mt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* Icon Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">App Icon <span className="text-white/30 font-normal">(optional)</span></label>
            <div className="flex items-center gap-4">
              {iconPreview ? (
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/[0.1] bg-white/[0.04]">
                    <Image
                      src={iconPreview}
                      alt="App icon preview"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeIcon}
                    disabled={isLoading}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-16 h-16 rounded-2xl border border-dashed border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.25] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImageIcon size={20} className="text-white/30" />
                </button>
              )}

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors disabled:opacity-50"
                >
                  <Upload size={14} />
                  {iconPreview ? 'Change image' : 'Upload image'}
                </button>
                <p className="text-xs text-white/30">PNG, JPG, SVG or WebP. Max 4MB.</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleIconSelect}
              className="hidden"
            />
          </div>

          {/* Project Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-white/80">Project Name</label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="e.g. My Awesome App"
              disabled={isLoading}
              className={`w-full bg-white/[0.04] border ${errors.name ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-white/[0.1] focus:border-white/20 focus:ring-white/20'} rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 transition-all disabled:opacity-50`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-2">
            <label htmlFor="platform" className="text-sm font-medium text-white/80">Platform</label>
            <select
              id="platform"
              {...register('platform')}
              disabled={isLoading}
              className={`w-full bg-white/[0.04] border ${errors.platform ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-white/[0.1] focus:border-white/20 focus:ring-white/20'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all disabled:opacity-50 appearance-none`}
            >
              <option value="REACT_NATIVE" className="bg-[#0a0a0a]">React Native</option>
              <option value="EXPO" className="bg-[#0a0a0a]">Expo</option>
            </select>
            {errors.platform ? (
              <p className="text-xs text-red-400 mt-1">{errors.platform.message}</p>
            ) : (
              <p className="text-xs text-white/40 mt-1">Select the framework your app is built with.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-white/[0.08] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isUploading ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}