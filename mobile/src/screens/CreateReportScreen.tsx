import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { Report, ReportCreate, ReportUpdate } from '../types';
import { apiService } from '../services/api';

const CreateReportScreen = ({ navigation, route }: any) => {
  const { report } = route.params || {};
  const isEditing = !!report;
  
  const [eventDate, setEventDate] = useState(
    report?.event_date ? report.event_date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [content, setContent] = useState(report?.content || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter report content');
      return;
    }

    if (!eventDate) {
      Alert.alert('Error', 'Please select an event date');
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        const updateData: ReportUpdate = {
          event_date: eventDate,
          content: content.trim(),
        };
        await apiService.updateReport(report.id, updateData);
        Alert.alert('Success', 'Report updated successfully');
      } else {
        const newReport: ReportCreate = {
          event_date: eventDate,
          content: content.trim(),
        };
        await apiService.createReport(newReport);
        Alert.alert('Success', 'Report created successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Error', 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;

    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.deleteReport(report.id);
              Alert.alert('Success', 'Report deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Report' : 'Create Report'}
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Date</Text>
              <TextInput
                style={styles.dateInput}
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <Text style={styles.helpText}>
                The date when the badminton event happened
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Report Content</Text>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="Describe what happened during your badminton session..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <Text style={styles.helpText}>
                Share your experience, highlights, or any interesting moments
              </Text>
            </View>

            {isEditing && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={loading}
              >
                <Text style={styles.deleteButtonText}>Delete Report</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateReportScreen;
