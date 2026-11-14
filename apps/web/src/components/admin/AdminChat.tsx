import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  BUILT_IN_AI_PROVIDERS,
  type LlmModel,
  type ManagedAiProvider,
  getErrorMessage,
} from './admin-shared';

export default function AdminChat() {
  const { data: catalogModels } = trpc.ai.listLlmModels.useQuery();
  const { data: providerData } = trpc.ai.listAiProviders.useQuery();
  const testLlmModel = trpc.ai.testLlmModel.useMutation();

  const providers = (providerData?.providers || []) as ManagedAiProvider[];
  const providerOptions = [
    ...BUILT_IN_AI_PROVIDERS.map((id) => ({ id, name: providers.find((p) => p.id === id)?.name || id, builtIn: true })),
    ...providers.filter((p) => !p.builtIn).map((p) => ({ id: p.id, name: p.name, builtIn: false })),
  ];

  const models = (catalogModels || []) as LlmModel[];
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const modelsForProvider = models.filter((m) => m.provider === selectedProvider);

  useEffect(() => {
    if (!selectedProvider && providerOptions.length > 0) {
      setSelectedProvider(providerOptions[0].id);
    }
  }, [providerOptions, selectedProvider]);

  useEffect(() => {
    if (selectedProvider) {
      const firstModel = modelsForProvider[0];
      setSelectedId(firstModel ? firstModel.id : '');
    }
  }, [selectedProvider, modelsForProvider]);

  const selectedModel = models.find((m) => m.id === selectedId) || null;

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !selectedModel || running) return;
    setRunning(true);
    setError(null);
    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    try {
      const result = await testLlmModel.mutateAsync({
        id: selectedModel.id,
        message: nextMessages.map((m) => `${m.role}: ${m.content}`).join('\n'),
      });
      if (result.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: result.response || '(empty response)' }]);
        setSuccess(`OK • ${result.latencyMs}ms • ${result.provider}/${result.modelId}`);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(result.error || 'Model test failed.');
        setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ Test failed: ${result.error}` }]);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Model test failed.');
      setError(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${message}` }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          Chat
        </h2>
        <p className="text-muted-foreground mt-1">Test any model or provider directly with a live message.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Model</CardTitle>
            <CardDescription>Pick a model from the catalog to test.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger><SelectValue placeholder="Choose a provider" /></SelectTrigger>
                <SelectContent>
                  {providerOptions.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}{provider.builtIn ? '' : ' · custom'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Model</Label>
              <Select value={selectedId} onValueChange={setSelectedId} disabled={!selectedProvider}>
                <SelectTrigger><SelectValue placeholder={selectedProvider ? 'Choose a model' : 'Select a provider first'} /></SelectTrigger>
                <SelectContent>
                  {modelsForProvider.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName}{!model.enabled ? ' (disabled)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProvider && modelsForProvider.length === 0 && (
                <p className="text-xs text-muted-foreground">No models in the catalog for this provider.</p>
              )}
            </div>

            {selectedModel && (
              <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">{selectedModel.provider}</span>
                  {selectedModel.supportsVision && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">vision</span>}
                  {selectedModel.supportsTools && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-500">tools</span>}
                  {!selectedModel.enabled && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">disabled</span>}
                </div>
                <p className="font-mono break-all">{selectedModel.modelId}</p>
                {selectedModel.contextWindow != null && <p className="text-muted-foreground">Context: {selectedModel.contextWindow.toLocaleString()}</p>}
              </div>
            )}

            {!selectedModel && (
              <p className="text-xs text-muted-foreground">No model selected.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Test Conversation</CardTitle>
            <CardDescription>Messages are sent only to the selected model. No history is saved.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="max-h-[50vh] min-h-[160px] overflow-y-auto rounded-lg border bg-muted/10 p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Send a test message to the right.</p>
              )}
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              {running && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a test message..."
                disabled={running || !selectedModel}
              />
              <Button onClick={sendMessage} disabled={running || !input.trim() || !selectedModel}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
