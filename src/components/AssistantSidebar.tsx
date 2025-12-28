'use client';

// ** import types
import type {
  Table,
  StreamingTablesBatch,
  StreamingNotification,
  StreamingOperationHistory,
  OperationRecord,
} from '@/lib/types';

// ** import core packages
import { useState, useEffect, useMemo, useCallback } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import {
  useChatRuntime,
  AssistantChatTransport,
} from '@assistant-ui/react-ai-sdk';

// ** import utils
import { useStore } from '@/lib/store';
import { useLocalStorage } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ** import ui components
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { X, Undo2, Redo2, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ** import assistant-ui components
import { Thread } from '@/components/assistant-ui/thread';

interface AssistantSidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Model {
  id: string;
  name: string;
  enabled?: boolean;
}

export function AssistantSidebar({
  isOpen = false,
  onOpenChange,
}: AssistantSidebarProps) {
  const { tables, updateTablesFromAI } = useStore();
  const [aiProvider, setAiProvider] = useLocalStorage<'openai' | 'google'>(
    'ai-provider',
    'openai',
  );
  const [openaiApiKey] = useLocalStorage<string>('ai-openai-key', '');
  const [googleApiKey] = useLocalStorage<string>('ai-google-key', '');
  const [openaiModel, setOpenaiModel] = useLocalStorage<string>(
    'ai-openai-model',
    'gpt-4o-mini',
  );
  const [googleModel, setGoogleModel] = useLocalStorage<string>(
    'ai-google-model',
    'gemini-1.5-pro-latest',
  );

  // Load models from local storage
  const [openaiModels] = useLocalStorage<Model[]>('ai-openai-models', []);
  const [googleModels] = useLocalStorage<Model[]>('ai-google-models', []);
  const [customOpenaiModels] = useLocalStorage<string[]>(
    'ai-custom-openai-models',
    [],
  );
  const [customGoogleModels] = useLocalStorage<string[]>(
    'ai-custom-google-models',
    [],
  );

  // Operation history for undo/redo
  const [operationHistory, setOperationHistory] = useState<OperationRecord[]>(
    [],
  );
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Combine built-in (if fetched) + custom + default fallback
  const availableOpenaiModels = useMemo(() => {
    const models = openaiModels.filter((m) => m.enabled !== false);

    customOpenaiModels.forEach((m) => {
      if (!models.find((existing) => existing.id === m)) {
        models.push({ id: m, name: m, enabled: true });
      }
    });
    if (models.length === 0) {
      models.push({ id: 'gpt-4o-mini', name: 'GPT-4o mini', enabled: true });
      models.push({ id: 'gpt-4o', name: 'GPT-4o', enabled: true });
    }
    return models;
  }, [openaiModels, customOpenaiModels]);

  const availableGoogleModels = useMemo(() => {
    const models = googleModels.filter((m) => m.enabled !== false);

    customGoogleModels.forEach((m) => {
      if (!models.find((existing) => existing.id === m)) {
        models.push({ id: m, name: m, enabled: true });
      }
    });
    if (models.length === 0) {
      models.push({
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro',
        enabled: true,
      });
      models.push({
        id: 'gemini-1.5-flash-latest',
        name: 'Gemini 1.5 Flash',
        enabled: true,
      });
      models.push({
        id: 'gemini-2.0-flash-thinking-exp-01-21',
        name: 'Gemini 2.0 Flash Thinking',
        enabled: true,
      });
    }
    return models;
  }, [googleModels, customGoogleModels]);

  const setIsOpen = (value: boolean) => {
    onOpenChange?.(value);
  };

  // Get current schema for the API
  const listOfTables = useMemo(() => {
    const authUserTable = {
      title: 'users',
      columns: [
        { title: 'id', format: 'uuid', type: 'string' },
        { title: 'email', format: 'email', type: 'string' },
      ],
    };
    const hasRealTables = Object.keys(tables).length > 0;
    const tablesList = hasRealTables
      ? Object.values(tables).map((t) => ({
          title: t.title,
          columns: t.columns,
        }))
      : [authUserTable];
    return tablesList;
  }, [tables]);

  // Create transport with configuration
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: '/api/chat',
        body: {
          provider: aiProvider === 'google' ? 'google' : 'openai',
          apiKey: aiProvider === 'google' ? googleApiKey : openaiApiKey,
          model: aiProvider === 'google' ? googleModel : openaiModel,
          schema: listOfTables,
        },
      }),
    [
      aiProvider,
      googleApiKey,
      openaiApiKey,
      googleModel,
      openaiModel,
      listOfTables,
    ],
  );

  // Create runtime using assistant-ui's native hook
  const runtime = useChatRuntime({
    transport,
  });

  // Handle data events from the stream
  useEffect(() => {
    const handleDataEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;

      switch (type) {
        case 'data-tables-batch': {
          const batchData = data as StreamingTablesBatch;
          if (batchData.tables && Object.keys(batchData.tables).length > 0) {
            updateTablesFromAI(batchData.tables);
            if (batchData.isComplete) {
              toast.success('Schema Updated', {
                description: `Updated ${Object.keys(batchData.tables).length} tables`,
              });
            }
          }
          break;
        }
        case 'data-notification': {
          const notificationData = data as StreamingNotification;
          if (notificationData.level === 'success') {
            toast.success('Success', { description: notificationData.message });
          } else if (notificationData.level === 'error') {
            toast.error('Error', { description: notificationData.message });
          }
          break;
        }
        case 'data-operation-history': {
          const historyData = data as StreamingOperationHistory;
          if (historyData.operations) {
            setOperationHistory((prev) => [...prev, ...historyData.operations]);
            setHistoryIndex((prev) => prev + historyData.operations.length);
          }
          break;
        }
      }
    };

    window.addEventListener(
      'assistant-data' as keyof WindowEventMap,
      handleDataEvent as EventListener,
    );
    return () => {
      window.removeEventListener(
        'assistant-data' as keyof WindowEventMap,
        handleDataEvent as EventListener,
      );
    };
  }, [updateTablesFromAI]);

  // Undo/Redo handlers
  const canUndo = historyIndex >= 0;
  const canRedo =
    historyIndex < operationHistory.length - 1 && operationHistory.length > 0;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const operation = operationHistory[historyIndex];
    const newTables = { ...tables };

    if (operation.before) {
      Object.entries(operation.before).forEach(([id, table]) => {
        if (table === null) {
          delete newTables[id];
        } else {
          const originalId = Object.keys(tables).find(
            (key) => tables[key].title === (table as Table).title,
          );
          if (originalId) {
            newTables[originalId] = table as Table;
          } else {
            newTables[id] = table as Table;
          }
        }
      });
    }

    updateTablesFromAI(newTables);
    setHistoryIndex((prev) => prev - 1);
    toast.info('Undo', { description: 'Reverted last operation' });
  }, [canUndo, historyIndex, operationHistory, tables, updateTablesFromAI]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const operation = operationHistory[historyIndex + 1];
    const newTables = { ...tables };

    if (operation.after) {
      Object.entries(operation.after).forEach(([id, table]) => {
        if (table === null) {
          const originalId = Object.keys(tables).find(
            (key) => tables[key].title === id,
          );
          if (originalId) {
            delete newTables[originalId];
          }
        } else {
          newTables[id] = table as Table;
        }
      });
    }

    updateTablesFromAI(newTables);
    setHistoryIndex((prev) => prev + 1);
    toast.info('Redo', { description: 'Reapplied operation' });
  }, [canRedo, historyIndex, operationHistory, tables, updateTablesFromAI]);

  const clearHistory = useCallback(() => {
    setOperationHistory([]);
    setHistoryIndex(-1);
  }, []);

  const handleModelChange = (value: string) => {
    if (aiProvider === 'openai') {
      setOpenaiModel(value);
    } else {
      setGoogleModel(value);
    }
  };

  const currentModelValue = aiProvider === 'openai' ? openaiModel : googleModel;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[400px] min-w-[320px] max-w-[50vw] bg-background border-l shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">AI Assistant</h2>
          <Badge variant="secondary" className="text-xs">
            {aiProvider === 'google' ? 'Gemini' : 'OpenAI'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <Undo2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  <Redo2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* History */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={operationHistory.length === 0}
              >
                <History size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">History</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {operationHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No operations yet
                  </p>
                ) : (
                  operationHistory.map((op, i) => (
                    <div
                      key={op.id}
                      className={cn(
                        'text-xs p-2 rounded',
                        i === historyIndex ? 'bg-primary/10' : 'hover:bg-muted',
                      )}
                    >
                      <span className="text-muted-foreground">
                        {new Date(op.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Model Selector */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Select
            value={aiProvider}
            onValueChange={(v) => setAiProvider(v as 'openai' | 'google')}
          >
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="google">Google</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currentModelValue} onValueChange={handleModelChange}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {aiProvider === 'openai' ? (
                <SelectGroup>
                  <SelectLabel>OpenAI Models</SelectLabel>
                  {availableOpenaiModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : (
                <SelectGroup>
                  <SelectLabel>Google Models</SelectLabel>
                  {availableGoogleModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assistant UI Thread */}
      <div className="flex-1 overflow-hidden">
        <AssistantRuntimeProvider runtime={runtime}>
          <Thread />
        </AssistantRuntimeProvider>
      </div>
    </div>
  );
}

export default AssistantSidebar;
