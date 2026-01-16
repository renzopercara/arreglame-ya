"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export default function WorkerChatPage() {
  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <MessageSquare className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Chat</h1>
          <p className="text-sm text-slate-500">Mensajes con clientes</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-600 font-medium">
          No tienes conversaciones activas.
        </p>
      </div>
    </div>
  );
}
