import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, Animated, Easing } from 'react-native';
import { Menu } from 'lucide-react-native';

import { useAppData } from './src/hooks/useAppData';
import { globalStyles as styles } from './src/styles/globalStyles';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

import Sidebar from './src/components/Sidebar';
import SettingsModal from './src/components/SettingsModal';
import ModelSelectorModal from './src/components/ModelSelectorModal';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import LoadingScreen from './src/screens/LoadingScreen';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  
  const sidebarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: isSidebarOpen ? 1 : 0,
      duration: 600,
      easing: Easing.out(Easing.poly(3)),
      useNativeDriver: true,
    }).start();
  }, [isSidebarOpen]);

  const appData = useAppData();

  if (appData.isLoadingWorkspaces) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      {/* Header global visible si no hay chat activo */}
      {!activeCommandId && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu color="#A3A3A3" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pair Bot</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {activeCommandId ? (
        <ChatScreen commandId={activeCommandId} onClose={() => setActiveCommandId(null)} />
      ) : (
        <View style={styles.mainContainer}>
          <Sidebar 
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            sidebarAnim={sidebarAnim}
            workspaces={appData.workspaces}
            selectedWorkspace={appData.selectedWorkspace}
            setSelectedWorkspace={appData.setSelectedWorkspace}
            isLoadingWorkspaces={appData.isLoadingWorkspaces}
            chats={appData.chats}
            setActiveCommandId={setActiveCommandId}
            deleteChat={appData.deleteChat}
            clearWorkspaceChats={appData.clearWorkspaceChats}
            deleteWorkspace={appData.deleteWorkspace}
            setIsSettingsOpen={setIsSettingsOpen}
          />

          <Animated.View style={{ flex: 1, transform: [{ translateX: sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.85] }) }] }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.chatContainer}>
              <HomeScreen 
                selectedWorkspace={appData.selectedWorkspace}
                selectedProfileName={appData.selectedProfileName}
                setIsModelSelectorOpen={setIsModelSelectorOpen}
                setActiveCommandId={setActiveCommandId}
                fetchChats={appData.fetchChats}
              />
            </KeyboardAvoidingView>
          </Animated.View>

          <SettingsModal 
            visible={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            globalSettings={appData.globalSettings}
            onImportConfig={() => appData.handleImportConfig(() => setIsSettingsOpen(false))}
          />

          <ModelSelectorModal 
            visible={isModelSelectorOpen}
            onClose={() => setIsModelSelectorOpen(false)}
            llmProfiles={appData.llmProfiles}
            selectedProfileName={appData.selectedProfileName}
            setSelectedProfileName={appData.setSelectedProfileName}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
