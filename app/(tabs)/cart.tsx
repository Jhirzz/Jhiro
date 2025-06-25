import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openDatabaseSync } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';

const db = openDatabaseSync('shoe_store.db');

type Product = {
  id: number;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
};

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cart: Product[] = params.cart ? JSON.parse(params.cart as string) : [];
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    db.execSync(`CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price INTEGER);`);
    loadProfit();
  }, []);

  const loadProfit = () => {
    const result = db.getFirstSync<{ total: number | null }>('SELECT SUM(price) as total FROM sales;');
    setProfit(result?.total || 0);
  };

    const checkout = () => {
    for (let item of cart) {
        db.execSync(`INSERT INTO sales (name, price) VALUES ('${item.name}', ${item.price});`);
    }
    loadProfit();
    // Go back to product screen and signal to clear the cart
    router.replace({ pathname: '/(tabs)', params: { clearCart: '1' } });
    };

  const total = cart.reduce((sum: number, item: Product) => sum + item.price, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Cart</Text>
      <Text style={styles.profit}>Profit: ₱{profit}</Text>
      <ScrollView style={{ width: '100%' }}>
        {cart.length === 0 ? (
          <Text style={styles.emptyText}>No items in cart.</Text>
        ) : (
          cart.map((item: Product, index: number) => (
            <View key={index} style={styles.itemBox}>
              <Text style={styles.itemText}>{item.name} - ₱{item.price}</Text>
              <Text>Color: {item.color} | Size: {item.size}</Text>
            </View>
          ))
        )}
      </ScrollView>
      {cart.length > 0 && (
        <TouchableOpacity style={styles.checkoutButton} onPress={checkout}>
          <Text style={styles.checkoutText}>Checkout ₱{total}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#F8F9FA' },
  title: { color: '#F44336', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  profit: { fontSize: 18, color: '#4CAF50', marginBottom: 10 },
  itemBox: { backgroundColor: '#fff', padding: 10, marginBottom: 8, borderRadius: 8 },
  itemText: { fontSize: 16, fontWeight: '600' },
  checkoutButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 50 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#2196F3', padding: 10, borderRadius: 6, alignSelf: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
});