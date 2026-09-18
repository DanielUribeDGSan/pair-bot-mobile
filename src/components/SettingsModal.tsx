import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { X, ChevronLeft, ChevronRight, Bot, Cpu, Zap, Database, ShieldCheck, Folder, Key } from 'lucide-react-native';

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  globalSettings: any;
  onImportConfig: () => void;
};

export default function SettingsModal({ visible, onClose, globalSettings, onImportConfig }: SettingsModalProps) {
  const settingsScrollRef = useRef<ScrollView>(null);
  const [settingsScrollX, setSettingsScrollX] = useState(0);
  const [settingsLayoutWidth, setSettingsLayoutWidth] = useState(0);
  const [settingsContentWidth, setSettingsContentWidth] = useState(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState("Aplicación");
  const maxSettingsScrollX = Math.max(0, settingsContentWidth - settingsLayoutWidth);

  const TABS = [
    { name: 'Agente', icon: Bot },
    { name: 'LLM', icon: Cpu },
    { name: 'Condensador', icon: Zap },
    { name: 'Contexto del agente', icon: Database },
    { name: 'Verificación', icon: ShieldCheck },
    { name: 'Aplicación', icon: Folder },
    { name: 'Secretos', icon: Key }
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.settingsContainer}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeaderTitle}>Configuración</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#A3A3A3" size={24} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.settingsBody, { flexDirection: 'column' }]}>
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#242424', flexDirection: 'row', alignItems: 'center' }}>
            {settingsScrollX > 0 && (
              <TouchableOpacity onPress={() => settingsScrollRef.current?.scrollTo({ x: Math.max(0, settingsScrollX - 150), animated: true })} style={{ padding: 8 }}>
                <ChevronLeft color="#fafafa" size={20} />
              </TouchableOpacity>
            )}
            
            <ScrollView 
              ref={settingsScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
              onScroll={(e) => setSettingsScrollX(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={16}
              onContentSizeChange={(w) => setSettingsContentWidth(w)}
              onLayout={(e) => setSettingsLayoutWidth(e.nativeEvent.layout.width)}
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSettingsTab === tab.name;
                return (
                  <TouchableOpacity 
                    key={tab.name}
                    style={[
                      styles.settingsTab, 
                      isActive && styles.settingsTabActive,
                      { flexDirection: 'row', alignItems: 'center', marginRight: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }
                    ]}
                    onPress={() => setActiveSettingsTab(tab.name)}
                  >
                    <Icon color={isActive ? "#fafafa" : "#A3A3A3"} size={16} />
                    <Text style={[
                      styles.settingsTabText, 
                      isActive && { color: '#fafafa' }, 
                      { marginLeft: 8 }
                    ]}>
                      {tab.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {maxSettingsScrollX > 0 && settingsScrollX < maxSettingsScrollX - 5 && (
              <TouchableOpacity onPress={() => settingsScrollRef.current?.scrollTo({ x: settingsScrollX + 150, animated: true })} style={{ padding: 8 }}>
                <ChevronRight color="#fafafa" size={20} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.settingsContent}>
            {activeSettingsTab === 'Aplicación' ? (
              <>
                <Text style={styles.settingsContentTitle}>Aplicación</Text>
                <Text style={styles.settingsContentSubtitle}>Idioma, tema, notificaciones e identidad de Git.</Text>
                
                <View style={styles.settingsSection}>
                   <Text style={styles.settingsLabel}>Idioma</Text>
                   <View style={styles.settingsInput}><Text style={{ color: '#fafafa' }}>{globalSettings?.settings?.language || 'Español'}</Text></View>
                </View>

                <View style={styles.settingsSection}>
                   <Text style={styles.settingsLabel}>Tema de color</Text>
                   <View style={styles.settingsInput}><Text style={{ color: '#fafafa' }}>OpenHands-Neutral</Text></View>
                </View>

                <View style={[styles.settingsSection, { borderTopWidth: 1, borderTopColor: '#242424', paddingTop: 24, marginTop: 24 }]}>
                   <Text style={styles.settingsContentTitle}>Sincronización Móvil</Text>
                   <Text style={styles.settingsContentSubtitle}>
                     Importa el archivo JSON que descargaste desde tu aplicación de escritorio para sincronizar tus espacios de trabajo, perfiles LLM y configuración.
                   </Text>
                   <TouchableOpacity style={styles.importBtn} onPress={onImportConfig}>
                     <Text style={styles.importBtnText}>Importar configuración (.json)</Text>
                   </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.settingsContentTitle}>{activeSettingsTab}</Text>
                <Text style={styles.settingsContentSubtitle}>Configuración importada de tu entorno de escritorio.</Text>
                <View style={styles.settingsSection}>
                   <Text style={styles.settingsLabel}>Valores sincronizados (Sólo lectura)</Text>
                   <View style={[styles.settingsInput, { height: 200, backgroundColor: '#0a0a0a' }]}>
                     <Text style={{ color: '#A3A3A3', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 }}>
                       {globalSettings ? JSON.stringify(globalSettings.settings?.[activeSettingsTab.toLowerCase().replace(/ /g, '_')] || globalSettings.llmProfiles, null, 2).slice(0, 500) + '...' : 'Aún no has importado tu configuración.'}
                     </Text>
                   </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  settingsContainer: { flex: 1, backgroundColor: '#181818' },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#242424' },
  settingsHeaderTitle: { color: '#fafafa', fontSize: 18, fontWeight: '600' },
  settingsBody: { flex: 1 },
  settingsTab: { flexDirection: 'row', alignItems: 'center' },
  settingsTabActive: { backgroundColor: '#242424' },
  settingsTabText: { color: '#A3A3A3', fontSize: 14, fontWeight: '500' },
  settingsContent: { flex: 1, padding: 24 },
  settingsContentTitle: { color: '#fafafa', fontSize: 20, fontWeight: '500', marginBottom: 4 },
  settingsContentSubtitle: { color: '#A3A3A3', fontSize: 14, marginBottom: 24 },
  settingsSection: { marginBottom: 16 },
  settingsLabel: { color: '#fafafa', fontSize: 14, marginBottom: 8 },
  settingsInput: { backgroundColor: '#171717', borderWidth: 1, borderColor: '#242424', padding: 12, borderRadius: 8 },
  importBtn: { backgroundColor: '#242424', padding: 12, borderRadius: 8, alignSelf: 'flex-start', marginTop: 12 },
  importBtnText: { color: '#fafafa', fontWeight: '500' }
});
