import React from 'react';
import { Modal, Pressable, View, TextInput, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ModelSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  llmProfiles: any[];
  selectedProfileName: string;
  setSelectedProfileName: (name: string) => void;
};

export default function ModelSelectorModal({ visible, onClose, llmProfiles, selectedProfileName, setSelectedProfileName }: ModelSelectorModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modelDropdown} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modelDropdownHeader}>
            <Search color="#A3A3A3" size={16} />
            <TextInput 
              style={styles.modelSearchInput} 
              placeholder="Buscar modelo o escribir manual..." 
              placeholderTextColor="#A3A3A3" 
            />
          </View>
          <Text style={styles.modelDropdownSubtitle}>PERFILES DISPONIBLES</Text>
          {llmProfiles.length === 0 ? (
            <Text style={{ color: '#525252', padding: 12 }}>No hay perfiles. Ve a Configuración e importa tu .json</Text>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {llmProfiles.map((item) => {
                const isSelected = selectedProfileName === item.name;
                return (
                  <TouchableOpacity 
                    key={item.name}
                    style={[styles.modelItem, isSelected && { backgroundColor: '#242424' }]}
                    onPress={async () => {
                      setSelectedProfileName(item.name);
                      onClose();
                      await AsyncStorage.setItem('selectedProfileName', item.name);
                    }}
                  >
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: '#fafafa', fontSize: 14, fontWeight: '500' }}>{item.name}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: '#A3A3A3', fontSize: 12, marginTop: 2 }}>{item.model}</Text>
                  </View>
                </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modelDropdown: { width: '80%', maxWidth: 400, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#242424', maxHeight: '60%' },
  modelDropdownHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#242424', backgroundColor: '#1a1a1a', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modelSearchInput: { color: '#fafafa', marginLeft: 8, fontSize: 14, flex: 1 },
  modelDropdownSubtitle: { color: '#525252', fontSize: 11, fontWeight: '600', padding: 12, paddingBottom: 4 },
  modelItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#242424' }
});
