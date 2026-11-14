import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  KeyRound,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  BUILT_IN_AI_PROVIDERS,
  type AiProvider,
  type LlmModel,
  type ManagedAiProvider,
  type ModelFormState,
  getErrorMessage,
} from './admin-shared';

export default function AdminModels() {
  const { data: catalogModels, refetch: refetchCatalog } = trpc.ai.listLlmModels.useQuery();
  const { refetch: refetchAiConfig } = trpc.ai.getAiConfig.useQuery();
  const { data: providerData } = trpc.ai.listAiProviders.useQuery();
  const createLlmModel = trpc.ai.createLlmModel.useMutation();
  const updateLlmModel = trpc.ai.updateLlmModel.useMutation();
  const deleteLlmModel = trpc.ai.deleteLlmModel.useMutation();
  const setLlmModelCredential = trpc.ai.setLlmModelCredential.useMutation();
  const removeLlmModelCredentialOverride = trpc.ai.removeLlmModelCredentialOverride.useMutation();
  const navigate = useNavigate();

  const providers = (providerData?.providers || []) as ManagedAiProvider[];
  const customProviders = providers.filter((provider) => !provider.builtIn);
  const providerOptions = [
    ...BUILT_IN_AI_PROVIDERS.map((id) => ({ id, name: providers.find((provider) => provider.id === id)?.name || id, builtIn: true })),
    ...customProviders.map((provider) => ({ id: provider.id, name: provider.name, builtIn: false })),
  ];

  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LlmModel | null>(null);
  const [modelForm, setModelForm] = useState<ModelFormState>({
    provider: 'openrouter',
    modelId: '',
    displayName: '',
    description: '',
    contextWindow: '',
    supportsTools: false,
    supportsVision: false,
    isPopular: true,
    enabled: true,
    sortOrder: '0',
  });
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [credentialModel, setCredentialModel] = useState<LlmModel | null>(null);
  const [credentialApiKey, setCredentialApiKey] = useState('');
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [credentialSaving, setCredentialSaving] = useState(false);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openCreateDialog = () => {
    setEditingModel(null);
    setCatalogError(null);
    setModelForm({ provider: 'openrouter', modelId: '', displayName: '', description: '', contextWindow: '', supportsTools: false, supportsVision: false, isPopular: true, enabled: true, sortOrder: '0' });
    setCatalogDialogOpen(true);
  };

  const openEditDialog = (model: LlmModel) => {
    setEditingModel(model);
    setCatalogError(null);
    setModelForm({
      provider: model.provider,
      modelId: model.modelId,
      displayName: model.displayName,
      description: model.description ?? '',
      contextWindow: model.contextWindow != null ? String(model.contextWindow) : '',
      supportsTools: model.supportsTools,
      supportsVision: model.supportsVision,
      isPopular: model.isPopular,
      enabled: model.enabled,
      sortOrder: String(model.sortOrder),
    });
    setCatalogDialogOpen(true);
  };

  const handleSaveModel = async () => {
    if (!modelForm.provider || !modelForm.modelId.trim() || !modelForm.displayName.trim()) {
      setCatalogError('Provider, Model ID and Display Name are required.');
      return;
    }
    setCatalogSaving(true);
    setCatalogError(null);
    try {
      const payload = {
        provider: modelForm.provider,
        modelId: modelForm.modelId.trim(),
        displayName: modelForm.displayName.trim(),
        description: modelForm.description.trim() || undefined,
        contextWindow: modelForm.contextWindow.trim() ? Number(modelForm.contextWindow) : undefined,
        supportsTools: modelForm.supportsTools,
        supportsVision: modelForm.supportsVision,
        isPopular: modelForm.isPopular,
        enabled: modelForm.enabled,
        sortOrder: modelForm.sortOrder.trim() ? Number(modelForm.sortOrder) : 0,
      };
      if (editingModel) {
        await updateLlmModel.mutateAsync({ id: editingModel.id, ...payload });
      } else {
        await createLlmModel.mutateAsync(payload);
      }
      setCatalogDialogOpen(false);
      showSuccess(editingModel ? 'Model updated successfully!' : 'Model added successfully!');
      refetchCatalog();
      refetchAiConfig();
    } catch (err: unknown) {
      setCatalogError(getErrorMessage(err, 'Failed to save model'));
    } finally {
      setCatalogSaving(false);
    }
  };

  const handleDeleteModel = async (model: LlmModel) => {
    if (!confirm(`Delete model "${model.displayName}"? This cannot be undone.`)) return;
    try {
      await deleteLlmModel.mutateAsync({ id: model.id });
      showSuccess('Model deleted successfully!');
      refetchCatalog();
      refetchAiConfig();
    } catch (err: unknown) {
      setCatalogError(getErrorMessage(err, 'Failed to delete model'));
    }
  };

  const openCredentialDialog = (model: LlmModel) => {
    setCredentialModel(model);
    setCredentialApiKey('');
    setCredentialError(null);
    setCredentialDialogOpen(true);
  };

  const handleSaveModelCredential = async () => {
    if (!credentialModel || !credentialApiKey.trim()) {
      setCredentialError('Enter the API key for this model.');
      return;
    }
    setCredentialSaving(true);
    setCredentialError(null);
    try {
      await setLlmModelCredential.mutateAsync({
        id: credentialModel.id,
        apiKey: credentialApiKey,
      });
      setCredentialDialogOpen(false);
      showSuccess(`${credentialModel.displayName} now uses its own encrypted API key.`);
      await refetchCatalog();
    } catch (err: unknown) {
      setCredentialError(getErrorMessage(err, 'Failed to save model API key'));
    } finally {
      setCredentialSaving(false);
    }
  };

  const handleRemoveModelCredential = async () => {
    if (!credentialModel) return;
    if (!confirm(`Remove the model-specific key for "${credentialModel.displayName}" and inherit its provider key?`)) return;
    setCredentialSaving(true);
    setCredentialError(null);
    try {
      await removeLlmModelCredentialOverride.mutateAsync({ id: credentialModel.id });
      setCredentialDialogOpen(false);
      showSuccess(`${credentialModel.displayName} now inherits its provider credential.`);
      await refetchCatalog();
    } catch (err: unknown) {
      setCredentialError(getErrorMessage(err, 'Failed to remove model API key'));
    } finally {
      setCredentialSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          Models
        </h2>
        <p className="text-muted-foreground mt-1">Add and manage the catalog of available AI models.</p>
      </div>

      {catalogError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>{catalogError}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-violet-500" />
              Models Catalog
            </CardTitle>
            <CardDescription>
              Models inherit their provider credential unless you assign a dedicated encrypted key.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreateDialog} className="h-9 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Model
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(catalogModels || [] as LlmModel[]).map((model: LlmModel) => (
            <div key={model.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{model.displayName}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">{model.provider}</span>
                  {model.supportsVision && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">vision</span>}
                  {model.supportsTools && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-500">tools</span>}
                  {!model.enabled && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">disabled</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate font-mono">{model.modelId}</span>
                  {model.modelCredential ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600">
                      model key · ••••{model.modelCredential.apiKeyHint}
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                      inherits provider key
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-background"
                  disabled={!providerData?.encryption?.configured}
                  title={providerData?.encryption?.configured ? `Configure API key for ${model.displayName}` : 'Configure the credential vault first'}
                  aria-label={`Configure API key for ${model.displayName}`}
                  onClick={() => openCredentialDialog(model)}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" title="Test model" onClick={() => navigate({ to: '/admin/chat' })}>
                  <Zap className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={() => openEditDialog(model)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background text-destructive" onClick={() => handleDeleteModel(model)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {(!catalogModels || catalogModels.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">No models in the catalog yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
            <DialogDescription>
              {editingModel ? 'Update the model metadata stored in the catalog.' : 'Models added here become available in the Model Priority list.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {catalogError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{catalogError}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Provider</Label>
                <Select value={modelForm.provider} onValueChange={(value) => setModelForm((f) => ({ ...f, provider: value as AiProvider }))} disabled={Boolean(editingModel)}>
                  <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>{provider.name}{provider.builtIn ? '' : ' · custom'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Model ID</Label>
                <Input value={modelForm.modelId} onChange={(e) => setModelForm((f) => ({ ...f, modelId: e.target.value }))} placeholder="e.g. anthropic/claude-opus-4" disabled={Boolean(editingModel)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Display Name</Label>
              <Input value={modelForm.displayName} onChange={(e) => setModelForm((f) => ({ ...f, displayName: e.target.value }))} placeholder="e.g. Claude Opus 4" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea value={modelForm.description} onChange={(e) => setModelForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Context Window</Label>
                <Input type="number" value={modelForm.contextWindow} onChange={(e) => setModelForm((f) => ({ ...f, contextWindow: e.target.value }))} placeholder="e.g. 200000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Sort Order</Label>
                <Input type="number" value={modelForm.sortOrder} onChange={(e) => setModelForm((f) => ({ ...f, sortOrder: e.target.value }))} placeholder="0" />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Supports Vision</Label>
                <Switch checked={modelForm.supportsVision} onCheckedChange={(checked) => setModelForm((f) => ({ ...f, supportsVision: checked }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Supports Tools</Label>
                <Switch checked={modelForm.supportsTools} onCheckedChange={(checked) => setModelForm((f) => ({ ...f, supportsTools: checked }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Popular</Label>
                <Switch checked={modelForm.isPopular} onCheckedChange={(checked) => setModelForm((f) => ({ ...f, isPopular: checked }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Enabled</Label>
                <Switch checked={modelForm.enabled} onCheckedChange={(checked) => setModelForm((f) => ({ ...f, enabled: checked }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCatalogDialogOpen(false)} disabled={catalogSaving}>Cancel</Button>
            <Button onClick={handleSaveModel} disabled={catalogSaving}>
              {catalogSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingModel ? 'Save Changes' : 'Add Model'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-emerald-600" />
              Model API Key
            </DialogTitle>
            <DialogDescription>
              {credentialModel
                ? `Assign a key used only by ${credentialModel.displayName}.`
                : 'Assign a key used only by this model.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {credentialError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{credentialError}</p>
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs font-semibold text-foreground">Credential priority</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                Model key → provider DB key → GitHub/environment key
              </p>
              {credentialModel?.modelCredential && (
                <p className="mt-2 font-mono text-[11px] text-emerald-600">
                  Current model key ••••{credentialModel.modelCredential.apiKeyHint} · {credentialModel.modelCredential.masterKeyId}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="model-api-key">API Key</Label>
              <Input
                id="model-api-key"
                type="password"
                autoComplete="new-password"
                value={credentialApiKey}
                onChange={(event) => setCredentialApiKey(event.target.value)}
                placeholder={credentialModel?.modelCredential ? 'Paste replacement key' : 'Paste model-specific key'}
              />
              <p className="text-[11px] text-muted-foreground">
                The plaintext key is encrypted before storage and can never be revealed again.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {credentialModel?.modelCredential && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-amber-600"
                  onClick={handleRemoveModelCredential}
                  disabled={credentialSaving}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Use provider key
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCredentialDialogOpen(false)} disabled={credentialSaving}>Cancel</Button>
              <Button onClick={handleSaveModelCredential} disabled={credentialSaving}>
                {credentialSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
                Encrypt & Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
