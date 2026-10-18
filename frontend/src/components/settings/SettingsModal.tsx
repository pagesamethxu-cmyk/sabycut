import React from 'react';
import { SettingsPage, SettingsSection } from './SettingsPage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsSection;
  onSafeAreaDebugChange?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'account',
  onSafeAreaDebugChange
}) => {
  return (
    <SettingsPage
      isOpen={isOpen}
      onClose={onClose}
      initialSection={initialSection}
      onSafeAreaDebugChange={onSafeAreaDebugChange}
      user={null}
    />
  );
};

export default SettingsModal;
