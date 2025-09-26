import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Platform } from 'react-native';
import { Report } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MainNavigation } from '../components/MainNavigation';

interface ReportsScreenProps {
  onNavigateToCreateReport?: () => void;
  onNavigateToReportDetail?: (report: any) => void;
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({ onNavigateToCreateReport, onNavigateToReportDetail }) => {
  // Only use navigation on non-web platforms
  let navigation: any = null;
  if (Platform.OS !== 'web') {
    // For mobile, we'd need to get navigation from useNavigation hook
    // but since this screen is now rendered directly, we'll handle it differently
  }
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 20,
    total: 0,
    has_more: false
  });
  const [unseenCount, setUnseenCount] = useState(0);
  const { user } = useAuth();

  const loadReports = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPagination(prev => ({ ...prev, skip: 0 }));
      } else {
        setLoadingMore(true);
      }

      const currentSkip = reset ? 0 : pagination.skip;
      const params: any = {
        skip: currentSkip,
        limit: pagination.limit,
      };
      
      if (searchText.trim()) {
        params.search_text = searchText.trim();
      }
      if (dateFrom) {
        params.event_date_from = dateFrom;
      }
      if (dateTo) {
        params.event_date_to = dateTo;
      }

      const response = await apiService.getReports(params);
      
      if (reset) {
        setReports(response.reports);
      } else {
        setReports(prev => [...prev, ...response.reports]);
      }
      
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load reports on mount and when dependencies change
  useEffect(() => {
    loadReports(true);
    loadUnseenCount();
  }, [searchText, dateFrom, dateTo]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports(true);
  };

  const handleSearch = () => {
    loadReports(true);
  };

  const loadMoreReports = () => {
    if (!loadingMore && pagination.has_more) {
      setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }));
      loadReports(false);
    }
  };

  const loadUnseenCount = async () => {
    try {
      const response = await apiService.getUnseenReportsCount();
      setUnseenCount(response.unseen_count);
    } catch (error) {
      console.error('Error loading unseen count:', error);
    }
  };

  const markReportAsSeen = async (reportId: number) => {
    try {
      await apiService.markReportSeen(reportId);
      // Update the report in the list to mark it as seen
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, has_seen: true } : report
      ));
      // Update unseen count
      setUnseenCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking report as seen:', error);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setShowFilters(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={[styles.reportCard, !item.has_seen && styles.unseenReportCard]}
      onPress={() => {
        // Mark as seen if not already seen
        if (!item.has_seen) {
          markReportAsSeen(item.id);
        }
        if (Platform.OS === 'web' && onNavigateToReportDetail) {
          onNavigateToReportDetail(item);
        } else if (navigation) {
          navigation.navigate('ReportDetail', { report: item });
        }
      }}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <Text style={styles.reportDate}>{formatDate(item.event_date)}</Text>
          {!item.has_seen && <View style={styles.unseenIndicator} />}
        </View>
        <Text style={styles.reportAuthor}>
          by {item.created_by?.full_name || `User ${item.created_by_id}`}
        </Text>
      </View>
      <Text style={styles.reportContent} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.reportFooter}>
        <Text style={styles.reportTimestamp}>
          {formatDateTime(item.created_at)}
        </Text>
        {item.reaction_counts && Object.keys(item.reaction_counts).length > 0 && (
          <View style={styles.reactionsContainer}>
            {Object.entries(item.reaction_counts).map(([emoji, count]) => (
              <View key={emoji} style={styles.reactionItem}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{count}</Text>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.addReactionButton}
              onPress={() => {
                if (Platform.OS === 'web' && onNavigateToReportDetail) {
                  onNavigateToReportDetail(item);
                } else if (navigation) {
                  navigation.navigate('ReportDetail', { report: item });
                }
              }}
            >
              <Text style={styles.addReactionText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search reports..."
        value={searchText}
        onChangeText={setSearchText}
        onSubmitEditing={handleSearch}
      />
      <View style={styles.dateInputsContainer}>
        <TextInput
          style={styles.dateInput}
          placeholder="From date (YYYY-MM-DD)"
          value={dateFrom}
          onChangeText={setDateFrom}
        />
        <TextInput
          style={styles.dateInput}
          placeholder="To date (YYYY-MM-DD)"
          value={dateTo}
          onChangeText={setDateTo}
        />
      </View>
      <View style={styles.filterButtons}>
        <TouchableOpacity style={styles.filterButton} onPress={handleSearch}>
          <Text style={styles.filterButtonText}>Apply Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <MainNavigation title="📋 Reports" showTabs={false}>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Reports</Text>
          {unseenCount > 0 && (
            <View style={styles.unseenCountBadge}>
              <Text style={styles.unseenCountText}>{unseenCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (Platform.OS === 'web' && onNavigateToCreateReport) {
              onNavigateToCreateReport();
            } else if (navigation) {
              navigation.navigate('CreateReport');
            }
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Text>
      </TouchableOpacity>

      {showFilters && renderFilters()}

      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        onEndReached={loadMoreReports}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingMoreText}>Loading more reports...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              {searchText || dateFrom || dateTo
                ? 'Try adjusting your filters'
                : 'Be the first to create a report!'}
            </Text>
          </View>
        }
      />
      </SafeAreaView>
    </MainNavigation>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  unseenCountBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  unseenCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterToggle: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterToggleText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginHorizontal: 5,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 5,
  },
  filterButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginLeft: 5,
  },
  clearButtonText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unseenReportCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  reportAuthor: {
    fontSize: 14,
    color: '#666',
  },
  reportContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginTop: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  addReactionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    marginTop: 2,
  },
  addReactionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unseenIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default ReportsScreen;
