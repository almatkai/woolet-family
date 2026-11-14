import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Save, RotateCcw, ChevronUp, ChevronDown, GripVertical, Activity, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  type AiConfig,
  type LlmModel,
  type ModelPriorityItem,
  getErrorMessage,
} from './admin-shared';

export default function AdminAiConfig() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAvailableModels, setShowAvailableModels] = useState(false);
  const [draggedModelId, setDraggedModelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: aiConfig, refetch: refetchAiConfig } = trpc.ai.getAiConfig.useQuery();
  const { data: llmModels } = trpc.ai.getLlmModels.useQuery();
  const updateAiConfig = trpc.ai.updateAiConfig.useMutation();
  const resetAiConfig = trpc.ai.resetAiConfig.useMutation();

  useEffect(() => {
    if (aiConfig) {
      setConfig(aiConfig as AiConfig);
    }
  }, [aiConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAiConfig.mutateAsync({
        providerOrder: config.providerOrder,
        defaultProvider: config.defaultProvider,
        modelPriority: config.modelPriority,
        modelSettings: config.modelSettings,
        fallbackEnabled: config.fallbackEnabled,
      });
      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      refetchAiConfig();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save configuration'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all AI settings to default?')) return;
    setSaving(true);
    try {
      await resetAiConfig.mutateAsync();
      setSuccess('Reset to defaults successfully!');
      setTimeout(() => setSuccess(null), 3000);
      refetchAiConfig();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to reset configuration'));
    } finally {
      setSaving(false);
    }
  };

  const getModelPriority = (sourceConfig = config, includeAvailable = false): ModelPriorityItem[] => {
    const models = (llmModels || []) as LlmModel[];
    const configured = sourceConfig?.modelPriority || [];
    if (!includeAvailable) {
      return configured.filter((item) => item.enabled);
    }
    const configuredIds = new Set(configured.map((item) => item.id));
    const missing = models.reduce<ModelPriorityItem[]>((items, model) => {
      if (!configuredIds.has(model.id)) {
        items.push({ id: model.id, provider: model.provider, model: model.modelId, enabled: false });
      }
      return items;
    }, []);
    return [...configured, ...missing];
  };

  const handleModelPriorityChange = (index: number, direction: 'up' | 'down') => {
    setConfig((current) => {
      if (!current) return current;
      const newPriority = getModelPriority(current, showAvailableModels);
      if (direction === 'up' && index > 0) {
        [newPriority[index], newPriority[index - 1]] = [newPriority[index - 1], newPriority[index]];
      } else if (direction === 'down' && index < newPriority.length - 1) {
        [newPriority[index], newPriority[index + 1]] = [newPriority[index + 1], newPriority[index]];
      }
      return { ...current, modelPriority: newPriority };
    });
  };

  const handleModelPriorityEnabledChange = (id: string, enabled: boolean) => {
    setConfig((current) => {
      if (!current) return current;
      const newPriority = getModelPriority(current, true).map((item) => item.id === id ? { ...item, enabled } : item);
      return { ...current, modelPriority: newPriority };
    });
  };

  const handleModelDrop = (targetId: string) => {
    if (!draggedModelId || draggedModelId === targetId) {
      setDraggedModelId(null);
      return;
    }
    setConfig((current) => {
      if (!current) return current;
      const newPriority = getModelPriority(current, showAvailableModels);
      const fromIndex = newPriority.findIndex((item) => item.id === draggedModelId);
      const toIndex = newPriority.findIndex((item) => item.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const [moved] = newPriority.splice(fromIndex, 1);
      newPriority.splice(toIndex, 0, moved);
      return { ...current, modelPriority: newPriority };
    });
    setDraggedModelId(null);
  };

  const getModelById = (id: string) => ((llmModels || []) as LlmModel[]).find((model) => model.id === id);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            AI Config
          </h2>
          <p className="text-muted-foreground mt-1">Model routing and fallback behavior.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} className="h-9">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} size="sm" disabled={saving} className="h-9 shadow-sm">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Primary Settings
            </CardTitle>
            <CardDescription>Model routing and fallback behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Primary Model</Label>
              <div className="rounded-xl border bg-muted/30 p-4">
                {(() => {
                  const primary = getModelPriority().find((item) => item.enabled);
                  const model = primary ? getModelById(primary.id) : null;
                  return (
                    <>
                      <p className="text-sm font-semibold">{model?.displayName || primary?.model || 'No active model'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {primary ? `${primary.provider} / ${primary.model}` : 'Enable at least one model below.'}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="fallbackEnabled" className="text-sm font-semibold">Failover Strategy</Label>
                <p className="text-xs text-muted-foreground">Try the next enabled model when the current model or endpoint fails.</p>
              </div>
              <Switch
                id="fallbackEnabled"
                checked={config.fallbackEnabled}
                onCheckedChange={(checked) => setConfig((current) => current ? { ...current, fallbackEnabled: checked } : current)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Model Priority
            </CardTitle>
            <CardDescription>AlemAI models can stay first; other providers are only tried when the queued model cannot run.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
              <div>
                <Label htmlFor="showAvailableModels" className="text-sm font-semibold">Show available models</Label>
                <p className="text-xs text-muted-foreground">Keep this off to hide disabled catalog entries.</p>
              </div>
              <Switch id="showAvailableModels" checked={showAvailableModels} onCheckedChange={setShowAvailableModels} />
            </div>
            <div className="space-y-2">
              {getModelPriority(config, showAvailableModels).map((item, index) => {
                const model = getModelById(item.id);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedModelId(item.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleModelDrop(item.id)}
                    onDragEnd={() => setDraggedModelId(null)}
                    className={`flex items-center justify-between gap-2 p-3 border rounded-lg bg-card transition-colors ${draggedModelId === item.id ? 'opacity-50' : 'hover:bg-muted/30'}`}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{model?.displayName || item.model}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">{item.provider}</span>
                        {model?.supportsVision && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">vision</span>}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">{item.model}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={item.enabled} onCheckedChange={(checked) => handleModelPriorityEnabledChange(item.id, checked)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" disabled={index === 0} onClick={() => handleModelPriorityChange(index, 'up')}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" disabled={index === getModelPriority(config, showAvailableModels).length - 1} onClick={() => handleModelPriorityChange(index, 'down')}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Bot } from 'lucide-react';
