import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#181818' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#181818' },
  headerTitle: { color: 'white', fontWeight: '500', fontSize: 16 },
  mainContainer: { flex: 1, flexDirection: 'row' },
  
  /* Sidebar Styles */
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
  
  /* Chat Container Styles */
  chatContainer: { flex: 1, backgroundColor: '#181818' },
  welcomeScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  welcomeTitle: { fontSize: 28, fontWeight: '600', color: '#fafafa', marginBottom: 40, textAlign: 'center' },
  
  inputContainer: { width: '100%', maxWidth: 600, backgroundColor: '#171717', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#242424' },
  inputTopRow: { marginBottom: 12 },
  input: { color: '#fafafa', fontSize: 16, maxHeight: 120, minHeight: 40 },
  
  inputBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modelSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171717', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, flexShrink: 1, marginRight: 8 },
  modelText: { color: '#A3A3A3', fontSize: 13, marginHorizontal: 6, flexShrink: 1 },
  
  sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: '#ffffff' },
  
  quickActions: { flexDirection: 'row', marginTop: 16, width: '100%', maxWidth: 600 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171717', borderWidth: 1, borderColor: '#242424', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  quickActionText: { color: '#A3A3A3', fontSize: 13, marginLeft: 6 },
  
  recommendationsContainer: { width: '100%', maxWidth: 600, marginTop: 48 },
  recommendationsTitle: { color: '#fafafa', fontWeight: '600', fontSize: 14, marginBottom: 16 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#222222', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#242424', flex: 1 },
  cardTitle: { color: '#fafafa', fontWeight: '500', fontSize: 14, marginBottom: 4 },
  cardDesc: { color: '#A3A3A3', fontSize: 12, lineHeight: 16 },
  
  emptyText: { color: '#525252', textAlign: 'center', marginTop: 40 },
  skeletonContainer: { paddingHorizontal: 4, paddingVertical: 8 },
  skeletonLine: { height: 16, backgroundColor: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }
});
