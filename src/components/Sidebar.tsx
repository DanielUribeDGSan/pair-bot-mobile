import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { X, Search, Plus, Settings, Folder, ChevronDown, MessageSquare, Trash2, Eraser } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workspace } from '../hooks/useAppData';

type SidebarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sidebarAnim: Animated.Value;
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (w: Workspace | null) => void;
  isLoadingWorkspaces: boolean;
  chats: any[];
  setActiveCommandId: (id: string | null) => void;
  deleteChat: (id: string) => void;
  clearWorkspaceChats: (id: string) => void;
  deleteWorkspace: (id: string) => void;
  setIsSettingsOpen: (open: boolean) => void;
};

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarAnim,
  workspaces,
  selectedWorkspace,
  setSelectedWorkspace,
  isLoadingWorkspaces,
  chats,
  setActiveCommandId,
  deleteChat,
  clearWorkspaceChats,
  deleteWorkspace,
  setIsSettingsOpen
}: SidebarProps) {
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});

  const SkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonLine, { width: '75%', marginBottom: 8 }]} />
      <View style={[styles.skeletonLine, { width: '50%' }]} />
    </View>
  );

  return (
    <Animated.View 
      pointerEvents={isSidebarOpen ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill, 
        { zIndex: 10, opacity: sidebarAnim }
      ]}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} 
        activeOpacity={1} 
        onPress={() => setIsSidebarOpen(false)} 
      />
      <Animated.View style={[
        styles.sidebar,
        {
          transform: [
            { translateX: sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [-400, 0] }) }
          ]
        }
      ]}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
            <X color="#A3A3A3" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarSearch}>
           <Search color="#A3A3A3" size={18} />
           <Text style={styles.sidebarSearchText}>Search commands</Text>
        </View>

        <TouchableOpacity 
          style={styles.sidebarActionBtn}
          onPress={async () => {
            setSelectedWorkspace(null);
            setIsSidebarOpen(false);
            await AsyncStorage.removeItem('selectedWorkspace');
            setActiveCommandId(null);
          }}
        >
           <Plus color="#A3A3A3" size={18} />
           <Text style={styles.sidebarActionText}>Nuevo chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarActionBtn}>
           <Settings color="#A3A3A3" size={18} />
           <Text style={styles.sidebarActionText}>Personalizar</Text>
        </TouchableOpacity>

        <View style={styles.workspaceHeader}>
          <Text style={styles.workspaceSectionTitle}>Workspaces</Text>
          <View style={styles.workspaceIcons}>
            <Folder color="#A3A3A3" size={16} />
          </View>
        </View>
        
        <View style={styles.sidebarContent}>
          {isLoadingWorkspaces ? (
            <>
              <SkeletonLoader />
              <SkeletonLoader />
            </>
          ) : workspaces.length === 0 ? (
            <Text style={styles.emptyText}>No hay workspaces</Text>
          ) : (
            <ScrollView>
              {chats.filter(c => !c.workspace_id).length > 0 && (
                 <View style={styles.workspaceItemContainer}>
                   <TouchableOpacity 
                     style={styles.workspaceItem}
                     onPress={() => setExpandedWorkspaces(prev => ({...prev, 'global': !prev['global']}))}
                   >
                     <Folder color="#A3A3A3" size={16} />
                     <Text style={styles.workspaceText}>Global Chats</Text>
                     <ChevronDown color="#A3A3A3" size={16} />
                   </TouchableOpacity>
                   {expandedWorkspaces['global'] && chats.filter(c => !c.workspace_id).map(chat => (
                     <View key={chat.id} style={styles.chatRow}>
                       <TouchableOpacity 
                         style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                         onPress={() => { setIsSidebarOpen(false); setActiveCommandId(chat.id); }}
                       >
                         <MessageSquare color="#525252" size={14} />
                         <Text style={styles.chatRowTitle} numberOfLines={1}>
                           {chat.prompt.replace(/\[PROFILE:.*?\]\n/, '')}
                         </Text>
                       </TouchableOpacity>
                       <TouchableOpacity onPress={() => deleteChat(chat.id)}>
                         <Trash2 color="#525252" size={14} />
                       </TouchableOpacity>
                     </View>
                   ))}
                 </View>
              )}

              {workspaces.map((item) => {
                const workspaceChats = chats.filter(c => c.workspace_id === item.id);
                const isExpanded = expandedWorkspaces[item.id] !== false;

                return (
                  <View key={item.id} style={styles.workspaceItemContainer}>
                    <View style={[styles.workspaceItem, { justifyContent: 'space-between' }]}>
                      <TouchableOpacity 
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                        onPress={async () => {
                          setSelectedWorkspace(item);
                          await AsyncStorage.setItem('selectedWorkspace', JSON.stringify(item));
                          setExpandedWorkspaces(prev => ({...prev, [item.id]: !isExpanded}));
                        }}
                      >
                        <Folder color="#A3A3A3" size={16} />
                        <Text style={[styles.workspaceText, selectedWorkspace?.id === item.id && styles.workspaceTextSelected]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={async () => {
                           setSelectedWorkspace(item);
                           await AsyncStorage.setItem('selectedWorkspace', JSON.stringify(item));
                           setIsSidebarOpen(false);
                           setActiveCommandId(null);
                        }}>
                          <Plus color="#A3A3A3" size={14} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => clearWorkspaceChats(item.id)}>
                          <Eraser color="#A3A3A3" size={14} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteWorkspace(item.id)}>
                          <Trash2 color="#A3A3A3" size={14} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {isExpanded && workspaceChats.map(chat => (
                      <View key={chat.id} style={styles.chatRow}>
                         <TouchableOpacity 
                           style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                           onPress={() => { setIsSidebarOpen(false); setActiveCommandId(chat.id); }}
                         >
                           <MessageSquare color={chat.status === 'running' ? "#3b82f6" : "#525252"} size={14} />
                           <Text style={styles.chatRowTitle} numberOfLines={1}>
                             {chat.prompt.replace(/\[PROFILE:.*?\]\n/, '')}
                           </Text>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => deleteChat(chat.id)}>
                           <Trash2 color="#525252" size={14} />
                         </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
        
        <View style={styles.sidebarFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Local PC</Text>
              <ChevronDown color="#A3A3A3" size={14} style={{ marginLeft: 4 }} />
            </View>
            <TouchableOpacity onPress={() => { setIsSidebarOpen(false); setIsSettingsOpen(true); }} style={{ padding: 4 }}>
              <Settings color="#A3A3A3" size={18} />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerBrand}>Pair Bot - Built with OpenHands</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: { position: 'absolute', zIndex: 10, height: '100%', width: '85%', backgroundColor: '#222222', borderRightWidth: 1, borderRightColor: '#242424', padding: 12 },
  sidebarSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#242424' },
  sidebarSearchText: { color: '#A3A3A3', marginLeft: 10, fontSize: 15, flex: 1 },
  sidebarActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  sidebarActionText: { color: '#A3A3A3', fontSize: 14, marginLeft: 12 },
  workspaceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8, paddingHorizontal: 4 },
  workspaceSectionTitle: { color: '#A3A3A3', fontSize: 12, fontWeight: '500' },
  workspaceIcons: { flexDirection: 'row' },
  sidebarContent: { flex: 1 },
  workspaceItemContainer: { marginBottom: 12 },
  workspaceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  workspaceText: { marginLeft: 8, color: '#A3A3A3', fontSize: 14 },
  workspaceTextSelected: { color: 'white', fontWeight: '500' },
  chatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingLeft: 32, paddingRight: 4 },
  chatRowTitle: { color: '#A3A3A3', fontSize: 13, marginLeft: 8, flex: 1 },
  sidebarFooter: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#242424' },
  statusIndicator: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#10b981', marginLeft: 4 },
  statusText: { color: '#A3A3A3', fontSize: 13, marginLeft: 8 },
  footerBrand: { color: '#525252', fontSize: 11, marginTop: 16, marginLeft: 4 },
  emptyText: { color: '#525252', textAlign: 'center', marginTop: 40 },
  skeletonContainer: { paddingHorizontal: 4, paddingVertical: 8 },
  skeletonLine: { height: 16, backgroundColor: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }
});
