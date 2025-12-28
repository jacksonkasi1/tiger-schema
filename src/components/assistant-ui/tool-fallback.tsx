import type { ToolCallMessagePartComponent } from '@assistant-ui/react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XCircleIcon,
  Loader2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Helper to safely format result for display
const formatResult = (result: unknown): string => {
  if (result === undefined || result === null) {
    return 'No result';
  }

  if (typeof result === 'string') {
    return result;
  }

  if (typeof result === 'number' || typeof result === 'boolean') {
    return String(result);
  }

  // Handle objects with common properties
  if (typeof result === 'object') {
    try {
      // Check if it's an error-like object
      if ('error' in result) {
        return JSON.stringify(result, null, 2);
      }

      // Check if it has a text property (some SDKs return this)
      if ('text' in result && typeof (result as any).text === 'string') {
        return (result as any).text;
      }

      // Pretty print the object
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return '[Error serializing result]';
    }
  }

  return String(result);
};

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const isRunning = status?.type === 'running';
  const isCancelled =
    status?.type === 'incomplete' && status.reason === 'cancelled';
  const isError = status?.type === 'error';

  const cancelledReason =
    isCancelled && status.error
      ? typeof status.error === 'string'
        ? status.error
        : JSON.stringify(status.error)
      : null;

  const errorMessage =
    isError && status.error
      ? typeof status.error === 'string'
        ? status.error
        : JSON.stringify(status.error)
      : null;

  return (
    <div
      className={cn(
        'aui-tool-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3',
        isCancelled && 'border-muted-foreground/30 bg-muted/30',
        isError && 'border-destructive/30 bg-destructive/5',
        isRunning && 'border-blue-500/30 bg-blue-500/5',
      )}
    >
      <div className="aui-tool-fallback-header flex items-center gap-2 px-4">
        {isCancelled ? (
          <XCircleIcon className="aui-tool-fallback-icon size-4 text-muted-foreground" />
        ) : isError ? (
          <XCircleIcon className="aui-tool-fallback-icon size-4 text-destructive" />
        ) : isRunning ? (
          <Loader2Icon className="aui-tool-fallback-icon size-4 animate-spin text-blue-500" />
        ) : (
          <CheckIcon className="aui-tool-fallback-icon size-4 text-green-500" />
        )}
        <p
          className={cn(
            'aui-tool-fallback-title grow text-sm',
            isCancelled && 'text-muted-foreground line-through',
            isError && 'text-destructive',
            isRunning && 'text-blue-500',
          )}
        >
          {isCancelled
            ? 'Cancelled tool: '
            : isRunning
              ? 'Running tool: '
              : isError
                ? 'Tool error: '
                : 'Used tool: '}
          <b>{toolName}</b>
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="aui-tool-fallback-content flex flex-col gap-2 border-t pt-2">
          {cancelledReason && (
            <div className="aui-tool-fallback-cancelled-root px-4">
              <p className="aui-tool-fallback-cancelled-header font-semibold text-muted-foreground text-xs">
                Cancelled reason:
              </p>
              <p className="aui-tool-fallback-cancelled-reason text-muted-foreground text-xs">
                {cancelledReason}
              </p>
            </div>
          )}
          {errorMessage && (
            <div className="aui-tool-fallback-error-root px-4">
              <p className="aui-tool-fallback-error-header font-semibold text-destructive text-xs">
                Error:
              </p>
              <p className="aui-tool-fallback-error-reason text-destructive text-xs">
                {errorMessage}
              </p>
            </div>
          )}
          <div
            className={cn(
              'aui-tool-fallback-args-root px-4',
              isCancelled && 'opacity-60',
            )}
          >
            <p className="font-semibold text-xs mb-1">Arguments:</p>
            <pre className="aui-tool-fallback-args-value whitespace-pre-wrap text-xs bg-muted/30 p-2 rounded">
              {argsText}
            </pre>
          </div>
          {!isCancelled && result !== undefined && !isRunning && (
            <div className="aui-tool-fallback-result-root border-t border-dashed px-4 pt-2">
              <p className="aui-tool-fallback-result-header font-semibold text-xs mb-1">
                Result:
              </p>
              <pre className="aui-tool-fallback-result-content whitespace-pre-wrap text-xs bg-muted/30 p-2 rounded max-h-64 overflow-auto">
                {formatResult(result)}
              </pre>
            </div>
          )}
          {isRunning && (
            <div className="px-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2Icon className="size-3 animate-spin" />
              <span>Executing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
