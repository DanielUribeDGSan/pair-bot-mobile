import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Folder, Plus, ChevronDown, ArrowUp, Settings, Github, MessageSquare, Paperclip } from 'lucide-react-native';
import { supabase, supabaseBucketName } from '../lib/supabase';
import { globalStyles as styles } from '../styles/globalStyles';
import { Workspace } from '../hooks/useAppData';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { ContextMeterMobile } from '../components/ContextMeterMobile';

type HomeScreenProps = {
  selectedWorkspace: Workspace | null;
  selectedProfileName: string;
  setIsModelSelectorOpen: (open: boolean) => void;
  setActiveCommandId: (id: string | null) => void;
  fetchChats: () => void;
};

export default function HomeScreen({
  selectedWorkspace,
  selectedProfileName,
  setIsModelSelectorOpen,
  setActiveCommandId,
  fetchChats
}: HomeScreenProps) {
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSendPrompt = async () => {
    let textToSend = prompt.trim();
    if (!textToSend && !imageUri) return;
    try {
      setIsSending(true);
      let finalPrompt = textToSend;

      if (imageUri) {
        try {
          const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage.from(supabaseBucketName).upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
          });
          
          if (uploadError) throw uploadError;

          if (uploadData) {
            const { data: publicUrlData } = supabase.storage.from(supabaseBucketName).getPublicUrl(uploadData.path);
            finalPrompt = `[PROFILE:${selectedProfileName}]\n${finalPrompt ? finalPrompt + '\n' : ''}[IMAGE: ${publicUrlData.publicUrl}]`;
          }
        } catch (e) {
          console.error("Error uploading image:", e);
        }
      } else {
        finalPrompt = `[PROFILE:${selectedProfileName}]\n${finalPrompt}`;
      }
      
      setImageUri(null);
      
      let workspaceId = null;
      if (selectedWorkspace) {
        workspaceId = selectedWorkspace.id;
        if (workspaceId.startsWith('/')) {
          const { data } = await supabase.from('workspaces').select('id').eq('path', selectedWorkspace.path).single();
          if (data && data.id) {
            workspaceId = data.id;
          } else {
            const { data: newWp } = await supabase.from('workspaces').insert([{ 
              name: selectedWorkspace.name, 
              path: selectedWorkspace.path 
            }]).select('id').single();
            
            if (newWp && newWp.id) {
              workspaceId = newWp.id;
            } else {
              throw new Error("No se pudo encontrar ni crear el ID del workspace en la base de datos.");
            }
          }
        }
      }

      const insertData: any = { prompt: finalPrompt, status: 'pending' };
      if (workspaceId) insertData.workspace_id = workspaceId;

      const { data, error } = await supabase.from('agent_commands').insert([insertData]).select('id').single();
      if (error) throw error;
      setPrompt("");
      if (data && data.id) {
        // Guardar el primer mensaje en el historial formal
        await supabase.from('agent_messages').insert({
          command_id: data.id,
          sender: 'user',
          content: finalPrompt
        });
        
        setActiveCommandId(data.id);
        fetchChats();
      } else {
        alert("Tarea enviada, pero no se pudo abrir el chat en vivo.");
      }
    } catch (error) {
      console.error("Error sending task:", error);
      alert("Error al enviar la tarea.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.welcomeScreen}>
      <Text style={styles.welcomeTitle}>¡Comencemos a construir!</Text>
      
      {selectedWorkspace && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Folder color="#A3A3A3" size={14} />
          <Text style={{ color: '#A3A3A3', marginLeft: 8, fontSize: 13, fontWeight: '500' }}>
            Workspace: {selectedWorkspace.name}
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {imageUri && (
          <View style={{ padding: 12, paddingBottom: 0, flexDirection: 'row' }}>
            <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
            <TouchableOpacity onPress={() => setImageUri(null)} style={{ position: 'absolute', top: 4, left: 60, backgroundColor: '#333', borderRadius: 12, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputTopRow}>
          <TextInput 
            style={styles.input}
            placeholder="¿Qué quieres construir?"
            placeholderTextColor="#A3A3A3"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={500}
          />
        </View>
        
        <View style={styles.inputBottomRow}>
          <TouchableOpacity onPress={pickImage} style={{ padding: 4, marginRight: 8 }}>
            <Paperclip color="#A3A3A3" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.modelSelector} onPress={() => setIsModelSelectorOpen(true)}>
            <Plus color="#A3A3A3" size={16} />
            <Text style={styles.modelText} numberOfLines={1} ellipsizeMode="tail">{selectedProfileName}</Text>
            <ChevronDown color="#A3A3A3" size={16} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ContextMeterMobile textLength={prompt.length} />
            <TouchableOpacity 
              style={[styles.sendBtn, (prompt.trim() || imageUri) && !isSending ? styles.sendBtnActive : null]}
              onPress={handleSendPrompt}
              disabled={(!prompt.trim() && !imageUri) || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#A3A3A3" size="small" />
              ) : (
                <ArrowUp color={(prompt.trim() || imageUri) && !isSending ? "#525252" : "#A3A3A3"} size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn}>
          <Folder color="#A3A3A3" size={14} />
          <Text style={styles.quickActionText}>Abrir espacio de trabajo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn}>
          <Settings color="#A3A3A3" size={14} />
          <Text style={styles.quickActionText}>Plugins</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recommendationsContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={[styles.recommendationsTitle, { marginBottom: 0 }]}>Automatizaciones recomendadas</Text>
          <View style={{ backgroundColor: '#242424', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#333333' }}>
            <Text style={{ color: '#A3A3A3', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Próximamente</Text>
          </View>
        </View>
        <View style={styles.cardsRow}>
          <View style={[styles.card, { marginRight: 8 }]}>
            <Github color="#e5e5e5" size={20} style={{ marginBottom: 12 }} />
            <Text style={styles.cardTitle}>GitHub Code Review</Text>
            <Text style={styles.cardDesc}>Watch for a configurable label on GitHub pull requests...</Text>
          </View>
          <View style={[styles.card, { marginLeft: 8 }]}>
            <MessageSquare color="#a855f7" size={20} style={{ marginBottom: 12 }} />
            <Text style={styles.cardTitle}>Slack channel monitor</Text>
            <Text style={styles.cardDesc}>Watch Slack channels for @openhands mentions...</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
