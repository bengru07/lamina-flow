'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Key, 
  Globe 
} from 'lucide-react';
import { fetchSettings, fetchSettingsSchema, updateGlobalSettings } from '@/redux/settings/SettingsThunk';
import { setLocalSetting } from '@/redux/settings/SettingsSlice';
import { useAppDispatch, useAppSelector } from '@/api/appDispatcher';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PreferencesPage() {
  const dispatch = useAppDispatch();
  const { values: settings, schema, status } = useAppSelector((state) => state.settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());
    dispatch(fetchSettingsSchema());
  }, [dispatch]);

  const handleChange = (id: string, value: any) => {
    dispatch(setLocalSetting({ id, value }));
  };

  const handleAddAIProvider = () => {
    const providers = Array.isArray(settings.ai_providers) ? [...settings.ai_providers] : [];
    const newProvider = {
      name: "New Provider",
      service_type: "chatgpt",
      api_key: "",
      endpoint_url: "",
      enabled: true,
      id: crypto.randomUUID()
    };
    handleChange('ai_providers', [...providers, newProvider]);
    toast.success("Added new AI provider row");
  };

  const handleRemoveAIProvider = (index: number) => {
    const providers = [...(settings.ai_providers || [])];
    providers.splice(index, 1);
    handleChange('ai_providers', providers);
  };

  const updateAIProvider = (index: number, updates: any) => {
    const providers = [...(settings.ai_providers || [])];
    providers[index] = { ...providers[index], ...updates };
    handleChange('ai_providers', providers);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(updateGlobalSettings(settings)).unwrap();
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (status.fetch === 'pending' && schema.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 text-zinc-100 bg-black min-h-screen pb-24">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold mb-2 tracking-tight">Preferences</h1>
          <p className="text-sm text-zinc-400 max-w-lg">
            Manage global behavior, appearance, and AI integrations across all Lamina Flow workspaces.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-zinc-100 text-black hover:bg-zinc-300 min-w-[120px]"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </header>

      {schema.map((group) => (
        <section key={group.groupTitle} className="mb-12">
          <div className="flex items-center gap-2 mb-4">
             <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{group.groupTitle}</h2>
             <div className="h-[1px] flex-1 bg-zinc-800/50" />
          </div>

          <div className="space-y-4">
            {group.items.map((item: any) => (
              <div key={item.id} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 transition-all hover:border-zinc-700">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-200">{item.label}</label>
                      <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="shrink-0">
                      {item.type === 'toggle' && (
                        <input 
                          type="checkbox" 
                          checked={!!settings[item.id]} 
                          onChange={(e) => handleChange(item.id, e.target.checked)}
                          className="w-10 h-5 accent-emerald-500 cursor-pointer rounded-full"
                        />
                      )}
                      
                      {item.type === 'select' && (
                        <select 
                          value={settings[item.id] || ''}
                          onChange={(e) => handleChange(item.id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
                        >
                          {item.options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {item.id === 'ai_providers' && (
                    <div className="space-y-3 mt-2">
                      {Array.isArray(settings.ai_providers) && settings.ai_providers.map((provider: any, pIdx: number) => (
                        <div key={pIdx} className="bg-black/40 border border-zinc-800 rounded-lg p-3 group">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-3">
                              <Input 
                                placeholder="Provider Name"
                                value={provider.name}
                                onChange={(e) => updateAIProvider(pIdx, { name: e.target.value })}
                                className="h-8 bg-zinc-900/50 border-zinc-800 text-xs focus-visible:ring-zinc-700"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <select 
                                value={provider.service_type}
                                onChange={(e) => updateAIProvider(pIdx, { service_type: e.target.value })}
                                className="w-full h-8 bg-zinc-900/50 border border-zinc-800 rounded-md text-[11px] px-2 outline-none"
                              >
                                <option value="chatgpt">ChatGPT</option>
                                <option value="gemini">Gemini</option>
                                <option value="claude">Claude</option>
                                <option value="ollama">Ollama</option>
                                <option value="custom_api">Custom API</option>
                              </select>
                            </div>
                            <div className="md:col-span-5 relative">
                              {provider.service_type === 'custom_api' ? (
                                <div className="flex flex-col gap-2">
                                  <div className="relative">
                                    <Globe className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-600" />
                                    <Input 
                                      type="text"
                                      placeholder="https://api.your-service.com/v1"
                                      value={provider.endpoint_url || ''}
                                      onChange={(e) => updateAIProvider(pIdx, { endpoint_url: e.target.value })}
                                      className="h-8 pl-8 bg-zinc-900/50 border-zinc-800 text-xs"
                                    />
                                  </div>
                                  <div className="relative">
                                    <Key className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-600" />
                                    <Input 
                                      type="password"
                                      placeholder="Auth Token (Optional)"
                                      value={provider.api_key || ''}
                                      onChange={(e) => updateAIProvider(pIdx, { api_key: e.target.value })}
                                      className="h-8 pl-8 bg-zinc-900/50 border-zinc-800 text-xs"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <Key className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-600" />
                                  <Input 
                                    type="password"
                                    placeholder={provider.service_type === 'ollama' ? 'Base URL (e.g. http://localhost:11434)' : 'API Key (sk-...)'}
                                    value={provider.api_key}
                                    onChange={(e) => updateAIProvider(pIdx, { api_key: e.target.value })}
                                    className="h-8 pl-8 bg-zinc-900/50 border-zinc-800 text-xs"
                                  />
                                </>
                              )}
                            </div>
                            <div className="md:col-span-2 flex items-center justify-end gap-2">
                              <button 
                                onClick={() => updateAIProvider(pIdx, { enabled: !provider.enabled })}
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded border transition-all",
                                  provider.enabled ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                                )}
                              >
                                {provider.enabled ? "Active" : "Off"}
                              </button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-500 hover:text-red-400"
                                onClick={() => handleRemoveAIProvider(pIdx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-dashed border-zinc-800 bg-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
                        onClick={handleAddAIProvider}
                      >
                        <Plus className="h-3 w-3 mr-2" /> Add AI Integration
                      </Button>
                    </div>
                  )}

                  {item.type === 'text' && item.id !== 'ai_providers' && (
                    <Input 
                      value={settings[item.id] || ''}
                      onChange={(e) => handleChange(item.id, e.target.value)}
                      className="bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700"
                    />
                  )}

                  {item.type === 'textarea' && item.id !== 'ai_providers' && (
                    <textarea
                      value={settings[item.id] || ''}
                      onChange={(e) => handleChange(item.id, e.target.value)}
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-md p-3 text-xs font-mono outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}