'use client';

import { FC, PropsWithChildren, useState } from 'react';
import { ChevronDown, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Shimmer animation for streaming state
const ShimmerEffect: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-purple-500/10 to-transparent',
      className,
    )}
  />
);

// Internal components for building the reasoning UI
const ReasoningRoot: FC<
  PropsWithChildren<{ className?: string; defaultOpen?: boolean }>
> = ({ children, className, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'aui-reasoning-root mb-3 rounded-lg border border-purple-500/20 bg-purple-500/5 overflow-hidden',
        className,
      )}
    >
      {children}
    </Collapsible>
  );
};

const ReasoningTrigger: FC<{
  isStreaming?: boolean;
  className?: string;
  label?: string;
}> = ({ isStreaming, className, label }) => {
  return (
    <CollapsibleTrigger
      className={cn(
        'aui-reasoning-trigger flex w-full items-center gap-2 px-3 py-2 text-xs font-medium',
        'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors',
        'relative overflow-hidden',
        className,
      )}
    >
      {isStreaming && <ShimmerEffect />}
      <Brain
        size={12}
        className={cn(isStreaming && 'animate-pulse', 'relative z-10')}
      />
      <span className="relative z-10">
        {label || (isStreaming ? 'Thinking...' : 'Reasoning')}
      </span>
      {isStreaming && (
        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse relative z-10" />
      )}
      <ChevronDown
        size={12}
        className="ml-auto transition-transform duration-200 [[data-state=open]>&]:rotate-180 relative z-10"
      />
    </CollapsibleTrigger>
  );
};

const ReasoningContent: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <CollapsibleContent
      className={cn(
        'aui-reasoning-content px-3 pb-3 text-xs text-muted-foreground border-t border-purple-500/10',
        className,
      )}
    >
      <div className="pt-2 prose prose-xs dark:prose-invert max-w-none">
        {children}
      </div>
    </CollapsibleContent>
  );
};

const ReasoningText: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn('whitespace-pre-wrap text-xs leading-relaxed', className)}
    >
      {children}
    </div>
  );
};

// Main Reasoning Component - for assistant-ui MessagePrimitive.Parts
// This component receives props from the parent when used as a part component
export const Reasoning: FC<{
  text?: string;
  status?: { type: string };
}> = ({ text, status }) => {
  const isStreaming = status?.type === 'running';

  if (!text && !isStreaming) return null;

  return (
    <ReasoningRoot defaultOpen={isStreaming}>
      <ReasoningTrigger isStreaming={isStreaming} />
      <ReasoningContent>
        {text ? (
          <ReasoningText>{text}</ReasoningText>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="animate-pulse text-xs">Processing...</span>
          </div>
        )}
      </ReasoningContent>
    </ReasoningRoot>
  );
};

// ReasoningGroup - wraps consecutive reasoning parts
export const ReasoningGroup: FC<
  PropsWithChildren<{
    startIndex: number;
    endIndex: number;
  }>
> = ({ startIndex, endIndex, children }) => {
  const count = endIndex - startIndex + 1;

  return (
    <Collapsible
      defaultOpen={true}
      className="aui-reasoning-group mb-3 rounded-lg border border-purple-500/20 bg-purple-500/5 overflow-hidden"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-xs font-medium',
          'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors',
          'relative overflow-hidden',
        )}
      >
        <Brain size={12} className="relative z-10" />
        <span className="relative z-10">
          Reasoning ({count} step{count > 1 ? 's' : ''})
        </span>
        <ChevronDown
          size={12}
          className="ml-auto transition-transform duration-200 [[data-state=open]>&]:rotate-180 relative z-10"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 text-xs text-muted-foreground border-t border-purple-500/10">
        <div className="pt-2 space-y-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Single reasoning step within a group (legacy support)
export const ReasoningStep: FC<{
  index: number;
  text: string;
  isStreaming?: boolean;
}> = ({ index, text, isStreaming }) => {
  return (
    <div
      className={cn(
        'flex gap-2 p-2 rounded-md bg-purple-500/5',
        isStreaming && 'animate-pulse',
      )}
    >
      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-medium">
        {index}
      </span>
      <div className="flex-1 whitespace-pre-wrap text-xs">{text}</div>
    </div>
  );
};

export default Reasoning;
