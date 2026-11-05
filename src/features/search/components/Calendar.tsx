import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();

type CalendarProps = {
  start?: Date;
  end?: Date;
  onPick: (d: Date) => void;
  /** Trả về true cho những ngày không chọn được (ví dụ đã có người đặt). Ngày trong quá khứ luôn bị khoá. */
  isBlocked?: (d: Date) => boolean;
};

export function Calendar({ start, end, onPick, isBlocked }: CalendarProps) {
  const { colors, isDark } = useTheme();
  const { isVietnamese } = useLanguage();

  const [m, setM] = useState(() => {
    const n = start ?? new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const off = (m.getDay() + 6) % 7;
    const first = new Date(m.getFullYear(), m.getMonth(), 1 - off);
    return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  }, [m]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthTitle = useMemo(() => {
    if (isVietnamese) {
      return `Tháng ${m.getMonth() + 1}, ${m.getFullYear()}`;
    }
    return m.toLocaleString('en', { month: 'long', year: 'numeric' });
  }, [m, isVietnamese]);

  const dayHeaders = isVietnamese
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View>
      <View style={[S.between, { marginVertical: 8 }]}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
          {monthTitle}
        </Text>
        <View style={[S.row, { gap: 18 }]}>
          <Pressable onPress={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))} hitSlop={8}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {dayHeaders.map((d) => (
          <Text
            key={d}
            style={{
              flex: 1,
              textAlign: 'center',
              color: colors.primary,
              fontWeight: '700',
              marginVertical: 8,
              fontSize: 13,
            }}
          >
            {d}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          const out = d.getMonth() !== m.getMonth();
          const past = d < today;
          const sel = (start && same(d, start)) || (end && same(d, end));
          const mid = start && end && d > start && d < end;
          const taken = !past && !!isBlocked?.(d);
          const locked = past || taken;

          return (
            <Pressable
              key={i}
              disabled={locked}
              onPress={() => onPick(d)}
              style={{
                width: '14.285%',
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: mid ? (isDark ? 'rgba(0,188,212,0.25)' : colors.primaryLight) : 'transparent',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sel ? colors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: sel
                      ? '#fff'
                      : out || locked
                      ? (isDark ? '#4A5568' : '#C5C8D0')
                      : colors.text,
                    fontWeight: sel ? '700' : '400',
                    textDecorationLine: taken && !out ? 'line-through' : 'none',
                  }}
                >
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
