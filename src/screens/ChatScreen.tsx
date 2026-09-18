import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { ArrowUp, ChevronLeft, Folder, Paperclip } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase, supabaseBucketName } from '../lib/supabase';
import { ContextMeterMobile } from '../components/ContextMeterMobile';

interface ChatScreenProps {
  commandId: string;
  onClose: () => void;
}

const ChatMessageImage = ({ url, hasTextContent }: { url: string; hasTextContent: boolean }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View style={{ marginTop: hasTextContent ? 8 : 0 }}>
        <Image 
          source={require('../../assets/deleted-image-placeholder.png')} 
          style={{ width: 200, height: 200, borderRadius: 8 }} 
          resizeMode="cover" 
        />
        <Text style={{ color: '#A3A3A3', fontSize: 10, marginTop: 4, fontStyle: 'italic', maxWidth: 200 }}>
          Imagen de la mascota una vez se elimine ya que se procese por la ia, para ahorrar espacio.
        </Text>
      </View>
    );
  }

  return (
    <Image 
      source={{ uri: url }} 
      style={{ width: 200, height: 200, borderRadius: 8, marginTop: hasTextContent ? 8 : 0 }} 
      resizeMode="cover" 
      onError={() => setHasError(true)}
    />
  );
};

export default function ChatScreen({ commandId, onClose }: ChatScreenProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  // Animación simple de "Pensando..." usando useEffect
  const [dots, setDots] = useState(".");
  useEffect(() => {
    let interval: any;
    if (loading || messages.length === 1) {
      interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? "." : prev + ".");
      }, 500);
    }
    return () => clearInterval(interval);
  }, [loading, messages.length]);

  useEffect(() => {
    // 1. Cargar el command para obtener el conversation_id y el prompt inicial
    const fetchInitialData = async () => {
      const { data: cmd } = await supabase.from('agent_commands').select('*').eq('id', commandId).single();
      if (cmd) {
        if (cmd.conversation_id) setConversationId(cmd.conversation_id);
        
        // Populate chatInfo para el header
        let workspaceName = '';
        if (cmd.workspace_id) {
          const { data: ws } = await supabase.from('workspaces').select('name').eq('id', cmd.workspace_id).single();
          if (ws) workspaceName = ws.name;
        }
        setChatInfo({ 
          title: cmd.prompt.replace(/\[PROFILE:.*?\]\n/, ''), 
          workspace: workspaceName, 
          status: cmd.status 
        });

        // Cargar mensajes existentes de supabase
        let query = supabase.from('agent_messages').select('*').order('created_at', { ascending: true });
        
        // Usar conversationId del estado, si no, intentar con cmd.conversation_id, y como último recurso command_id
        const currentConvId = conversationId || cmd?.conversation_id;
        
        if (currentConvId) {
          query = query.eq('conversation_id', currentConvId);
        } else {
          query = query.eq('command_id', commandId);
        }
        
        const { data: msgs } = await query;
        let finalMsgs = msgs || [];
        
        // Si no hay ningún mensaje del usuario en el historial para este comando (chat viejo), inyectar el inicial
        if (!finalMsgs.some(m => m.sender === 'user' && (m.command_id === commandId || m.content.includes(cmd.prompt.substring(0, 10))))) {
          finalMsgs = [{
            id: 'initial',
            sender: 'user',
            content: cmd.prompt.replace(/^\[PROFILE:.*?\]\n/, '')
          }, ...finalMsgs];
        }
          
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = finalMsgs.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
        setLoading(false);
      }
    };
    
    fetchInitialData();

    // 2. Suscribirse a actualizaciones del command (por si el conversation_id se asigna después)
    const cmdSub = supabase.channel(`cmd_${commandId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agent_commands', filter: `id=eq.${commandId}` }, (payload) => {
        if (payload.new.conversation_id && !conversationId) {
          setConversationId(payload.new.conversation_id);
        }
      }).subscribe();

    // 3. Suscribirse a nuevos mensajes o actualizaciones de mensajes existentes (streaming)
    const filter = conversationId ? `conversation_id=eq.${conversationId}` : `command_id=eq.${commandId}`;
    const channelName = conversationId ? `msgs_conv_${conversationId}` : `msgs_cmd_${commandId}`;

    const msgSub = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_messages', filter }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(cmdSub);
      supabase.removeChannel(msgSub);
    };
  }, [commandId, conversationId]);

  const handleSendMessage = async () => {
    let textToSend = inputText.trim();
    if (!textToSend && !imageUri) return;
    
    setInputText("");

    setIsUploading(true);
    let finalPrompt = textToSend;

    // Subir imagen si existe
    if (imageUri) {
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        const { data, error } = await supabase.storage.from(supabaseBucketName).upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
        });
        
        if (error) {
           console.error("Upload error:", error);
           throw error;
        }
        
        if (data) {
          const { data: publicUrlData } = supabase.storage.from(supabaseBucketName).getPublicUrl(data.path);
          finalPrompt += (finalPrompt ? '\n' : '') + `[IMAGE: ${publicUrlData.publicUrl}]`;
        }
      } catch (e) {
        console.error("Error uploading image:", e);
      }
    }
    
    setImageUri(null);
    setIsUploading(false);

    const { data: cmd } = await supabase.from('agent_commands').select('workspace_id, conversation_id').eq('id', commandId).single();
    const currentConvId = conversationId || cmd?.conversation_id;

    // 1. Guardar mensaje de usuario en base de datos para que se vea en el chat y se refleje en otros dispositivos
    await supabase.from('agent_messages').insert({
      conversation_id: currentConvId,
      command_id: commandId,
      sender: 'user',
      content: finalPrompt
    });

    // 2. Enviar a la tabla de agent_commands para que el PC lo atrape y siga
    await supabase.from('agent_commands').insert({
      prompt: finalPrompt,
      status: 'pending',
      conversation_id: currentConvId,
      workspace_id: cmd?.workspace_id || null
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ChevronLeft color="#A3A3A3" size={24} />
          </TouchableOpacity>

          {chatInfo && (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
              <View style={[styles.statusIndicator, { backgroundColor: chatInfo.status === 'running' ? '#3b82f6' : '#10b981' }]} />
              <Text style={styles.headerTitle} numberOfLines={1}>{chatInfo.title}</Text>
              
              {chatInfo.workspace ? (
                <View style={styles.workspacePill}>
                  <Folder color="#A3A3A3" size={12} />
                  <Text style={styles.headerWorkspaceText} numberOfLines={1}>{chatInfo.workspace}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <View key={msg.id || index} style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}>
              <Text style={styles.senderName}>{isUser ? 'Tú' : 'Agente'}</Text>
              {(() => {
                const imageRegex = /\[IMAGE:\s*(.+?)\]/g;
                let imageUrls: string[] = [];
                let match;
                let textContent = msg.content;
                
                while ((match = imageRegex.exec(msg.content)) !== null) {
                  imageUrls.push(match[1]);
                }
                textContent = textContent.replace(imageRegex, '').trim();
            
                // Remover etiquetas de profile si es que llegaron hasta acá
                const profileRegex = /\[PROFILE:(.+?)\]/g;
                textContent = textContent.replace(profileRegex, '').trim();
            
                return (
                  <View>
                    {!!textContent && (
                      isUser ? (
                        <Text style={styles.messageText}>{textContent}</Text>
                      ) : (
                        <Markdown style={markdownStyles}>{textContent}</Markdown>
                      )
                    )}
                    {imageUrls.map((url, idx) => (
                      <ChatMessageImage key={idx} url={url} hasTextContent={!!textContent} />
                    ))}
                  </View>
                );
              })()}
            </View>
          );
        })}
        {messages.length === 1 && !loading && (
          <View style={[styles.messageBubble, styles.agentBubble]}>
             <Text style={styles.thinkingText}>Pensando{dots}</Text>
          </View>
        )}
      </ScrollView>

      {/* Caja de texto idéntica a la de Home */}
      <View style={styles.bottomWrapper}>
        <View style={styles.inputContainerBox}>
          {imageUri && (
            <View style={{ paddingBottom: 8, flexDirection: 'row' }}>
              <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
              <TouchableOpacity onPress={() => setImageUri(null)} style={{ position: 'absolute', top: -4, left: 52, backgroundColor: '#333', borderRadius: 12, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>X</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputTopRow}>
            <TextInput
              style={styles.textInputBox}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#A3A3A3"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <View style={styles.inputBottomRow}>
            <TouchableOpacity onPress={pickImage} style={{ padding: 4, marginRight: 8 }}>
               <Paperclip color="#A3A3A3" size={20} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ContextMeterMobile textLength={inputText.length} messageCount={messages.length} />
              <TouchableOpacity 
                style={[styles.sendBtn, (inputText.trim() || imageUri) && !isUploading ? styles.sendBtnActive : null]}
                onPress={handleSendMessage}
                disabled={(!inputText.trim() && !imageUri) || isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#A3A3A3" size="small" />
                ) : (
                  <ArrowUp color={(inputText.trim() || imageUri) && !isUploading ? "#525252" : "#A3A3A3"} size={18} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#181818',
  },
  backButton: { marginRight: 8 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  headerTitle: { color: '#fafafa', fontSize: 14, fontWeight: '500', flex: 1 },
  workspacePill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 8, 
    paddingLeft: 8, 
    borderLeftWidth: 1, 
    borderLeftColor: '#242424' 
  },
  headerWorkspaceText: { color: '#A3A3A3', fontSize: 12, marginLeft: 4, maxWidth: 100 },
  headerTitle: { color: '#fafafa', fontSize: 16, fontWeight: '600', flex: 1 },
  messagesContainer: { flex: 1, padding: 16 },
  messageBubble: { padding: 12, borderRadius: 12, marginBottom: 12, maxWidth: '85%' },
  userBubble: { backgroundColor: '#242424', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  agentBubble: { backgroundColor: '#181818', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  senderName: { color: '#A3A3A3', fontSize: 12, marginBottom: 4 },
  messageText: { color: '#fafafa', fontSize: 14, lineHeight: 20 },
  thinkingText: { color: '#A3A3A3', fontSize: 14, fontStyle: 'italic' },
  emptyText: { color: '#525252', textAlign: 'center', marginTop: 40 },
  bottomWrapper: {
    padding: 16,
    backgroundColor: '#0A0A0A'
  },
  inputContainerBox: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242424',
  },
  inputTopRow: {
    minHeight: 40,
    marginBottom: 8,
  },
  textInputBox: {
    color: '#fafafa',
    fontSize: 14,
    maxHeight: 120,
    padding: 0
  },
  inputBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242424'
  },
  sendBtnActive: {
    backgroundColor: '#ffffff',
  }
});

const markdownStyles = StyleSheet.create({
  body: {
    color: '#fafafa',
    fontSize: 14,
    lineHeight: 22,
  },
  code_inline: {
    backgroundColor: '#242424',
    color: '#fafafa',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    overflow: 'hidden'
  },
  fence: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242424',
    marginVertical: 8,
  },
  code_block: {
    backgroundColor: '#000000',
    color: '#A3A3A3',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  heading1: { fontWeight: 'bold', fontSize: 18, marginVertical: 8, color: '#fafafa' },
  heading2: { fontWeight: 'bold', fontSize: 16, marginVertical: 8, color: '#fafafa' },
  strong: { fontWeight: 'bold', color: '#ffffff' },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
});
