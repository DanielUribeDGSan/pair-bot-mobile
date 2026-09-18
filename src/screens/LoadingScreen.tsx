import React from 'react';
import { View, StyleSheet, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fake Header */}
        <View style={styles.header}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonIcon} />
        </View>

        {/* Welcome Title Skeleton */}
        <View style={styles.titleSkeleton} />

        {/* Input Box Skeleton */}
        <View style={styles.inputContainer}>
          <View style={styles.inputLinesContainer}>
            <View style={[styles.skeletonLine, { width: '80%' }]} />
            <View style={[styles.skeletonLine, { width: '50%' }]} />
          </View>
          <View style={styles.inputBottomRow}>
            <View style={styles.modelSkeleton} />
            <View style={styles.buttonSkeleton} />
          </View>
        </View>

        {/* Quick Actions Skeleton */}
        <View style={styles.quickActions}>
          <View style={styles.quickActionBtn} />
          <View style={styles.quickActionBtn} />
        </View>

        {/* Recommendations Skeleton */}
        <View style={styles.recommendationsContainer}>
          <View style={styles.recHeader} />
          <View style={styles.cardsRow}>
            <View style={[styles.card, { marginRight: 8 }]} />
            <View style={[styles.card, { marginLeft: 8 }]} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 60,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#242424',
  },
  skeletonTitle: {
    width: 100,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#242424',
  },
  titleSkeleton: {
    width: 250,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#242424',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242424',
    height: 120,
    justifyContent: 'space-between',
  },
  inputLinesContainer: {
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#242424',
  },
  inputBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelSkeleton: {
    width: 100,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#242424',
  },
  buttonSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#242424',
  },
  quickActions: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 600,
    marginTop: 16,
    gap: 8,
  },
  quickActionBtn: {
    width: 140,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#242424',
  },
  recommendationsContainer: {
    width: '100%',
    maxWidth: 600,
    marginTop: 48,
  },
  recHeader: {
    width: 200,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#242424',
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
  },
  card: {
    flex: 1,
    backgroundColor: '#222222',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
  }
});
