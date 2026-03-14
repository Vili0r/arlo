"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations';

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      platform: 'REACT_NATIVE',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: CreateProjectInput) => {
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      await res.json();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-8">
      <div className="flex flex-col gap-1 text-center">
        <div className="mx-auto w-12 h-12 bg-white/[0.05] border border-white/[0.1] rounded-2xl flex items-center justify-center mb-2">
          <Rocket size={24} className="text-white/80" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Let's build something new.</h1>
        <p className="text-sm text-white/50">
          Create a new project to start managing your flows.
        </p>
      </div>

      <div className="border border-white/[0.08] bg-white/[0.02] rounded-xl p-6 mt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-white/80">Project Name</label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="e.g. My Awesome App"
              disabled={isSubmitting}
              className={`w-full bg-white/[0.04] border ${errors.name ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-white/[0.1] focus:border-white/20 focus:ring-white/20'} rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 transition-all disabled:opacity-50`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="platform" className="text-sm font-medium text-white/80">Platform</label>
            <select
              id="platform"
              {...register('platform')}
              disabled={isSubmitting}
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

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="pt-2 border-t border-white/[0.08] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
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
