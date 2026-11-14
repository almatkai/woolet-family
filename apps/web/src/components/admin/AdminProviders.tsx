import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, RotateCcw, Server, LockKeyhole, KeyRound, AlertCircle } from 'lucide-react';
import {
  type AiProviderProtocol,
  type ManagedAiProvider,
  type ProviderFormState,
  getErrorMessage,
} from './admin-shared';

export default function AdminProviders() {
  const { data: providerData, refetch: refetchProviders } = trpc.ai.listAiProviders.useQuery();
  const createAiProvider = trpc.ai.createAiProvider.useMutation();
  const updateAiProvider = trpc.ai.updateAiProvider.useMutation();
  const deleteAiProvider = trpc.ai.deleteAiProvider.useMutation();
  const setBuiltInAiProviderCredential = trpc.ai.setBuiltInAiProviderCredential.useMutation();
  const removeBuiltInAiProviderCredentialOverride = trpc.ai.removeBuiltInAiProviderCredentialOverride.useMutation();

  const providers = (providerData?.providers || []) as ManagedAiProvider[];

  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ManagedAiProvider | null>(null);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<ProviderFormState>({
    name: '',
    protocol: 'openai-compatible',
    baseUrl: '',
    apiKey: '',
    enabled: true,
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openCreateProviderDialog = () => {
    setEditingProvider(null);
    setProviderError(null);
    setProviderForm({ name: '', protocol: 'openai-compatible', baseUrl: '', apiKey: '', enabled: true });
    setProviderDialogOpen(true);
  };

  const openEditProviderDialog = (provider: ManagedAiProvider) => {
    setEditingProvider(provider);
    setProviderError(null);
    setProviderForm({ name: provider.name, protocol: provider.protocol, baseUrl: provider.baseUrl, apiKey: '', enabled: provider.enabled });
    setProviderDialogOpen(true);
  };

  const handleSaveProvider = async () => {
    if (editingProvider?.builtIn && !providerForm.apiKey.trim()) {
      setProviderError('Enter the new API key to store as the database override.');
      return;
    }
    if (!providerForm.name.trim() || !providerForm.baseUrl.trim()) {
      setProviderError('Name and API endpoint are required.');
      return;
    }
    if (!editingProvider && !providerForm.apiKey.trim()) {
      setProviderError('API key is required for a new provider.');
      return;
    }

    setProviderSaving(true);
    setProviderError(null);
    try {
      if (editingProvider?.builtIn) {
        await setBuiltInAiProviderCredential.mutateAsync({
          id: editingProvider.id as 'openrouter' | 'openai' | 'alemai' | 'deepseek' | 'groq',
          apiKey: providerForm.apiKey,
        });
        setProviderDialogOpen(false);
        showSuccess(`${editingProvider.name} now uses the encrypted database key.`);
        await refetchProviders();
        return;
      }

      const payload = {
        name: providerForm.name.trim(),
        protocol: providerForm.protocol,
        baseUrl: providerForm.baseUrl.trim(),
        apiKey: providerForm.apiKey,
        enabled: providerForm.enabled,
      };
      if (editingProvider) {
        await updateAiProvider.mutateAsync({ id: editingProvider.id, ...payload });
      } else {
        await createAiProvider.mutateAsync(payload);
      }
      setProviderDialogOpen(false);
      showSuccess(editingProvider ? 'Provider updated successfully!' : 'Provider added securely!');
      await refetchProviders();
    } catch (err: unknown) {
      setProviderError(getErrorMessage(err, 'Failed to save provider'));
    } finally {
      setProviderSaving(false);
    }
  };

  const handleDeleteProvider = async (provider: ManagedAiProvider) => {
    if (!confirm(`Delete provider "${provider.name}" and its encrypted API key?`)) return;
    try {
      await deleteAiProvider.mutateAsync({ id: provider.id });
      showSuccess('Provider and encrypted credential deleted.');
      await refetchProviders();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete provider'));
    }
  };

  const handleRemoveBuiltInOverride = async (provider: ManagedAiProvider) => {
    if (!confirm(`Remove the database key for "${provider.name}" and return to the GitHub/environment key?`)) return;
    try {
      await removeBuiltInAiProviderCredentialOverride.mutateAsync({ id: provider.id as 'openrouter' | 'openai' | 'alemai' | 'deepseek' | 'groq' });
      showSuccess(`${provider.name} now falls back to its GitHub/environment key.`);
      await refetchProviders();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to remove database credential override'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <KeyRound className="h-6 w-6 text-primary" />
          Providers
        </h2>
        <p className="text-muted-foreground mt-1">Manage AI provider credentials and endpoints.</p>
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

      <div className={`rounded-2xl border p-4 ${providerData?.encryption?.configured ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/10'}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-xl p-2 ${providerData?.encryption?.configured ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {providerData?.encryption?.configured ? 'Credential vault is ready' : 'Credential vault needs a master key'}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {providerData?.encryption?.configured
                ? `Every API key gets its own random data-encryption key. Active master key: ${providerData.encryption.activeKeyId}.`
                : (providerData?.encryption?.message || 'Configure AI_SECRETS_MASTER_KEY on the API server before adding providers.')}
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b bg-muted/20">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5 text-sky-500" />
              Compatible providers
            </CardTitle>
            <CardDescription>
              Built-in providers use the encrypted database key first, then fall back to GitHub/environment secrets.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreateProviderDialog} disabled={!providerData?.encryption?.configured} className="h-9 shrink-0 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {providers.map((provider) => (
            <div key={provider.id} className="group flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-xl border bg-background p-2.5 text-muted-foreground shadow-sm">
                  <Server className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{provider.name}</p>
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
                      {provider.protocol === 'anthropic-compatible' ? 'Claude compatible' : 'OpenAI compatible'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${provider.credentialSource === 'database' ? 'bg-emerald-500/10 text-emerald-600' : provider.credentialSource === 'environment' ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>
                      {provider.credentialSource === 'database' ? 'DB override' : provider.credentialSource === 'environment' ? 'GitHub / env' : 'no key'}
                    </span>
                    {!provider.enabled && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">disabled</span>}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{provider.baseUrl}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="font-mono">{provider.apiKeyHint ? `key ••••${provider.apiKeyHint}` : 'key not configured'}</span>
                    {provider.masterKeyId && <span>wrapped by {provider.masterKeyId}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!providerData?.encryption?.configured} onClick={() => openEditProviderDialog(provider)} aria-label={`Replace ${provider.name} API key`} title={`Replace ${provider.name} API key`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {provider.builtIn ? (
                  provider.hasDatabaseOverride && (
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-amber-600" onClick={() => handleRemoveBuiltInOverride(provider)} aria-label={`Use environment key for ${provider.name}`} title="Remove DB override and use GitHub/environment key">
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Use env
                    </Button>
                  )
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProvider(provider)} aria-label={`Delete ${provider.name}`} title={`Delete ${provider.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {providers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <KeyRound className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">No providers available</p>
              <p className="mt-1 text-xs text-muted-foreground">Configure the credential vault and refresh this page.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProvider?.builtIn ? `Replace ${editingProvider.name} API Key` : editingProvider ? 'Edit Provider' : 'Add Provider'}
            </DialogTitle>
            <DialogDescription>
              {editingProvider?.builtIn
                ? 'The encrypted database key takes priority. Remove the DB override later to return to the GitHub/environment key.'
                : editingProvider
                ? 'Leave the API key blank to keep the currently encrypted credential.'
                : 'The API key is encrypted on the server before it is stored.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {providerError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{providerError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="provider-name">Provider Name</Label>
              <Input id="provider-name" value={providerForm.name} onChange={(event) => setProviderForm((form) => ({ ...form, name: event.target.value }))} placeholder="e.g. Anthropic Production" disabled={editingProvider?.builtIn} />
            </div>

            <div className="space-y-1.5">
              <Label>API Protocol</Label>
              <Select value={providerForm.protocol} onValueChange={(value) => setProviderForm((form) => ({ ...form, protocol: value as AiProviderProtocol }))} disabled={editingProvider?.builtIn}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai-compatible">OpenAI compatible</SelectItem>
                  <SelectItem value="anthropic-compatible">Claude / Anthropic compatible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider-endpoint">API Endpoint</Label>
              <Input id="provider-endpoint" type="url" value={providerForm.baseUrl} onChange={(event) => setProviderForm((form) => ({ ...form, baseUrl: event.target.value }))} placeholder={providerForm.protocol === 'anthropic-compatible' ? 'https://api.anthropic.com/v1' : 'https://api.example.com/v1'} disabled={editingProvider?.builtIn} />
              <p className="text-[11px] text-muted-foreground">Use the API root. Woolet appends <span className="font-mono">/messages</span> for Claude-compatible providers.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider-api-key">API Key</Label>
              <Input id="provider-api-key" type="password" autoComplete="new-password" value={providerForm.apiKey} onChange={(event) => setProviderForm((form) => ({ ...form, apiKey: event.target.value }))} placeholder={editingProvider?.builtIn ? `Paste new DB override${editingProvider.apiKeyHint ? ` (current ••••${editingProvider.apiKeyHint})` : ''}` : editingProvider ? `Keep current key${editingProvider.apiKeyHint ? ` ••••${editingProvider.apiKeyHint}` : ''}` : 'Paste API key'} />
              <p className="text-[11px] text-muted-foreground">
                {editingProvider?.builtIn ? 'After saving, requests use this database key before any environment secret.' : 'The saved key can be replaced or deleted, but never revealed again.'}
              </p>
            </div>

            {!editingProvider?.builtIn && (
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3">
                <div>
                  <Label htmlFor="provider-enabled">Enabled</Label>
                  <p className="text-[11px] text-muted-foreground">Allow models from this provider in the fallback queue.</p>
                </div>
                <Switch id="provider-enabled" checked={providerForm.enabled} onCheckedChange={(enabled) => setProviderForm((form) => ({ ...form, enabled }))} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialogOpen(false)} disabled={providerSaving}>Cancel</Button>
            <Button onClick={handleSaveProvider} disabled={providerSaving}>
              {providerSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
              {editingProvider?.builtIn ? 'Save DB Override' : editingProvider ? 'Save Changes' : 'Encrypt & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { CheckCircle2 } from 'lucide-react';
