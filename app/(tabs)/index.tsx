import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openDatabaseSync } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';

const db = openDatabaseSync('shoe_store.db');

type Product = {
  id: number;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  imageUri?: string;
};

export default function ProductScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('Black');
  const [size, setSize] = useState('7');
  const [quantity, setQuantity] = useState('1');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const params = useLocalSearchParams();

  // NEW: Show/hide form state
  const [showForm, setShowForm] = useState(false);

    useEffect(() => {
    if (params.clearCart === '1') {
      setCart([]);
    }
  }, [params.clearCart]);

useEffect(() => {
  db.execSync(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, price INTEGER, color TEXT, size TEXT, quantity INTEGER
  );`);
  // Add imageUri column if it doesn't exist
  try {
    db.execSync(`ALTER TABLE products ADD COLUMN imageUri TEXT;`);
  } catch (e) {
    // Ignore error if column already exists
  }
  db.execSync(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price INTEGER
  );`);
  loadProducts();
}, []);

  const loadProducts = () => {
    const result = db.getAllSync('SELECT * FROM products ORDER BY id DESC;');
    const data = result.map((row: any) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      color: row.color,
      size: row.size,
      quantity: row.quantity,
      imageUri: row.imageUri,
    }));
    setProducts(data);
  };

  const addOrUpdateProduct = () => {
    const parsedPrice = parseInt(price);
    const parsedQty = parseInt(quantity);
    if (!name.trim() || isNaN(parsedPrice) || isNaN(parsedQty)) return;

    if (editingId !== null) {
      db.execSync(
        `UPDATE products SET name='${name}', price=${parsedPrice}, color='${color}', size='${size}', quantity=${parsedQty}, imageUri='${imageUri || ''}' WHERE id=${editingId};`
      );
    } else {
      db.execSync(
        `INSERT INTO products (name, price, color, size, quantity, imageUri) VALUES ('${name}', ${parsedPrice}, '${color}', '${size}', ${parsedQty}, '${imageUri || ''}');`
      );
    }

    setName('');
    setPrice('');
    setColor('Black');
    setSize('7');
    setQuantity('1');
    setEditingId(null);
    setImageUri(undefined);
    setShowForm(false); // Hide form after add/update
    loadProducts();
  };

  const deleteProduct = (id: number) => {
    db.execSync(`DELETE FROM products WHERE id=${id};`);
    loadProducts();
  };

  const startEdit = (product: Product) => {
    setName(product.name);
    setPrice(product.price.toString());
    setColor(product.color);
    setSize(product.size);
    setQuantity(product.quantity.toString());
    setEditingId(product.id);
    setImageUri(product.imageUri);
    setShowForm(true); // Show form when editing
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  // Image Picker Handler
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Navigate to cart screen, passing cart as param
  const goToCart = () => {
    router.push({ pathname: '/(tabs)/cart', params: { cart: JSON.stringify(cart) } });
  };

  // NEW: Cancel form handler
  const cancelForm = () => {
    setName('');
    setPrice('');
    setColor('Black');
    setSize('7');
    setQuantity('1');
    setEditingId(null);
    setImageUri(undefined);
    setShowForm(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Jhii Online Shoe Store</Text>
        <TouchableOpacity onPress={goToCart}>
          <Ionicons name="cart-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Add Product Button */}
      {!showForm && (
        <TouchableOpacity style={[styles.addButton, { marginBottom: 10 }]} onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}> Add Product</Text>
        </TouchableOpacity>
      )}

      {/* Form */}
      {showForm && (
        <View style={styles.form}>
          <TextInput placeholder="Product Name" style={styles.input} value={name} onChangeText={setName} />
          <TextInput placeholder="Price" style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />

          <View style={styles.row}>
            {['Black', 'White', 'Red'].map(c => (
              <TouchableOpacity key={c} style={[styles.option, color === c && styles.selected]} onPress={() => setColor(c)}>
                <Text>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            {['7', '8', '9', '10', '11', '12'].map(s => (
              <TouchableOpacity key={s} style={[styles.option, size === s && styles.selected]} onPress={() => setSize(s)}>
                <Text>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput placeholder="Quantity" style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />

          {/* Image Picker */}
          <TouchableOpacity style={[styles.addButton, { backgroundColor: '#888', marginBottom: 10 }]} onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}> {imageUri ? 'Change' : 'Add'} Picture</Text>
          </TouchableOpacity>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 10, borderRadius: 8 }} />
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={[styles.addButton, { flex: 1, marginRight: 5 }]} onPress={addOrUpdateProduct}>
              <Text style={styles.buttonText}>{editingId !== null ? 'Update Product' : 'Add Product'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.deleteButton, { flex: 1, marginLeft: 5 }]} onPress={cancelForm}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Product List */}
      <ScrollView style={{ width: '100%' }}>
        {products.map(product => (
          <View key={product.id} style={styles.itemBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {product.imageUri ? (
                <Image source={{ uri: product.imageUri }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 10 }} />
              ) : null}
              <View>
                <Text style={styles.itemText}>{product.name} - ₱{product.price}</Text>
                <Text>Color: {product.color} | Size: {product.size} | Qty: {product.quantity}</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.editButton} onPress={() => startEdit(product)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(product.id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cartButton} onPress={() => addToCart(product)}>
                <Text style={styles.buttonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F44336',
    padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  form: { padding: 10, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10 },
  input: { backgroundColor: '#eee', marginBottom: 10, padding: 10, borderRadius: 6 },
  row: { flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap' },
  option: { backgroundColor: '#ddd', padding: 8, marginRight: 6, marginBottom: 6, borderRadius: 6 },
  selected: { backgroundColor: '#bbb' },
  addButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 6, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  itemBox: { backgroundColor: '#fff', padding: 10, marginBottom: 8, borderRadius: 8 },
  itemText: { fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  editButton: { backgroundColor: '#2196F3', padding: 6, borderRadius: 6 },
  deleteButton: { backgroundColor: '#E53935', padding: 6, borderRadius: 6 },
  cartButton: { backgroundColor: '#FF9800', padding: 6, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});