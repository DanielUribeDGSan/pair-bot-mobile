import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { supabase, reinitializeSupabase, supabaseBucketName } from '../lib/supabase';

export type Workspace = { id: string; name: string; path: string };

export function useAppData() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [llmProfiles, setLlmProfiles] = useState<any[]>([]);
  const [selectedProfileName, setSelectedProfileName] = useState<string>("NVIDIA");

  useEffect(() => {
    loadLocalConfig();
  }, []);

  const cleanupOldStorageImages = async () => {
    try {
      const { data: files, error } = await supabase.storage.from(supabaseBucketName).list();
      if (error || !files) return;

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const filesToRemove = files
        .filter(f => new Date(f.created_at) < oneDayAgo && f.name !== '.emptyFolderPlaceholder')
        .map(f => f.name);

      if (filesToRemove.length > 0) {
        await supabase.storage.from(supabaseBucketName).remove(filesToRemove);
        console.log(`Cleaned up ${filesToRemove.length} old images`);
      }
    } catch (e) {
      console.error("Error cleaning up old images", e);
    }
  };

  const loadLocalConfig = async () => {
    try {
      const storedSupabaseUrl = await AsyncStorage.getItem('supabase_url');
      const storedSupabaseKey = await AsyncStorage.getItem('supabase_anon_key');
      const storedSupabaseBucket = await AsyncStorage.getItem('supabase_bucket');
      
      if (storedSupabaseUrl && storedSupabaseKey) {
        reinitializeSupabase(storedSupabaseUrl, storedSupabaseKey, storedSupabaseBucket || undefined);
      }

      const storedSettings = await AsyncStorage.getItem('globalSettings');
      const storedProfiles = await AsyncStorage.getItem('llmProfiles');
      const storedProfileName = await AsyncStorage.getItem('selectedProfileName');
      const storedWorkspaces = await AsyncStorage.getItem('workspaces');
      const storedSelectedWorkspace = await AsyncStorage.getItem('selectedWorkspace');
      
      if (storedSettings) setGlobalSettings(JSON.parse(storedSettings));
      if (storedProfiles) setLlmProfiles(JSON.parse(storedProfiles));
      if (storedProfileName) setSelectedProfileName(storedProfileName);
      
      fetchWorkspaces();
      fetchChats();
      cleanupOldStorageImages();

      if (storedSelectedWorkspace) {
        setSelectedWorkspace(JSON.parse(storedSelectedWorkspace));
      }
    } catch (e) {
      console.error("Failed to load local config", e);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      setIsLoadingWorkspaces(true);
      const { data, error } = await supabase.from('workspaces').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setWorkspaces(data || []);
      await AsyncStorage.setItem('workspaces', JSON.stringify(data || []));
      if (data && data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(data[0]);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const fetchChats = async () => {
    try {
      const { data } = await supabase.from('agent_commands').select('*').order('created_at', { ascending: false });
      if (data) {
        const grouped: any[] = [];
        const seenConversations = new Set();
        
        for (const cmd of data) {
          if (cmd.conversation_id) {
            if (!seenConversations.has(cmd.conversation_id)) {
              seenConversations.add(cmd.conversation_id);
              grouped.push(cmd);
            }
          } else {
            grouped.push(cmd);
          }
        }
        setChats(grouped);
      } else {
        setChats([]);
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    }
  };

  const deleteStorageImagesForCommands = async (commandIds: string[]) => {
    try {
      const { data: messages } = await supabase.from('agent_messages').select('content').in('command_id', commandIds);
      if (messages && messages.length > 0) {
        const imageRegex = /\[IMAGE:\s*(.+?)\]/g;
        let pathsToRemove: string[] = [];
        messages.forEach(msg => {
          let match;
          while ((match = imageRegex.exec(msg.content)) !== null) {
            const url = match[1];
            const parts = url.split(`/${supabaseBucketName}/`);
            if (parts.length > 1) {
              pathsToRemove.push(parts[1]);
            }
          }
        });
        if (pathsToRemove.length > 0) {
          const { error } = await supabase.storage.from(supabaseBucketName).remove(pathsToRemove);
          if (error) {
            console.error("Storage delete error:", error);
            Alert.alert("Aviso de Supabase", `Las imágenes no se pudieron borrar. Necesitas habilitar permisos de 'DELETE' (Eliminar) en las políticas (Policies) de tu bucket '${supabaseBucketName}' en Supabase.`);
          }
        }
      }
    } catch (e) {
      console.error("Error deleting storage images", e);
    }
  };

  const deleteChat = async (id: string) => {
    Alert.alert("Eliminar Chat", "¿Estás seguro de que deseas eliminar este chat?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          await deleteStorageImagesForCommands([id]);
          await supabase.from('agent_messages').delete().eq('command_id', id);
          await supabase.from('agent_commands').delete().eq('id', id);
          setChats(prev => prev.filter(c => c.id !== id));
      }}
    ]);
  };

  const clearWorkspaceChats = async (workspaceId: string) => {
    Alert.alert("Limpiar Workspace", "¿Eliminar todos los chats de este workspace?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpiar", style: "destructive", onPress: async () => {
          const { data: cmds } = await supabase.from('agent_commands').select('id').eq('workspace_id', workspaceId);
          if (cmds && cmds.length > 0) {
             const cmdIds = cmds.map(c => c.id);
             await deleteStorageImagesForCommands(cmdIds);
             await supabase.from('agent_messages').delete().in('command_id', cmdIds);
          }
          await supabase.from('agent_commands').delete().eq('workspace_id', workspaceId);
          setChats(prev => prev.filter(c => c.workspace_id !== workspaceId));
      }}
    ]);
  };

  const deleteWorkspace = async (workspaceId: string) => {
    Alert.alert("Eliminar Workspace", "¿Estás seguro de que deseas eliminar este workspace por completo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          const { data: cmds } = await supabase.from('agent_commands').select('id').eq('workspace_id', workspaceId);
          if (cmds && cmds.length > 0) {
             const cmdIds = cmds.map(c => c.id);
             await deleteStorageImagesForCommands(cmdIds);
             await supabase.from('agent_messages').delete().in('command_id', cmdIds);
          }
          await supabase.from('agent_commands').delete().eq('workspace_id', workspaceId);
          await supabase.from('workspaces').delete().eq('id', workspaceId);
          
          setChats(prev => prev.filter(c => c.workspace_id !== workspaceId));
          setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
          
          if (selectedWorkspace?.id === workspaceId) {
            setSelectedWorkspace(null);
            await AsyncStorage.removeItem('selectedWorkspace');
          }
      }}
    ]);
  };

  const handleImportConfig = async (onSuccess?: () => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const parsedConfig = JSON.parse(fileContent);

        if (parsedConfig) {
          if (parsedConfig.supabase_url && parsedConfig.supabase_anon_key) {
            await AsyncStorage.setItem('supabase_url', parsedConfig.supabase_url);
            await AsyncStorage.setItem('supabase_anon_key', parsedConfig.supabase_anon_key);
            if (parsedConfig.supabase_bucket) {
              await AsyncStorage.setItem('supabase_bucket', parsedConfig.supabase_bucket);
            }
            reinitializeSupabase(parsedConfig.supabase_url, parsedConfig.supabase_anon_key, parsedConfig.supabase_bucket);
          }

          setGlobalSettings(parsedConfig);
          await AsyncStorage.setItem('globalSettings', JSON.stringify(parsedConfig));
          
          if (parsedConfig.llmProfiles && parsedConfig.llmProfiles.profiles) {
            setLlmProfiles(parsedConfig.llmProfiles.profiles);
            await AsyncStorage.setItem('llmProfiles', JSON.stringify(parsedConfig.llmProfiles.profiles));
            
            if (parsedConfig.llmProfiles.active_profile) {
              const active = parsedConfig.llmProfiles.profiles.find((p:any) => p.name === parsedConfig.llmProfiles.active_profile);
              if (active) {
                setSelectedProfileName(active.name);
                await AsyncStorage.setItem('selectedProfileName', active.name);
              }
            }
          }

          if (parsedConfig.workspaces && parsedConfig.workspaces.workspaces) {
            const importedWorkspaces = parsedConfig.workspaces.workspaces;
            const { data: existingWorkspaces } = await supabase.from('workspaces').select('path');
            const existingPaths = new Set(existingWorkspaces?.map(w => w.path) || []);
            const newWorkspaces = importedWorkspaces.filter((w: any) => !existingPaths.has(w.path));
            
            if (newWorkspaces.length > 0) {
              const insertData = newWorkspaces.map((w: any) => ({
                name: w.name,
                path: w.path
              }));
              const { error: insertError } = await supabase.from('workspaces').insert(insertData);
              if (insertError) console.error("Error inserting workspaces:", insertError);
            }
            await fetchWorkspaces();
          }

          Alert.alert("Éxito", "Toda tu configuración y perfiles han sido importados correctamente.");
          if (onSuccess) onSuccess();
        } else {
          Alert.alert("Error", "El archivo JSON no es válido.");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Ocurrió un error al leer el archivo de configuración.");
    }
  };

  return {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    isLoadingWorkspaces,
    chats,
    globalSettings,
    llmProfiles,
    selectedProfileName,
    setSelectedProfileName,
    fetchChats,
    deleteChat,
    clearWorkspaceChats,
    deleteWorkspace,
    handleImportConfig
  };
}
