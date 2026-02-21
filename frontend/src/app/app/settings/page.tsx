'use client';

import React, { useState } from 'react';

type SettingType = 'toggle' | 'select' | 'textarea' | 'text';

interface SettingSchema {
  id: string;
  label: string;
  description: string;
  type: SettingType;
  options?: { label: string; value: string }[];
  disabled?: boolean;
  placeholder?: string;
  constraintText?: string;
}

interface SettingsGroup {
  groupTitle: string;
  items: SettingSchema[];
}

const SETTINGS_CONFIG: SettingsGroup[] = [
  {
    groupTitle: "General",
    items: [
      
    ]
  }
];

export default function PreferencesPage() {
  const [settings, setSettings] = useState<Record<string, any>>({
    suggestions: true,
    sound_notifications: true,
    chat_position: 'left',
  });

  const handleChange = (id: string, value: any) => {
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-8 text-zinc-100 bg-black min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-sm text-zinc-400">
          Settings that affect how Lamina Flow looks and behaves. Changes here will apply to all your projects and workspaces.
        </p>
      </header>

      {SETTINGS_CONFIG.map((group) => (
        <section key={group.groupTitle} className="mb-10">
          <h2 className="text-sm font-medium text-zinc-500 mb-4">{group.groupTitle}</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
            {group.items.map((item, index) => (
              <div 
                key={item.id} 
                className={`p-6 ${index !== group.items.length - 1 ? 'border-bottom border-zinc-800' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-1">{item.label}</label>
                    <p className="text-xs text-zinc-400 mb-3">{item.description}</p>
                    
                    {item.type === 'textarea' && (
                      <div className="relative mt-2">
                        <textarea
                          disabled={item.disabled}
                          placeholder={item.placeholder}
                          className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
                        />
                        {item.constraintText && (
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 rounded">
                            <span className="text-xs text-zinc-500">{item.constraintText}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {item.type === 'toggle' && (
                      <input 
                        type="checkbox" 
                        checked={settings[item.id]} 
                        onChange={(e) => handleChange(item.id, e.target.checked)}
                        className="w-10 h-5 accent-blue-500"
                      />
                    )}
                    
                    {item.type === 'select' && (
                      <select 
                        value={settings[item.id]}
                        onChange={(e) => handleChange(item.id, e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1 text-sm outline-none"
                      >
                        {item.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-zinc-900/30 p-4 border-t border-zinc-800 flex justify-end">
              <button className="px-4 py-1.5 bg-zinc-100 text-black rounded text-sm font-medium hover:bg-zinc-200 transition-colors">
                Save
              </button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};