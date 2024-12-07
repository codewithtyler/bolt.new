import { Dialog, DialogButton, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { useState, useEffect } from 'react';
import { ThemeSelect } from './ThemeSelect';
import { TabButton } from './TabButton';
import { db } from '~/lib/persistence';
import { toast } from 'react-toastify';
import { useNavigate } from '@remix-run/react';
import { chatId } from '~/lib/persistence';
import { useStore } from '@nanostores/react';
import { tokenStore, fetchTokenInfo } from '~/lib/stores/tokens';
import { formatDistanceToNow, format, addMonths, differenceInHours } from 'date-fns';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'appearance' | 'tokens';

export function Settings({ open, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const navigate = useNavigate();
  const tokens = useStore(tokenStore);

  const resetDate = tokens.resetDate ? new Date(tokens.resetDate) : null;
  const now = new Date();

  // format the billing period as a date range
  const periodStart = resetDate ? format(resetDate, 'd MMMM yyyy') : 'unknown';
  const periodEnd = resetDate ? format(addMonths(resetDate, 1), 'd MMMM yyyy') : 'unknown';
  const billingPeriod = resetDate ? `${periodStart} - ${periodEnd}` : 'unknown';

  // smart reset timing display
  const resetIn = resetDate
    ? (() => {
        const nextReset = addMonths(resetDate, 1); // get next reset date
        const hoursLeft = differenceInHours(nextReset, now);

        if (hoursLeft < 24) {
          return `${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}`;
        }

        return formatDistanceToNow(nextReset, { addSuffix: true });
      })()
    : 'unknown';

  // fetch token info when settings opens
  useEffect(() => {
    if (open) {
      fetchTokenInfo();
    }
  }, [open]);

  const deleteAllChats = async () => {
    if (!db) {
      toast.error('Chat persistence is unavailable');
      return;
    }

    try {
      // delete all records from the chats store
      const transaction = db.transaction('chats', 'readwrite');
      const store = transaction.objectStore('chats');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // if we're currently viewing a chat, redirect to home
      if (chatId.get()) {
        navigate('/', { replace: true });
      }

      toast.success('All chats deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete chats');
      console.error(error);
    }
  };

  return (
    <DialogRoot open={open}>
      <Dialog onClose={onClose} onBackdrop={onClose} className="w-[700px] max-w-[700px] h-[500px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-[200px] bg-[#ffffff] dark:bg-[#0A0A0A] border-r border-bolt-elements-borderColor">
            <div className="p-3 flex flex-col gap-1">
              <TabButton
                icon="i-ph:gear-six-duotone"
                label="General"
                isActive={activeTab === 'general'}
                onClick={() => setActiveTab('general')}
              />
              <TabButton
                icon="i-ph:paint-brush-duotone"
                label="Appearance"
                isActive={activeTab === 'appearance'}
                onClick={() => setActiveTab('appearance')}
              />
              <TabButton
                icon="i-ph:coin-vertical-duotone"
                label="Tokens"
                isActive={activeTab === 'tokens'}
                onClick={() => setActiveTab('tokens')}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-[#fafafa] dark:bg-[#171717]">
            <div className="px-6 flex-1 relative overflow-y-auto text-[#000000] dark:text-white">
              {activeTab === 'general' && (
                <>
                  <h2 className="pt-6 text-lg font-medium mb-4 sticky bg-bolt-elements-background-depth-2 top-0">
                    Chat
                  </h2>
                  <div className="flex flex-col gap-6">
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm">Delete all chats</div>
                      <DialogButton type="danger" onClick={deleteAllChats}>
                        Delete all
                      </DialogButton>
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'appearance' && (
                <>
                  <h2 className="pt-6 text-lg font-medium mb-4 sticky bg-bolt-elements-background-depth-2 top-0">
                    Theme
                  </h2>
                  <div className="flex flex-col gap-6">
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm">Theme</div>
                      <ThemeSelect />
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'tokens' && (
                <>
                  <h2 className="pt-6 text-lg font-medium mb-4 sticky bg-bolt-elements-background-depth-2 top-0">
                    Usage
                  </h2>
                  <div className="flex flex-col gap-6">
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm">Billing period</div>
                      <div className="text-sm">{billingPeriod}</div>
                    </div>
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm">Monthly tokens reset in</div>
                      <div className="text-sm">{resetIn}</div>
                    </div>
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm">Per month</div>
                      <div className="text-sm">
                        {tokens.totalTokensRemaining.toLocaleString()} / {tokens.totalTokensLimit.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm">Requests remaining</div>
                      <div className="text-sm">
                        {tokens.requestsRemaining.toLocaleString()} / {tokens.requestsLimit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
