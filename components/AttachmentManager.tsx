import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Paperclip, X, FileText, Image, File } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Attachment } from '@/types/invoice';

import * as Sharing from 'expo-sharing';

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAddAttachment: (attachment: Attachment) => Promise<void>;
  onRemoveAttachment: (attachmentId: string) => Promise<void>;
  editable?: boolean;
}

export function AttachmentManager({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  editable = true,
}: AttachmentManagerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image size={20} color={Colors.primary} />;
    } else if (type === 'application/pdf' || type.includes('pdf')) {
      return <FileText size={20} color={Colors.danger} />;
    } else {
      return <File size={20} color={Colors.textSecondary} />;
    }
  };

  const handlePickDocument = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Create attachment object
        const attachment: Attachment = {
          id: Date.now().toString(),
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          uploadedAt: new Date().toISOString(),
        };

        await onAddAttachment(attachment);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to attach document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    Alert.alert(
      'Remove Attachment',
      'Are you sure you want to remove this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveAttachment(attachmentId),
        },
      ]
    );
  };

  const handleViewAttachment = async (attachment: Attachment) => {
    try {
      if (Platform.OS === 'web') {
        // On web, open in new tab
        window.open(attachment.uri, '_blank');
      } else {
        // On mobile, share the file
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(attachment.uri, {
            mimeType: attachment.type,
            dialogTitle: attachment.name,
          });
        } else {
          Alert.alert('Info', 'Unable to open this file on your device.');
        }
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
      Alert.alert('Error', 'Failed to open attachment.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attachments</Text>
        {editable && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handlePickDocument}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Paperclip size={16} color={Colors.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {attachments.length === 0 ? (
        <View style={styles.emptyState}>
          <Paperclip size={32} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No attachments</Text>
          {editable && (
            <Text style={styles.emptySubtext}>
              Tap &quot;Add&quot; to attach documents, images, or other files
            </Text>
          )}
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.attachmentsList}
        >
          {attachments.map((attachment) => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.attachmentCard}
              onPress={() => handleViewAttachment(attachment)}
              activeOpacity={0.7}
            >
              <View style={styles.attachmentIcon}>
                {getFileIcon(attachment.type)}
              </View>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Text style={styles.attachmentSize}>
                {formatFileSize(attachment.size)}
              </Text>
              {editable && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveAttachment(attachment.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.danger} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  attachmentsList: {
    flexGrow: 0,
  },
  attachmentCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 140,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  attachmentIcon: {
    marginBottom: 8,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  attachmentSize: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 2,
  },
});