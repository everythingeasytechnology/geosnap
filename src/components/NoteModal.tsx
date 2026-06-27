import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onSubmit: (note: string) => void;
  onSkip: () => void;
};

export function NoteModal({ visible, onSubmit, onSkip }: Props) {
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onSubmit(note.trim());
    setNote('');
  };

  const handleSkip = () => {
    setNote('');
    onSkip();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.backdrop} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Icon + title */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="pencil" size={20} color="#3244C2" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Add a Note</Text>
              <Text style={styles.subtitle}>Optionally describe what you captured</Text>
            </View>
          </View>

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="What's happening here?"
            placeholderTextColor="#ABABAB"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            autoFocus
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit
          />

          {/* Buttons */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.88}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>Add Note</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EEEEEE',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF1FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6E6E6E',
  },
  input: {
    backgroundColor: '#F5F7FF',
    borderWidth: 1.5,
    borderColor: '#EEF1FD',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111111',
    minHeight: 110,
    marginBottom: 18,
  },
  submitBtn: {
    backgroundColor: '#3244C2',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  skipBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6E6E6E',
    fontWeight: '500',
  },
});
