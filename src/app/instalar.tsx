import React, { useState } from 'react';
import { router } from 'expo-router';
import { declineInstallOffer } from '../pwa/installOffer';
import { useInstallPlatform } from '../pwa/useInstallPlatform';
import { useInstallPrompt } from '../pwa/useInstallPrompt';
import { InstallScreen } from '../screens/InstallScreen';

export default function InstallRoute() {
  const platform = useInstallPlatform();
  const { canPrompt, prompt } = useInstallPrompt();
  const [justInstalled, setJustInstalled] = useState(false);
  return (
    <InstallScreen
      platform={platform}
      // Safari de iPhone no tiene diálogo de instalación: solo se muestran sus pasos.
      canPrompt={canPrompt && platform !== 'ios'}
      justInstalled={justInstalled}
      onInstall={() => prompt().then((r) => setJustInstalled(r === 'accepted'))}
      onOpen={() => {
        declineInstallOffer();
        router.replace('/');
      }}
    />
  );
}
