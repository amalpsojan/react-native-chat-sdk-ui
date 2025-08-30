import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DocumentContent } from '../../../types/types';

// Simple file type mapping for MIME and iOS UTI
function getFileType(extension?: string): { mimeType?: string; uti?: string } {
  const ext = (extension || '').toLowerCase();
  switch (ext) {
    case 'pdf':
      return { mimeType: 'application/pdf', uti: 'com.adobe.pdf' };
    case 'doc':
      return { mimeType: 'application/msword', uti: 'com.microsoft.word.doc' };
    case 'docx':
      return { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uti: 'org.openxmlformats.wordprocessingml.document' };
    case 'xls':
      return { mimeType: 'application/vnd.ms-excel', uti: 'com.microsoft.excel.xls' };
    case 'xlsx':
      return { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uti: 'org.openxmlformats.spreadsheetml.sheet' };
    case 'csv':
      return { mimeType: 'text/csv', uti: 'public.comma-separated-values-text' };
    case 'ppt':
      return { mimeType: 'application/vnd.ms-powerpoint', uti: 'com.microsoft.powerpoint.ppt' };
    case 'pptx':
      return { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', uti: 'org.openxmlformats.presentationml.presentation' };
    case 'jpg':
    case 'jpeg':
      return { mimeType: 'image/jpeg', uti: 'public.jpeg' };
    case 'png':
      return { mimeType: 'image/png', uti: 'public.png' };
    case 'gif':
      return { mimeType: 'image/gif', uti: 'com.compuserve.gif' };
    case 'webp':
      return { mimeType: 'image/webp', uti: 'public.webp' };
    case 'heic':
      return { mimeType: 'image/heic', uti: 'public.heic' };
    case 'bmp':
      return { mimeType: 'image/bmp', uti: 'com.microsoft.bmp' };
    case 'tiff':
      return { mimeType: 'image/tiff', uti: 'public.tiff' };
    case 'mp3':
      return { mimeType: 'audio/mpeg', uti: 'public.mp3' };
    case 'm4a':
      return { mimeType: 'audio/m4a', uti: 'com.apple.m4a-audio' };
    case 'aac':
      return { mimeType: 'audio/aac', uti: 'public.aac-audio' };
    case 'wav':
      return { mimeType: 'audio/wav', uti: 'com.microsoft.waveform-audio' };
    case 'ogg':
      return { mimeType: 'audio/ogg', uti: 'org.xiph.ogg-audio' };
    case 'flac':
      return { mimeType: 'audio/flac', uti: 'org.xiph.flac' };
    case 'amr':
      return { mimeType: 'audio/amr', uti: 'org.3gpp.amr' };
    case 'opus':
      return { mimeType: 'audio/opus', uti: 'org.xiph.opus' };
    case 'mp4':
      return { mimeType: 'video/mp4', uti: 'public.mpeg-4' };
    case 'mov':
      return { mimeType: 'video/quicktime', uti: 'com.apple.quicktime-movie' };
    case 'mkv':
      return { mimeType: 'video/x-matroska', uti: 'org.matroska.mkv' };
    case 'avi':
      return { mimeType: 'video/x-msvideo', uti: 'public.avi' };
    case 'webm':
      return { mimeType: 'video/webm', uti: 'org.webmproject.webm' };
    case 'zip':
      return { mimeType: 'application/zip', uti: 'com.pkware.zip-archive' };
    case 'rar':
      return { mimeType: 'application/vnd.rar', uti: 'com.rarlab.rar-archive' };
    case '7z':
      return { mimeType: 'application/x-7z-compressed', uti: 'org.7-zip.7-zip-archive' };
    case 'tar':
      return { mimeType: 'application/x-tar', uti: 'public.tar-archive' };
    case 'gz':
      return { mimeType: 'application/gzip', uti: 'org.gnu.gnu-zip-archive' };
    default:
      return { mimeType: undefined, uti: undefined };
  }
}

const MessageDocument = ({ content }: { content: DocumentContent }) => {
  const [isLoading, setIsLoading] = useState(false);

  const { extension, iconName, tileBg } = useMemo(() => {
    const nameFromUrl = (() => {
      try {
        const url = content?.document || '';
        const path = url.split('?')[0].split('#')[0];
        return path.substring(path.lastIndexOf('/') + 1);
      } catch {
        return '';
      }
    })();

    const fullName = content?.fileName || nameFromUrl || '';
    const rawExt = (fullName.split('.').pop() || '').toLowerCase();

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'tiff'].includes(rawExt);
    const isPdf = rawExt === 'pdf';
    const isExcel = ['xls', 'xlsx', 'csv', 'xlsm', 'xlsb'].includes(rawExt);
    const isPpt = ['ppt', 'pptx', 'pps', 'ppsx'].includes(rawExt);
    const isAudio = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'flac', 'amr', 'opus'].includes(rawExt);
    const isDoc = ['doc', 'docx'].includes(rawExt);
    const isZip = ['zip', 'rar', '7z', 'tar', 'gz'].includes(rawExt);
    const isVideo = ['mp4', 'mov', 'mkv', 'avi', 'webm'].includes(rawExt);

    let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'file-outline';
    let tileBg = '#7E57C2';

    if (isImage) { iconName = 'file-image'; tileBg = '#0B87FF'; }
    else if (isPdf) { iconName = 'file-pdf-box'; tileBg = '#E73B2E'; }
    else if (isExcel) { iconName = 'file-excel'; tileBg = '#21A366'; }
    else if (isPpt) { iconName = 'file-powerpoint'; tileBg = '#D24726'; }
    else if (isAudio) { iconName = 'file-music'; tileBg = '#7E57C2'; }
    else if (isVideo) { iconName = 'file-video'; tileBg = '#0B87FF'; }
    else if (isDoc) { iconName = 'file-word'; tileBg = '#2B579A'; }
    else if (isZip) { iconName = 'archive'; tileBg = '#F4B400'; }
    else { iconName = 'file-document-outline'; tileBg = '#607D8B'; }

    return { extension: (rawExt || 'file').toUpperCase(), iconName, tileBg };
  }, [content?.fileName, content?.document]);

  const openFile = useCallback(async (uri: string, mimeType?: string, uti?: string) => {
    if (Platform.OS === 'android') {
      try {
        const cUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: cUri,
          flags: 1,
          type: mimeType,
        });
      } catch (e) {
        Alert.alert('Error', 'Could not open this file type.');
      }
    } else {
      try {
        const isSharable = await Sharing.isAvailableAsync();
        if (!isSharable) {
          Alert.alert('Error', 'Sharing is not available on this device.');
          return;
        }
        await Sharing.shareAsync(uri, { mimeType, UTI: uti });
      } catch (error) {
        Alert.alert('Error', 'Failed to open the file.');
      }
    }
  }, []);

  const downloadFile = useCallback(async (remoteUri: string, localUri: string) => {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(remoteUri, localUri);
      const result = await downloadResumable.downloadAsync();
      return result?.uri;
    } catch (e) {
      throw e;
    }
  }, []);

  const handlePress = useCallback(async () => {
    const docUri = content?.document;
    if (!docUri) {
      Alert.alert('Error', 'File URI is not available.');
      return;
    }

    const fileNameFromUrl = (() => {
      const url = docUri.split('?')[0].split('#')[0];
      const last = url.substring(url.lastIndexOf('/') + 1);
      return last || 'file';
    })();

    const baseName = content.fileName || fileNameFromUrl;
    const ext = (baseName.split('.').pop() || '').toLowerCase();
    const { mimeType, uti } = getFileType(ext);

    const isRemote = /^https?:\/\//i.test(docUri);

    try {
      setIsLoading(true);
      let localPath = docUri;

      if (isRemote) {
        const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const localUri = `${FileSystem.documentDirectory}${safeName}`;
        const info = await FileSystem.getInfoAsync(localUri);
        if (!info.exists) {
          await downloadFile(docUri, localUri);
        }
        localPath = localUri;
      }

      await openFile(localPath, mimeType, uti);
    } catch (error) {
      Alert.alert('Error', 'Failed to open the file.');
    } finally {
      setIsLoading(false);
    }
  }, [content?.document, content?.fileName, downloadFile, openFile]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.row} disabled={isLoading}>
        <View style={[styles.iconContainer, { backgroundColor: tileBg }]}>
          <MaterialCommunityIcons name={iconName} size={24} color="#fff" />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="tail">
            {content.fileName}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.extBadge}>
              <Text style={styles.extText}>{extension}</Text>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#999" />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={18} color="#999" />
            )}
          </View>
        </View>
      </TouchableOpacity>
      {content.caption ? (
        <Text style={styles.caption} numberOfLines={3}>
          {content.caption}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { minWidth: 220 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 2,
  },
  fileName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#111',
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EEF1F4',
  },
  extText: {
    fontSize: 11,
    color: '#667085',
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    color: '#555',
    marginTop: 6,
  },
});

export default MessageDocument; 