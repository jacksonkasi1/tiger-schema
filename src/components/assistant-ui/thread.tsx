import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from '@/components/assistant-ui/attachment';
import { MarkdownText } from '@/components/assistant-ui/markdown-text';
import { Reasoning, ReasoningGroup } from '@/components/assistant-ui/reasoning';
import { ToolFallback } from '@/components/assistant-ui/tool-fallback';
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ActionBarPrimitive,
  AssistantIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
  Database,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import type { FC } from 'react';

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ['--thread-max-width' as string]: '100%',
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-3 pt-3"
      >
        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <ThreadWelcome />
        </AssistantIf>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-3 overflow-visible rounded-t-2xl bg-background pb-3">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-10 z-10 self-center rounded-full p-3 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon className="size-4" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-3">
          <div className="flex items-center gap-2 mb-2">
            <Database className="size-6 text-primary" />
            <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in font-semibold text-xl duration-200">
              Schema Assistant
            </h1>
          </div>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in text-muted-foreground text-sm delay-75 duration-200">
            I can help you design and modify your database schema. Try one of
            the suggestions below or ask me anything!
          </p>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const SUGGESTIONS = [
  {
    title: 'Create a users table',
    label: 'with email and profile fields',
    prompt:
      'Create a users table with id, email, name, avatar_url, and created_at columns',
    icon: Sparkles,
  },
  {
    title: 'Add a posts table',
    label: 'with foreign key to users',
    prompt:
      'Create a posts table with title, content, author_id (foreign key to users), and timestamps',
    icon: Wand2,
  },
  {
    title: 'List all tables',
    label: 'in the current schema',
    prompt: 'List all tables in the database',
    icon: Database,
  },
  {
    title: 'Design an e-commerce schema',
    label: 'products, orders, customers',
    prompt:
      'Design a basic e-commerce schema with products, customers, orders, and order_items tables',
    icon: Zap,
  },
] as const;

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions grid w-full grid-cols-1 @sm:grid-cols-2 gap-2 pb-3">
      {SUGGESTIONS.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <div
            key={suggestion.prompt}
            className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-200"
            style={{ animationDelay: `${100 + index * 50}ms` }}
          >
            <ThreadPrimitive.Suggestion prompt={suggestion.prompt} send asChild>
              <Button
                variant="ghost"
                className="aui-thread-welcome-suggestion h-auto w-full flex-col items-start justify-start gap-1 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted"
                aria-label={suggestion.prompt}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-primary" />
                  <span className="aui-thread-welcome-suggestion-text-1 font-medium">
                    {suggestion.title}
                  </span>
                </div>
                <span className="aui-thread-welcome-suggestion-text-2 text-muted-foreground text-xs">
                  {suggestion.label}
                </span>
              </Button>
            </ThreadPrimitive.Suggestion>
          </div>
        );
      })}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone className="aui-composer-attachment-dropzone flex w-full flex-col rounded-xl border border-input bg-background px-1 pt-1.5 outline-none transition-shadow has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50">
        <ComposerAttachments />
        <ComposerPrimitive.Input
          placeholder="Ask about your schema..."
          className="aui-composer-input mb-1 max-h-28 min-h-10 w-full resize-none bg-transparent px-3 pt-1.5 pb-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <ComposerAction />
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="aui-composer-action-wrapper relative mx-1.5 mb-1.5 flex items-center justify-between">
      <ComposerAddAttachment />

      <AssistantIf condition={({ thread }) => !thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            side="bottom"
            type="submit"
            variant="default"
            size="icon"
            className="aui-composer-send size-7 rounded-full"
            aria-label="Send message"
          >
            <ArrowUpIcon className="aui-composer-send-icon size-3.5" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AssistantIf>

      <AssistantIf condition={({ thread }) => thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-7 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-2.5 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AssistantIf>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-2 text-destructive text-xs dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-2 duration-150"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content wrap-break-word px-1 text-foreground leading-relaxed text-sm">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            Reasoning: Reasoning,
            ReasoningGroup: ReasoningGroup,
            tools: { Fallback: ToolFallback },
          }}
        />
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-1 flex">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-0.5 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-0.5 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy" className="size-7">
          <AssistantIf condition={({ message }) => message.isCopied}>
            <CheckIcon className="size-3.5" />
          </AssistantIf>
          <AssistantIf condition={({ message }) => !message.isCopied}>
            <CopyIcon className="size-3.5" />
          </AssistantIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.ExportMarkdown asChild>
        <TooltipIconButton tooltip="Export as Markdown" className="size-7">
          <DownloadIcon className="size-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.ExportMarkdown>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh" className="size-7">
          <RefreshCwIcon className="size-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(48px,1fr)_auto] content-start gap-y-1.5 px-1 py-2 duration-150 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word rounded-xl bg-muted px-3 py-2 text-foreground text-sm">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-1.5">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-3">
          <PencilIcon className="size-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-1 py-2">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-10 w-full resize-none bg-transparent p-3 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-2 mb-2 flex items-center gap-1.5 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" className="h-7 text-xs">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        'aui-branch-picker-root mr-1.5 -ml-1.5 inline-flex items-center text-muted-foreground text-xs',
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous" className="size-6">
          <ChevronLeftIcon className="size-3.5" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium text-xs">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next" className="size-6">
          <ChevronRightIcon className="size-3.5" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
