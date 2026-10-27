import { StyleSheet, Dimensions } from 'react-native';

export const c = { p: '#00BCD4', pl: '#C9F5FA', t: '#1B1F27', m: '#8A8F9C', b: '#DADDE4', soft: '#F3F4F6', star: '#F5B335', bg: '#fff' };

export const W = Dimensions.get('window').width;

export const S = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: c.t }, h2: { fontSize: 18, fontWeight: '700', color: c.t },
  muted: { color: c.m, fontSize: 14 }, row: { flexDirection: 'row', alignItems: 'center' }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  box: { borderWidth: 1, borderColor: c.b, borderRadius: 12, padding: 12, backgroundColor: '#fff' }, pad: { paddingHorizontal: 16 },
  input: { borderWidth: 1, borderColor: c.b, borderRadius: 10, padding: 12, fontSize: 16, color: c.t },
});
