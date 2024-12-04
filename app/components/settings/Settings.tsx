import { Dialog, DialogButton, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { useState } from 'react';
import { ThemeSelect } from './ThemeSelect';
import { TabButton } from './TabButton';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'appearance';

export function Settings({ open, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  console.log('Active Tab:', activeTab);

  return (
    <DialogRoot open={open}>
      <Dialog onClose={onClose} onBackdrop={onClose} className="w-[700px] max-w-[700px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-[200px] bg-black border-r border-bolt-elements-borderColor">
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
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-[#1E1E1E]">
            <div className="p-8">
              {activeTab === 'general' && (
                <>
                  <h2 className="text-xl font-medium text-white mb-8">Chat</h2>
                  <div className="flex flex-col gap-6">
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm text-white">Delete all chats</div>
                      <DialogButton type="danger">Delete all</DialogButton>
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'appearance' && (
                <>
                  <h2 className="text-xl font-medium text-white mb-8">Theme</h2>
                  <div className="flex flex-col gap-6">
                    <div className="flex w-full justify-between items-center">
                      <div className="text-sm text-white">Theme</div>
                      <ThemeSelect />
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
