import React from "react";
import { MapPin, User, Clock, ChevronRight } from "lucide-react";

export interface Job {
  id: string;
  clientName: string;
  jobType: string;
  location?: string;
  distance?: number;
  description?: string;
  scheduledDate?: string;
  status?: string;
}

interface JobCardProps {
  job: Job;
  onView?: (id: string) => void;
  onAccept?: (id: string) => void;
}

export default function JobCard({ job, onView, onAccept }: JobCardProps) {
  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    onView?.(job.id);
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAccept?.(job.id);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-all active:scale-[0.98]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-900">{job.clientName}</h3>
            <p className="text-xs font-medium text-emerald-600">{job.jobType}</p>
          </div>
        </div>
        {job.status && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600 uppercase">
            {job.status}
          </span>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
      )}

      {/* Details */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        {job.distance !== undefined && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{job.distance.toFixed(1)} km</span>
          </div>
        )}
        {job.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        {job.scheduledDate && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleView}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all active:scale-95 hover:bg-slate-200"
        >
          Ver Detalles
          <ChevronRight className="h-4 w-4" />
        </button>
        {onAccept && (
          <button
            onClick={handleAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all active:scale-95 hover:bg-emerald-700"
          >
            Aceptar
          </button>
        )}
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-200" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-200" />
          </div>
        </div>
        <div className="h-6 w-20 rounded-full bg-slate-200" />
      </div>

      {/* Description skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
      </div>

      {/* Details skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-3 w-24 rounded bg-slate-200" />
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2 pt-2">
        <div className="h-10 flex-1 rounded-xl bg-slate-200" />
        <div className="h-10 flex-1 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function JobListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
