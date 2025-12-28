'use client';

import { FC, PropsWithChildren } from 'react';
import { ChevronDown, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useMessage } from '@assistant-ui/react';

// Shimmer animation for streaming state
const ShimmerEffect: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-purple-500/10 to-transparent',
      className,
    )}
  />
);

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
// This component receives props from the parent when used as a part component.
// It renders the content of a single reasoning part.
// Since it's typically wrapped in ReasoningGroup, we don't render a Collapsible here to avoid nesting.
export const Reasoning: FC<{
  text?: string;
  part?: { text: string; type: string };
  status?: { type: string };
}> = ({ text, part, status }) => {
  const content = text ?? part?.text;
  const isStreaming = status?.type === 'running';

  if (!content && !isStreaming) return null;

  return (
    <div className="py-1 first:pt-0 last:pb-0">
      {content ? (
        <ReasoningText>{content}</ReasoningText>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="animate-pulse text-xs">Processing...</span>
        </div>
      )}
    </div>
  );
};

// ReasoningGroup - wraps consecutive reasoning parts in a collapsible container
export const ReasoningGroup: FC<
  PropsWithChildren<{
    startIndex: number;
    endIndex: number;
  }>
> = ({ startIndex, endIndex, children }) => {
  const { status } = useMessage();
  const isStreaming = status?.type === 'running';
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
        {isStreaming && <ShimmerEffect />}
        <Brain
          size={12}
          className={cn(isStreaming && 'animate-pulse', 'relative z-10')}
        />
        <span className="relative z-10">
          {isStreaming
            ? 'Thinking...'
            : `Reasoning (${count} step${count > 1 ? 's' : ''})`}
        </span>
        {isStreaming && (
          <span className="ml-2 h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse relative z-10" />
        )}
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

export default Reasoning;
