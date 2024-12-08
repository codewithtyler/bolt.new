import type { Message } from 'ai';
import React, { type RefCallback, memo, forwardRef } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { Menu } from '~/components/sidebar/Menu.client';

import styles from './BaseChat.module.scss';

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  _scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const EXAMPLE_PROMPTS = [
  { text: 'Start a blog with Astro' },
  { text: 'Build a mobile app with NativeScript' },
  { text: 'Create a docs site with Vitepress' },
  { text: 'Scaffold UI with shadcn' },
  { text: 'Draft a presentation with Slidev' },
  { text: 'Code a video with Remotion' },
];

const TEXTAREA_MIN_HEIGHT = 76;

export const BaseChat = memo(
  forwardRef<HTMLDivElement, BaseChatProps>(
    (
      {
        textareaRef,
        messageRef,
        _scrollRef,
        showChat = true,
        chatStarted = false,
        isStreaming = false,
        messages = [],
        enhancingPrompt = false,
        promptEnhanced = false,
        input = '',
        handleStop,
        sendMessage,
        handleInputChange,
        enhancePrompt,
      },
      ref,
    ) => {
      const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

      return (
        <div
          ref={ref}
          className={classNames(
            styles.BaseChat,
            'relative flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1',
          )}
          data-chat-visible={showChat}
        >
          <ClientOnly>{() => <Menu />}</ClientOnly>
          <div ref={_scrollRef} className="flex overflow-y-auto w-full h-full">
            <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
              {!chatStarted && (
                <div id="intro" className="mt-[15vh] max-w-xl mx-auto mb-2">
                  {/* Header */}
                  <h1 className="text-[44px] text-center font-semibold text-bolt-elements-textPrimary tracking-tight">
                    What do you want to build?
                  </h1>
                  {/* Subheader */}
                  <p className="mb-2 text-center text-bolt-elements-textSecondary">
                    Prompt, run, edit, and deploy full-stack web apps.
                  </p>
                </div>
              )}
              <div
                className={classNames('pt-0 px-4', {
                  'h-full flex flex-col': chatStarted,
                })}
              >
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        ref={messageRef}
                        className="flex flex-col w-full flex-1 max-w-chat pb-6 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                      />
                    ) : null;
                  }}
                </ClientOnly>
                <div
                  className={classNames('relative w-full max-w-[550px] mx-auto z-prompt', {
                    'sticky bottom-0': chatStarted,
                  })}
                >
                  <div
                    className={classNames(
                      'shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden',
                    )}
                  >
                    {/* Prompt textarea */}
                    <textarea
                      ref={textareaRef}
                      className={`w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent`}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          if (event.shiftKey) {
                            return;
                          }

                          event.preventDefault();

                          sendMessage?.(event);
                        }
                      }}
                      value={input}
                      onChange={(event) => {
                        handleInputChange?.(event);
                      }}
                      style={{
                        minHeight: TEXTAREA_MIN_HEIGHT,
                        maxHeight: TEXTAREA_MAX_HEIGHT,
                      }}
                      placeholder="How can Bolt help you today?"
                      translate="no"
                    />
                    <ClientOnly>
                      {() => (
                        <SendButton
                          show={input.length > 0 || isStreaming}
                          isStreaming={isStreaming}
                          onClick={(event) => {
                            if (isStreaming) {
                              handleStop?.();
                              return;
                            }

                            sendMessage?.(event);
                          }}
                        />
                      )}
                    </ClientOnly>
                    <div className="flex justify-between text-sm p-4 pt-2">
                      <div className="flex gap-1 items-center">
                        <IconButton
                          title="Enhance prompt"
                          disabled={input.length === 0 || enhancingPrompt}
                          className={classNames({
                            'opacity-100!': enhancingPrompt,
                            'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!':
                              promptEnhanced,
                          })}
                          onClick={() => enhancePrompt?.()}
                        >
                          {enhancingPrompt ? (
                            <>
                              <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl"></div>
                              <div className="ml-1.5">Enhancing prompt...</div>
                            </>
                          ) : (
                            <>
                              <div className="i-bolt:stars text-xl"></div>
                              {promptEnhanced && <div className="ml-1.5">Prompt enhanced</div>}
                            </>
                          )}
                        </IconButton>
                      </div>
                      {input.length > 3 ? (
                        <div className="text-xs text-bolt-elements-textTertiary">
                          Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="bg-bolt-elements-background-depth-1 pb-6">{/* Ghost Element */}</div>
                </div>
              </div>
              {!chatStarted && (
                <div id="examples" className="relative w-full max-w-[600px] mx-auto mt-8 flex justify-center">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
                      <button
                        key={index}
                        onClick={(event) => {
                          sendMessage?.(event, examplePrompt.text);
                        }}
                        className="group flex items-center px-2.5 py-1 rounded-full bg-transparent text-[#888] hover:text-white transition-all text-[11px] font-normal border border-[#333]"
                      >
                        {examplePrompt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      );
    },
  ),
);
